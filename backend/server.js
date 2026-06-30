require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { User, Story, Resource, Achievement, Folder, PendingStory, PendingResource } = require('./models');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

const JWT_SECRET = process.env.JWT_SECRET || 'spit_loop_super_secret_jwt_key_2026';

// Define Global Rate Limiter (Max 100 requests per 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Define Login/Auth Rate Limiter (Max 5 attempts per 15 min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Middlewares

// Enable CORS with restricted origin access
const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost and ngrok tunnels
    // Allow localhost, ngrok tunnels, and Vercel deployments
    if (
      process.env.ALLOWED_ORIGIN === '*' ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.ngrok-free.app') ||
      origin.endsWith('.ngrok.io') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Helmet secure headers & custom Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "http://localhost:5173", "http://127.0.0.1:5173"],
      frameSrc: ["'self'", "data:", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Custom Permissions Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), interest-cohort=()'
  );
  next();
});

app.use(express.json({ limit: '100mb' }));

// Apply Global Limiter to all API endpoints
app.use('/api/', globalLimiter);

// Apply strict rate limiting to login and registration routes
app.use('/api/users/login', loginLimiter);
app.use('/api/users/register-request', loginLimiter);

// Prevent NoSQL query injection by stripping keys starting with $ or .
app.use(mongoSanitize());

// --- Helper Functions for Security & File Uploads ---

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

function saveBase64File(dataUri, prefix = 'file') {
  if (!dataUri || typeof dataUri !== 'string') return dataUri;
  if (!dataUri.startsWith('data:')) return dataUri;

  try {
    const parts = dataUri.split(',');
    if (parts.length < 2) return dataUri;
    const header = parts[0];
    const data = parts[1];

    const mimeMatch = header.match(/data:(.*?);base64/);
    if (!mimeMatch) return dataUri;
    const mime = mimeMatch[1];

    let ext = '';
    if (mime === 'application/pdf') ext = '.pdf';
    else if (mime === 'image/png') ext = '.png';
    else if (mime === 'image/jpeg' || mime === 'image/jpg') ext = '.jpg';
    else if (mime === 'image/webp') ext = '.webp';
    else if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ext = '.xlsx';
    else if (mime === 'application/vnd.ms-excel') ext = '.xls';
    else if (mime === 'text/plain') ext = '.txt';
    else ext = '.bin';

    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 file:', err);
    return dataUri;
  }
}

function processStoryFiles(story) {
  if (!story) return story;
  if (story.photo) {
    story.photo = saveBase64File(story.photo, 'photo');
  }
  if (story.resumeFile && story.resumeFile.url) {
    story.resumeFile.url = saveBase64File(story.resumeFile.url, 'resume');
  }
  if (story.studyMaterials && Array.isArray(story.studyMaterials)) {
    story.studyMaterials = story.studyMaterials.map(material => {
      if (material.url) {
        material.url = saveBase64File(material.url, 'material');
      }
      return material;
    });
  }
  return story;
}

function processResourceFiles(resource) {
  if (!resource) return resource;
  if (resource.link) {
    resource.link = saveBase64File(resource.link, 'resource');
  }
  return resource;
}

function processAchievementFiles(achievement) {
  if (!achievement) return achievement;
  if (achievement.image) {
    achievement.image = saveBase64File(achievement.image, 'achievement');
  }
  return achievement;
}

// HTML tag stripping to prevent Stored XSS
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

// Deep sanitization of objects
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

// Base64 file URI validation
function validateFileUri(uri, allowedPrefixes) {
  if (!uri) return true; // Optional field is valid
  if (typeof uri !== 'string') return false;
  if (!uri.startsWith('data:')) {
    // Relative local paths or anchors are allowed, but block script injections
    if (uri.toLowerCase().startsWith('javascript:')) return false;
    return true;
  }
  return allowedPrefixes.some(prefix => uri.startsWith(prefix));
}

const ALLOWED_IMAGE_PREFIXES = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,', 'data:image/jpg;base64,'];
const ALLOWED_PDF_PREFIXES = ['data:application/pdf;base64,'];
const ALLOWED_DOC_PREFIXES = [...ALLOWED_IMAGE_PREFIXES, ...ALLOWED_PDF_PREFIXES];

