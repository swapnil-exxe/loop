require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { User, Story, Resource, Achievement, Folder, PendingStory, PendingResource } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

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
app.use(cors());
app.use(express.json({ limit: '15mb' })); // support base64 images under a safe 15MB limit

// Apply Global Limiter to all API endpoints
app.use('/api/', globalLimiter);

// Apply strict rate limiting to login and registration routes
app.use('/api/users/login', loginLimiter);
app.use('/api/users/register-request', loginLimiter);

// Prevent NoSQL query injection by stripping keys starting with $ or .
app.use(mongoSanitize());

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

// Routes

// 1. Folders
app.get('/api/folders', async (req, res) => {
  try {
    const folders = await Folder.find({});
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/folders', async (req, res) => {
  try {
    const folder = await Folder.create(req.body);
    res.status(201).json(folder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Folder.deleteOne({ id });
    
    // Update any subfolders to make them root folders
    await Folder.updateMany({ parentId: id }, { parentId: null });
    
    // Re-assign study resources inside deleted folder to a fallback folder 'sem-1'
    await Resource.updateMany({ folderId: id }, { folderId: 'sem-1' });
    
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
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
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

    const userData = {
      email: email.trim().toLowerCase(),
      role: role.trim(),
      password: (password && typeof password === 'string') ? password.trim() : 'spit123',
      name: name ? name.trim() : '',
      branch: branch ? branch.trim() : '',
      currentYear: currentYear ? String(currentYear).trim() : '',
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

    // Case-insensitive, trimmed email search
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!user) {
      return res.status(401).json({ error: 'User not found in the database. Please contact an administrator.' });
    }
    
    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your registration request is pending administrator approval.' });
    }
    
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact an administrator.' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    
    // Return session data
    const isUserAdmin = user.email.toLowerCase() === 'admin@spit.ac.in' || user.role === 'Administrator' || user.role === 'Admin';
    res.json({
      email: user.email,
      role: isUserAdmin ? 'Administrator' : user.role,
      status: user.status,
      name: user.name,
      branch: user.branch,
      currentYear: user.currentYear,
      onboarded: isUserAdmin ? true : user.onboarded,
      isAdmin: isUserAdmin
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
    
    const existingUser = await User.findOne({ email: new RegExp('^' + trimmedEmail + '$', 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered. Please try logging in.' });
    }
    
    const user = await User.create({
      email: trimmedEmail,
      password: password.trim(),
      role: 'Student',
      status: 'Pending',
      onboarded: false
    });
    
    res.status(201).json({ message: 'Registration request submitted successfully.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/approve-registration', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.status = 'Active';
    await user.save();
    
    res.json({ message: 'User registration approved successfully.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
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
    
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (name !== undefined) user.name = name.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (currentYear !== undefined) user.currentYear = String(currentYear).trim();
    if (status !== undefined) user.status = status;
    if (password !== undefined && password.trim()) user.password = password.trim();
    
    // Prevent changing admin's role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      if (role !== undefined) user.role = role.trim();
    }
    
    await user.save();
    
    res.json({ message: 'User updated successfully.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:email/onboard', async (req, res) => {
  try {
    const email = req.params.email;
    const { name, role, branch, currentYear } = req.body;
    
    if (!name || !role || !branch || !currentYear) {
      return res.status(400).json({ error: 'Name, role, branch, and current year are all required for onboarding.' });
    }
    
    // Case-insensitive check
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.name = name.trim();
    // Do not allow changing admin@spit.ac.in's role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      user.role = role.trim();
    } else {
      user.role = 'Administrator';
    }
    user.branch = branch.trim();
    user.currentYear = currentYear.trim();
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

app.delete('/api/users/:email', async (req, res) => {
  try {
    await User.deleteOne({ email: req.params.email });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:email/edit-request', async (req, res) => {
  try {
    const email = req.params.email;
    const { name, role, branch, currentYear } = req.body;
    
    if (!name || !role || !branch || !currentYear) {
      return res.status(400).json({ error: 'Name, role, branch, and current year are all required.' });
    }
    
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Set pending fields
    user.pendingName = name.trim();
    // Do not allow admin@spit.ac.in to change their Administrator role
    if (email.trim().toLowerCase() !== 'admin@spit.ac.in') {
      user.pendingRole = role.trim();
    } else {
      user.pendingRole = 'Administrator';
    }
    user.pendingBranch = branch.trim();
    user.pendingCurrentYear = currentYear.trim();
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

app.post('/api/users/:email/approve-edit', async (req, res) => {
  try {
    const email = req.params.email;
    
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
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

app.post('/api/users/:email/reject-edit', async (req, res) => {
  try {
    const email = req.params.email;
    
    const user = await User.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') });
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
    
    res.json({ message: 'User profile edit rejected successfully.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Stories
app.get('/api/stories', async (req, res) => {
  try {
    const stories = await Story.find({});
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stories', async (req, res) => {
  try {
    const { name, branch, id } = req.body;
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
    const storyData = { ...req.body, name: name.trim() };
    if (!storyData.id) storyData.id = String(Date.now());
    const story = await Story.create(storyData);
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/stories/:id', async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!story) return res.status(404).json({ error: 'Story not found.' });
    res.json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/stories/:id', async (req, res) => {
  try {
    await Story.deleteOne({ id: req.params.id });
    res.json({ message: 'Story deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Pending Stories
app.get('/api/pending-stories', async (req, res) => {
  try {
    const pending = await PendingStory.find({});
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-stories', async (req, res) => {
  try {
    const pendingData = { ...req.body };
    if (!pendingData.id) pendingData.id = String(Date.now());
    
    if (pendingData.requestType === 'edit' || pendingData.requestType === 'delete') {
      pendingData.activeId = pendingData.id;
      // Assign a temporary new ID for the pending entry so it doesn't conflict
      pendingData.id = String(Date.now());
    }
    
    const pending = await PendingStory.create(pendingData);
    res.status(201).json(pending);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/pending-stories/:id', async (req, res) => {
  try {
    await PendingStory.deleteOne({ id: req.params.id });
    res.json({ message: 'Pending story rejected/deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-stories/:id/approve', async (req, res) => {
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
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.find({});
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
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
    if (link && (typeof link !== 'string' || link.length > 2000)) {
      return res.status(400).json({ error: 'Resource link is invalid or too long.' });
    }
    const resourceData = { ...req.body, title: title.trim() };
    if (!resourceData.id) resourceData.id = String(Date.now());
    if (!resourceData.date) resourceData.date = new Date().toISOString().split('T')[0];
    
    const resource = await Resource.create(resourceData);
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    await Resource.deleteOne({ id: req.params.id });
    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Pending Resources
app.get('/api/pending-resources', async (req, res) => {
  try {
    const pending = await PendingResource.find({});
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-resources', async (req, res) => {
  try {
    const pendingData = { ...req.body };
    if (!pendingData.id) pendingData.id = String(Date.now());
    if (!pendingData.date) pendingData.date = new Date().toISOString().split('T')[0];
    
    if (pendingData.requestType === 'edit' || pendingData.requestType === 'delete') {
      pendingData.activeId = pendingData.id;
      pendingData.id = String(Date.now());
    }
    
    const pending = await PendingResource.create(pendingData);
    res.status(201).json(pending);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/pending-resources/:id', async (req, res) => {
  try {
    await PendingResource.deleteOne({ id: req.params.id });
    res.json({ message: 'Pending resource rejected/deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-resources/:id/approve', async (req, res) => {
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
app.get('/api/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find({});
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/achievements', async (req, res) => {
  try {
    const { title, description } = req.body;
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
    const achievementData = { ...req.body, title: title.trim() };
    if (!achievementData.id) achievementData.id = String(Date.now());
    if (!achievementData.date) achievementData.date = new Date().toISOString().split('T')[0];
    
    const achievement = await Achievement.create(achievementData);
    res.status(201).json(achievement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/achievements/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!achievement) return res.status(404).json({ error: 'Achievement not found.' });
    res.json(achievement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/achievements/:id', async (req, res) => {
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
