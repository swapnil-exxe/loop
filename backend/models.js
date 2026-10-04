const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, index: true },
  status: { type: String, default: 'Active', index: true },
  password: { type: String, default: 'spit123' },
  name: { type: String, default: '' },
  branch: { type: String, default: '', index: true },
  currentYear: { type: String, default: '' },
  onboarded: { type: Boolean, default: false },
  pendingName: { type: String, default: '' },
  pendingRole: { type: String, default: '' },
  pendingBranch: { type: String, default: '' },
  pendingCurrentYear: { type: String, default: '' },
  hasPendingEdit: { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.index({ createdAt: -1 });

// Journey Subschema
const JourneySchema = new mongoose.Schema({
  firstYear: String,
  secondYear: String,
  thirdYear: String,
  fourthYear: String,
  prep: String,
  projects: String,
  howSecured: String
}, { _id: false });

// Resource Reference Subschema
const ResourceRefSchema = new mongoose.Schema({
  name: String,
  type: String
}, { _id: false });

// Study Material Subschema
const StudyMaterialSchema = new mongoose.Schema({
  title: String,
  type: String,
  fileName: String,
  fileSize: String,
  url: String
}, { _id: false });

// Custom Section Subschema
const CustomSectionSchema = new mongoose.Schema({
  title: String,
  content: String
}, { _id: false });

// Resume File Subschema
const ResumeFileSchema = new mongoose.Schema({
  fileName: String,
  fileSize: String,
  url: String
}, { _id: false });

// Story Schema
const StorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  branch: { type: String, index: true },
  subBranch: String,
  passoutYear: { type: String, index: true },
  company: { type: String, index: true },
  role: { type: String, index: true },
  semester: String,
  cgpa: String,
  photo: String,
  journey: JourneySchema,
  resources: [ResourceRefSchema],
  resume: String,
  resumeFile: ResumeFileSchema,
  studyMaterials: [StudyMaterialSchema],
  customSections: [CustomSectionSchema],
  uploadedByEmail: String
}, { timestamps: true });

StorySchema.index({ createdAt: -1 });

// Pending Story Schema
const PendingStorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activeId: String,
  requestType: String, // 'add', 'edit', 'delete'
  status: { type: String, default: 'pending', index: true },
  name: { type: String, required: true },
  branch: String,
  subBranch: String,
  passoutYear: String,
  company: String,
  role: String,
  semester: String,
  cgpa: String,
  photo: String,
  journey: JourneySchema,
  resources: [ResourceRefSchema],
  resume: String,
  resumeFile: ResumeFileSchema,
  studyMaterials: [StudyMaterialSchema],
  customSections: [CustomSectionSchema],
  uploadedByEmail: String
}, { timestamps: true });

PendingStorySchema.index({ createdAt: -1 });

// Study Resource Schema
const ResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  type: { type: String, default: 'PDF' },
  link: { type: String, default: '' },
  originalFileName: { type: String, default: '' },
  mimeType: { type: String, default: 'application/pdf' },
  size: { type: Number, default: 0 },
  fileSizeFormatted: { type: String, default: '' },
  storageProvider: { type: String, enum: ['r2', 's3', 'gridfs', 'local', 'legacy'], default: 'r2' },
  storageKey: { type: String, default: '' },
  url: { type: String, default: '' },
  folderId: { type: String, required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  uploadedBy: { type: String, default: 'Anonymous' },
  uploadedByEmail: { type: String, default: '' },
  date: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved', index: true },
  semester: { type: String, default: '' },
  year: { type: String, default: '' },
  tags: [String]
}, { timestamps: true });

ResourceSchema.index({ folderId: 1, status: 1 });
ResourceSchema.index({ uploadedByEmail: 1 });
ResourceSchema.index({ ownerId: 1 });
ResourceSchema.index({ createdAt: -1 });

// Pending Study Resource Schema
const PendingResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activeId: String,
  requestType: { type: String, default: 'add' }, // 'add', 'edit', 'delete'
  status: { type: String, default: 'pending', index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  type: { type: String, default: 'PDF' },
  link: { type: String, default: '' },
  originalFileName: { type: String, default: '' },
  mimeType: { type: String, default: 'application/pdf' },
  size: { type: Number, default: 0 },
  fileSizeFormatted: { type: String, default: '' },
  storageProvider: { type: String, enum: ['r2', 's3', 'gridfs', 'local', 'legacy'], default: 'r2' },
  storageKey: { type: String, default: '' },
  url: { type: String, default: '' },
  folderId: { type: String, required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  uploadedBy: { type: String, default: 'Anonymous' },
  uploadedByEmail: { type: String, default: '' },
  date: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  semester: { type: String, default: '' },
  year: { type: String, default: '' }
}, { timestamps: true });

PendingResourceSchema.index({ createdAt: -1 });

// Achievement Schema
const AchievementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  date: String,
  category: String,
  image: String,
  imageFit: { type: String, default: 'cover' },
  imagePosition: { type: String, default: 'center' }
}, { timestamps: true });

AchievementSchema.index({ createdAt: -1 });

// Folder Schema
const FolderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerEmail: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  folderType: { type: String, enum: ['system', 'user'], default: 'user', index: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  allowContributions: { type: Boolean, default: true },
  parentId: { type: String, default: null },
  isSystemFolder: { type: Boolean, default: false, index: true }
}, { timestamps: true });

FolderSchema.index({ ownerId: 1, visibility: 1, folderType: 1 });
FolderSchema.index({ parentId: 1 });
FolderSchema.index({ createdAt: -1 });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Story: mongoose.model('Story', StorySchema),
  PendingStory: mongoose.model('PendingStory', PendingStorySchema),
  Resource: mongoose.model('Resource', ResourceSchema),
  PendingResource: mongoose.model('PendingResource', PendingResourceSchema),
  Achievement: mongoose.model('Achievement', AchievementSchema),
  Folder: mongoose.model('Folder', FolderSchema)
};