// --- JWT Verification & Authorization Middlewares ---

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Find active user in DB to verify status is active
    const user = await User.findOne({ email: new RegExp('^' + decoded.email.trim() + '$', 'i') });
    if (!user) {
      return res.status(401).json({ error: 'User session invalid. User not found.' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is inactive or pending approval.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session expired or token invalid. Please sign in again.' });
  }
}

function requireAdmin(req, res, next) {
  const isUserAdmin = req.user && (req.user.email.toLowerCase() === 'admin@spit.ac.in' || req.user.role === 'Administrator' || req.user.role === 'Admin');
  if (!isUserAdmin) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}


// Database connection
const primaryUri = process.env.MONGODB_URI;
const fallbackUri = 'mongodb://127.0.0.1:27017/loop_db';

// Disable buffering so that queries fail fast instead of hanging when database is offline
mongoose.set('bufferCommands', false);

async function connectWithFallback() {
  if (primaryUri && primaryUri !== fallbackUri) {
    console.log('Attempting to connect to primary MongoDB database...');
    try {
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 4000, // fail fast
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true
        }
      });
      console.log('Connected to primary MongoDB database successfully.');
      return;
    } catch (err) {
      console.error('Primary MongoDB connection error:', err.message);
      console.log('Falling back to local MongoDB database...');
    }
  }

  try {
    await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log('Connected to local fallback MongoDB successfully.');
  } catch (err) {
    console.error('Local fallback MongoDB connection error:', err.message);
  }
}

connectWithFallback();

// Middleware to check database connection status before handling API requests
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database connection is not established. Please make sure MongoDB is running locally or check your credentials in the server\'s .env file, verify network availability, and ensure your IP is whitelisted in MongoDB Atlas.' 
    });
  }
  next();
});

