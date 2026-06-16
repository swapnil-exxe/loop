const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  status: { type: String, default: 'Active' }
});

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
});

// Pending Story Schema
const PendingStorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activeId: String,
  requestType: String, // 'add', 'edit', 'delete'
  status: { type: String, default: 'pending' },
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
});

// Study Resource Schema
const ResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: String,
  type: String,
  link: String,
  uploadedBy: String,
  uploadedByEmail: String,
  date: String,
  folderId: { type: String, required: true }
});

// Pending Study Resource Schema
const PendingResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  activeId: String,
  requestType: String, // 'add', 'delete'
  status: { type: String, default: 'pending' },
  title: { type: String, required: true },
  category: String,
  type: String,
  link: String,
  uploadedBy: String,
  uploadedByEmail: String,
  date: String,
  folderId: { type: String, required: true }
});

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
});

// Folder Schema
const FolderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  parentId: { type: String, default: null }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Story: mongoose.model('Story', StorySchema),
  PendingStory: mongoose.model('PendingStory', PendingStorySchema),
  Resource: mongoose.model('Resource', ResourceSchema),
  PendingResource: mongoose.model('PendingResource', PendingResourceSchema),
  Achievement: mongoose.model('Achievement', AchievementSchema),
  Folder: mongoose.model('Folder', FolderSchema)
};