// Helper to escape regex special characters (blocks ReDoS)
function escapeRegExp(string) {
  if (typeof string !== 'string') return string;
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Routes

// 1. Folders
app.get('/api/folders', authenticateToken, async (req, res) => {
  try {
    const folders = await Folder.find({});
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/folders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sanitizedBody = sanitizeObject({ ...req.body });
    const folder = await Folder.create(sanitizedBody);
    res.status(201).json(folder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/folders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const sanitizedId = sanitizeString(id);
    await Folder.deleteOne({ id: sanitizedId });
    
    // Update any subfolders to make them root folders
    await Folder.updateMany({ parentId: sanitizedId }, { parentId: null });
    
    // Re-assign study resources inside deleted folder to a fallback folder 'sem-1'
    await Resource.updateMany({ folderId: sanitizedId }, { folderId: 'sem-1' });
    
    res.json({ message: 'Folder deleted and orphaned entities re-assigned.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: strip password from a user document before sending to client
function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

// 2. Users
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, role, password, name, branch, currentYear, status } = req.body;

    // Required field check
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required.' });
    }
    if (typeof email !== 'string' || email.length > 200) {
      return res.status(400).json({ error: 'Invalid email.' });
    }
    if (typeof role !== 'string' || role.length > 100) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (name && (typeof name !== 'string' || name.length > 200)) {
      return res.status(400).json({ error: 'Invalid name.' });
    }
    if (branch && (typeof branch !== 'string' || branch.length > 100)) {
      return res.status(400).json({ error: 'Invalid branch.' });
    }

    const passwordVal = (password && typeof password === 'string') ? password.trim() : 'spit123';
    const hashedPassword = await bcrypt.hash(passwordVal, 10);

    const userData = {
      email: email.trim().toLowerCase(),
      role: sanitizeString(role.trim()),
      password: hashedPassword,
      name: name ? sanitizeString(name.trim()) : '',
      branch: branch ? sanitizeString(branch.trim()) : '',
      currentYear: currentYear ? sanitizeString(String(currentYear).trim()) : '',
      status: status || 'Active',
    };

    const user = await User.create(userData);
    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    // Type and length validation
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input types.' });
    }
    if (email.length > 100 || password.length > 100) {
      return res.status(400).json({ error: 'Inputs exceed maximum permitted length.' });
    }

    // Case-insensitive, trimmed, regex-escaped email search (prevents ReDoS)
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(401).json({ error: 'User not found in the database. Please contact an administrator.' });
    }
    
    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your registration request is pending administrator approval.' });
    }
    
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact an administrator.' });
    }
    
    // Compare bcrypt passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    
    // Sign JWT
    const token = jwt.sign(
      { email: user.email, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const isUserAdmin = user.email.toLowerCase() === 'admin@spit.ac.in' || user.role === 'Administrator' || user.role === 'Admin';
    res.json({
      email: user.email,
      role: isUserAdmin ? 'Administrator' : user.role,
      status: user.status,
      name: user.name,
      branch: user.branch,
      currentYear: user.currentYear,
      onboarded: isUserAdmin ? true : user.onboarded,
      isAdmin: isUserAdmin,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/register-request', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    // Type and length validation
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input types.' });
    }
    if (email.length > 100 || password.length > 100) {
      return res.status(400).json({ error: 'Inputs exceed maximum permitted length.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@spit.ac.in')) {
      return res.status(400).json({ error: 'Please use your official SPIT email address (@spit.ac.in).' });
    }
    
    const existingUser = await User.findOne({ email: new RegExp('^' + escapeRegExp(trimmedEmail) + '$', 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered. Please try logging in.' });
    }
    
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = await User.create({
      email: trimmedEmail,
      password: hashedPassword,
      role: 'Student',
      status: 'Pending',
      onboarded: false
    });
    
    res.status(201).json({ message: 'Registration request submitted successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/approve-registration', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.status = 'Active';
    await user.save();
    
    res.json({ message: 'User registration approved successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:email', authenticateToken, async (req, res) => {
  try {
    const email = req.params.email;
    
    // Authorization Check: Admin can edit anyone, users can only edit themselves
    const isUserAdmin = req.user.email.toLowerCase() === 'admin@spit.ac.in' || req.user.role === 'Administrator' || req.user.role === 'Admin';
    if (!isUserAdmin && req.user.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
    }

    const { name, role, branch, currentYear, status, password } = req.body;

    // Input size limits
    if (name !== undefined && (typeof name !== 'string' || name.length > 200)) {
      return res.status(400).json({ error: 'Invalid name.' });
    }
    if (role !== undefined && (typeof role !== 'string' || role.length > 100)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (branch !== undefined && (typeof branch !== 'string' || branch.length > 100)) {
      return res.status(400).json({ error: 'Invalid branch.' });
    }
    if (password !== undefined && (typeof password !== 'string' || password.length > 100)) {
      return res.status(400).json({ error: 'Invalid password.' });
    }
    
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (name !== undefined) user.name = sanitizeString(name.trim());
    if (branch !== undefined) user.branch = sanitizeString(branch.trim());
    if (currentYear !== undefined) user.currentYear = sanitizeString(String(currentYear).trim());
    
    // Status can only be changed by Admin
    if (status !== undefined && isUserAdmin) {
      user.status = status;
    }
    
    // Hash password if modified
    if (password !== undefined && password.trim()) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }
    
    // Prevent changing admin's role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      if (role !== undefined) user.role = sanitizeString(role.trim());
    }
    
    await user.save();
    
    res.json({ message: 'User updated successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:email/onboard', authenticateToken, async (req, res) => {
  try {
    const email = req.params.email;
    
    // Authorization Check: A user can only onboard themselves
    if (req.user.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({ error: 'Access denied. You can only onboard your own profile.' });
    }

    const { name, role, branch, currentYear } = req.body;
    
    if (!name || !role || !branch || !currentYear) {
      return res.status(400).json({ error: 'Name, role, branch, and current year are all required for onboarding.' });
    }
    
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.name = sanitizeString(name.trim());
    // Do not allow changing admin@spit.ac.in's role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      user.role = sanitizeString(role.trim());
    } else {
      user.role = 'Administrator';
    }
    user.branch = sanitizeString(branch.trim());
    user.currentYear = sanitizeString(currentYear.trim());
    user.onboarded = true;
    
    await user.save();
    
    const isUserAdmin = user.email.toLowerCase() === 'admin@spit.ac.in' || user.role === 'Administrator' || user.role === 'Admin';
    res.json({
      email: user.email,
      role: isUserAdmin ? 'Administrator' : user.role,
      status: user.status,
      name: user.name,
      branch: user.branch,
      currentYear: user.currentYear,
      onboarded: user.onboarded,
      isAdmin: isUserAdmin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    // Block deleting the root admin
    if (email.trim().toLowerCase() === 'admin@spit.ac.in') {
      return res.status(400).json({ error: 'Root administrator account cannot be deleted.' });
    }
    await User.deleteOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/edit-request', authenticateToken, async (req, res) => {
  try {
    const email = req.params.email;
    
    // Authorization Check: A user can only submit edit request for themselves
    if (req.user.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({ error: 'Access denied. You can only request edits for your own profile.' });
    }

    const { name, role, branch, currentYear } = req.body;
    
    if (!name || !role || !branch || !currentYear) {
      return res.status(400).json({ error: 'Name, role, branch, and current year are all required.' });
    }
    
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Set pending fields
    user.pendingName = sanitizeString(name.trim());
    // Do not allow admin@spit.ac.in to change their Administrator role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      user.pendingRole = sanitizeString(role.trim());
    } else {
      user.pendingRole = 'Administrator';
    }
    user.pendingBranch = sanitizeString(branch.trim());
    user.pendingCurrentYear = sanitizeString(currentYear.trim());
    user.hasPendingEdit = true;
    
    await user.save();
    
    const isUserAdmin = user.email.toLowerCase() === 'admin@spit.ac.in' || user.role === 'Administrator' || user.role === 'Admin';
    res.json({
      email: user.email,
      role: isUserAdmin ? 'Administrator' : user.role,
      status: user.status,
      name: user.name,
      branch: user.branch,
      currentYear: user.currentYear,
      onboarded: user.onboarded,
      isAdmin: isUserAdmin,
      pendingName: user.pendingName,
      pendingRole: user.pendingRole,
      pendingBranch: user.pendingBranch,
      pendingCurrentYear: user.pendingCurrentYear,
      hasPendingEdit: user.hasPendingEdit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/approve-edit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (!user.hasPendingEdit) {
      return res.status(400).json({ error: 'No pending edit request found for this user.' });
    }
    
    // Copy pending fields to active fields
    user.name = user.pendingName;
    user.role = user.pendingRole;
    user.branch = user.pendingBranch;
    user.currentYear = user.pendingCurrentYear;
    
    // Clear pending fields
    user.pendingName = '';
    user.pendingRole = '';
    user.pendingBranch = '';
    user.pendingCurrentYear = '';
    user.hasPendingEdit = false;
    
    await user.save();
    
    res.json({ message: 'User profile edit approved successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/reject-edit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    
    const user = await User.findOne({ email: new RegExp('^' + escapeRegExp(email.trim()) + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Clear pending fields
    user.pendingName = '';
    user.pendingRole = '';
    user.pendingBranch = '';
    user.pendingCurrentYear = '';
    user.hasPendingEdit = false;
    
    await user.save();
    
    res.json({ message: 'User profile edit rejected successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to validate story payload files
function validateStoryFiles(payload) {
  if (payload.photo && !validateFileUri(payload.photo, ALLOWED_IMAGE_PREFIXES)) {
    return 'Invalid story profile photo file format. Only JPEG, PNG, and WebP images are allowed.';
  }
  if (payload.resumeFile && payload.resumeFile.url && !validateFileUri(payload.resumeFile.url, ALLOWED_PDF_PREFIXES)) {
    return 'Invalid resume file format. Only PDF documents are allowed.';
  }
  if (payload.studyMaterials && Array.isArray(payload.studyMaterials)) {
    for (const material of payload.studyMaterials) {
      if (material.url && !validateFileUri(material.url, ALLOWED_DOC_PREFIXES)) {
        return `Invalid study material file format for "${material.title || 'unnamed'}". Only PDF and images are allowed.`;
      }
    }
  }
  return null;
}

// 3. Stories
app.get('/api/stories', authenticateToken, async (req, res) => {
  try {
    // Exclude heavy fields from the listing payload to optimize network & DB performance
    const stories = await Story.find({}).select('-journey -resumeFile -studyMaterials -customSections -photo -resume');
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sanitizedId = sanitizeString(id);
    const story = await Story.findOne({ id: sanitizedId });
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, branch } = req.body;
    // Required field check
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Story name is required.' });
    }
    if (name.length > 300) {
      return res.status(400).json({ error: 'Story name is too long.' });
    }
    if (branch && (typeof branch !== 'string' || branch.length > 100)) {
      return res.status(400).json({ error: 'Invalid branch value.' });
    }

    // MIME type check
    const fileError = validateStoryFiles(req.body);
    if (fileError) {
      return res.status(400).json({ error: fileError });
    }

    const processedBody = processStoryFiles(req.body);
    const sanitizedBody = sanitizeObject({ ...processedBody });
    sanitizedBody.name = name.trim();
    if (!sanitizedBody.id) sanitizedBody.id = String(Date.now());

    const story = await Story.create(sanitizedBody);
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/stories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fileError = validateStoryFiles(req.body);
    if (fileError) {
      return res.status(400).json({ error: fileError });
    }

    const processedBody = processStoryFiles(req.body);
    const sanitizedBody = sanitizeObject({ ...processedBody });
    const story = await Story.findOneAndUpdate({ id: req.params.id }, sanitizedBody, { new: true });
    if (!story) return res.status(404).json({ error: 'Story not found.' });
    res.json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/stories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Story.deleteOne({ id: req.params.id });
    res.json({ message: 'Story deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Pending Stories
app.get('/api/pending-stories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pending = await PendingStory.find({});
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-stories', authenticateToken, async (req, res) => {
  try {
    const fileError = validateStoryFiles(req.body);
    if (fileError) {
      return res.status(400).json({ error: fileError });
    }

    const processedBody = processStoryFiles(req.body);
    const pendingData = sanitizeObject({ ...processedBody });
    if (!pendingData.id) pendingData.id = String(Date.now());
    
    // Set uploadedByEmail early
    pendingData.uploadedByEmail = req.user.email;

    // Prevent duplicate submissions of the same story by the same user
    if (pendingData.requestType === 'add') {
      const existing = await PendingStory.findOne({
        name: pendingData.name,
        company: pendingData.company,
        uploadedByEmail: pendingData.uploadedByEmail,
        status: 'pending'
      });
      if (existing) {
        return res.status(400).json({ error: 'You have already submitted a placement story for this company that is pending approval.' });
      }
    }

    if (pendingData.requestType === 'edit' || pendingData.requestType === 'delete') {
      pendingData.activeId = pendingData.id;
      // Assign a temporary new ID for the pending entry so it doesn't conflict
      pendingData.id = String(Date.now());
    }

    const pending = await PendingStory.create(pendingData);
    res.status(201).json(pending);
  } catch (err) {
    console.error("Error in POST /api/pending-stories:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/pending-stories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await PendingStory.deleteOne({ id: req.params.id });
    res.json({ message: 'Pending story rejected/deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-stories/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pending = await PendingStory.findOne({ id });
    if (!pending) return res.status(404).json({ error: 'Pending story not found.' });

    if (pending.requestType === 'delete') {
      await Story.deleteOne({ id: pending.activeId });
    } else if (pending.requestType === 'edit') {
      const storyObj = pending.toObject();
      const activeId = storyObj.activeId;
      
      delete storyObj._id;
      delete storyObj.__v;
      delete storyObj.status;
      delete storyObj.requestType;
      delete storyObj.activeId;
      
      storyObj.id = activeId;
      await Story.findOneAndUpdate({ id: activeId }, storyObj, { new: true });
    } else {
      const storyObj = pending.toObject();
      
      delete storyObj._id;
      delete storyObj.__v;
      delete storyObj.status;
      
      await Story.create(storyObj);
    }

    await PendingStory.deleteOne({ id });
    res.json({ message: 'Story approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    // Project out heavy base64 link content in resource listing to optimize payload & latency
    const resources = await Resource.find({}).select('-link');
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sanitizedId = sanitizeString(id);
    const resource = await Resource.findOne({ id: sanitizedId });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, folderId, link } = req.body;
    // Required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Resource title is required.' });
    }
    if (title.length > 500) {
      return res.status(400).json({ error: 'Resource title is too long.' });
    }
    if (!folderId || typeof folderId !== 'string') {
      return res.status(400).json({ error: 'folderId is required.' });
    }
    if (link && typeof link !== 'string') {
      return res.status(400).json({ error: 'Resource link is invalid.' });
    }
    if (link && !link.startsWith('data:') && link.length > 2000) {
      return res.status(400).json({ error: 'Resource link is too long.' });
    }
    
    const processedBody = processResourceFiles(req.body);
    const resourceData = sanitizeObject({ ...processedBody });
    resourceData.title = title.trim();
    if (!resourceData.id) resourceData.id = String(Date.now());
    if (!resourceData.date) resourceData.date = new Date().toISOString().split('T')[0];
    
    const resource = await Resource.create(resourceData);
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const processedBody = processResourceFiles(req.body);
    const sanitizedBody = sanitizeObject({ ...processedBody });
    const resource = await Resource.findOneAndUpdate({ id: req.params.id }, sanitizedBody, { new: true });
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Resource.deleteOne({ id: req.params.id });
    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Pending Resources
app.get('/api/pending-resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pending = await PendingResource.find({});
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-resources', authenticateToken, async (req, res) => {
  try {
    const processedBody = processResourceFiles(req.body);
    const pendingData = sanitizeObject({ ...processedBody });
    if (!pendingData.id) pendingData.id = String(Date.now());
    if (!pendingData.date) pendingData.date = new Date().toISOString().split('T')[0];
    
    if (pendingData.requestType === 'edit' || pendingData.requestType === 'delete') {
      pendingData.activeId = pendingData.id;
      pendingData.id = String(Date.now());
    }
    
    // Automatically bind the user details from current JWT session
    pendingData.uploadedBy = req.user.name || req.user.email;
    pendingData.uploadedByEmail = req.user.email;

    const pending = await PendingResource.create(pendingData);
    res.status(201).json(pending);
  } catch (err) {
    console.error("Error in POST /api/pending-resources:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/pending-resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await PendingResource.deleteOne({ id: req.params.id });
    res.json({ message: 'Pending resource rejected/deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-resources/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pending = await PendingResource.findOne({ id });
    if (!pending) return res.status(404).json({ error: 'Pending resource not found.' });

    if (pending.requestType === 'delete') {
      await Resource.deleteOne({ id: pending.activeId });
    } else if (pending.requestType === 'edit') {
      const resourceObj = pending.toObject();
      const activeId = resourceObj.activeId;
      
      delete resourceObj._id;
      delete resourceObj.__v;
      delete resourceObj.status;
      delete resourceObj.requestType;
      delete resourceObj.activeId;
      
      resourceObj.id = activeId;
      await Resource.findOneAndUpdate({ id: activeId }, resourceObj, { new: true });
    } else {
      const resourceObj = pending.toObject();
      
      delete resourceObj._id;
      delete resourceObj.__v;
      delete resourceObj.status;
      
      await Resource.create(resourceObj);
    }

    await PendingResource.deleteOne({ id });
    res.json({ message: 'Resource approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Achievements
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await Achievement.find({});
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/achievements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, image } = req.body;
    // Required field check
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Achievement title is required.' });
    }
    if (title.length > 500) {
      return res.status(400).json({ error: 'Achievement title is too long.' });
    }
    if (description && (typeof description !== 'string' || description.length > 5000)) {
      return res.status(400).json({ error: 'Achievement description is too long (max 5000 chars).' });
    }
    if (image && !validateFileUri(image, ALLOWED_IMAGE_PREFIXES)) {
      return res.status(400).json({ error: 'Invalid achievement image file format. Only JPEG, PNG, and WebP images are allowed.' });
    }

    const processedBody = processAchievementFiles(req.body);
    const achievementData = sanitizeObject({ ...processedBody });
    achievementData.title = title.trim();
    if (!achievementData.id) achievementData.id = String(Date.now());
    if (!achievementData.date) achievementData.date = new Date().toISOString().split('T')[0];
    
    const achievement = await Achievement.create(achievementData);
    res.status(201).json(achievement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/achievements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { image } = req.body;
    if (image && !validateFileUri(image, ALLOWED_IMAGE_PREFIXES)) {
      return res.status(400).json({ error: 'Invalid achievement image file format. Only JPEG, PNG, and WebP images are allowed.' });
    }
    const processedBody = processAchievementFiles(req.body);
    const sanitizedBody = sanitizeObject({ ...processedBody });
    const achievement = await Achievement.findOneAndUpdate({ id: req.params.id }, sanitizedBody, { new: true });
    if (!achievement) return res.status(404).json({ error: 'Achievement not found.' });
    res.json(achievement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/achievements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Achievement.deleteOne({ id: req.params.id });
    res.json({ message: 'Achievement deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
