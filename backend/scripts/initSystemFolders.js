require('dotenv').config();
const mongoose = require('mongoose');
const { Folder, Resource } = require('../models');

const SYSTEM_FOLDERS_STRUCTURE = [
  // Root Folders
  { id: 'system-placement-material', name: 'Placement Material', parentId: null, description: 'Official SPIT Placement Study Material, Interview Sheets, and Preparation Roadmaps' },
  { id: 'system-cse-ce', name: 'CSE/CE', parentId: null, description: 'Computer Science & Computer Engineering Academic Materials & Notes' },
  { id: 'system-extc', name: 'EXTC', parentId: null, description: 'Electronics & Telecommunication Engineering Academic Materials & Notes' },

  // CSE/CE Year Folders
  { id: 'cse-1st-year', name: '1st Year', parentId: 'system-cse-ce', description: 'First Year Engineering - CSE/CE' },
  { id: 'cse-1st-sem-1', name: 'Semester 1', parentId: 'cse-1st-year', description: 'Semester 1 Subjects & Lab Manuals' },
  { id: 'cse-1st-sem-2', name: 'Semester 2', parentId: 'cse-1st-year', description: 'Semester 2 Subjects & Lab Manuals' },

  { id: 'cse-2nd-year', name: '2nd Year', parentId: 'system-cse-ce', description: 'Second Year Engineering - CSE/CE' },
  { id: 'cse-2nd-sem-1', name: 'Semester 1', parentId: 'cse-2nd-year', description: 'Semester 3 (2nd Year Sem 1) Subjects & Code' },
  { id: 'cse-2nd-sem-2', name: 'Semester 2', parentId: 'cse-2nd-year', description: 'Semester 4 (2nd Year Sem 2) Subjects & Code' },

  { id: 'cse-3rd-year', name: '3rd Year', parentId: 'system-cse-ce', description: 'Third Year Engineering - CSE/CE' },
  { id: 'cse-3rd-sem-1', name: 'Semester 1', parentId: 'cse-3rd-year', description: 'Semester 5 (3rd Year Sem 1) Core Subjects & Labs' },
  { id: 'cse-3rd-sem-2', name: 'Semester 2', parentId: 'cse-3rd-year', description: 'Semester 6 (3rd Year Sem 2) Core Subjects & Labs' },

  { id: 'cse-4th-year', name: '4th Year', parentId: 'system-cse-ce', description: 'Final Year Engineering - CSE/CE' },
  { id: 'cse-4th-sem-1', name: 'Semester 1', parentId: 'cse-4th-year', description: 'Semester 7 Electives & Capstone Projects' },
  { id: 'cse-4th-sem-2', name: 'Semester 2', parentId: 'cse-4th-year', description: 'Semester 8 Industry Internship & Final Credits' },

  { id: 'cse-other', name: 'Other', parentId: 'system-cse-ce', description: 'General CSE/CE Electives, Seminars, and Department Materials' },

  // EXTC Year Folders
  { id: 'extc-1st-year', name: '1st Year', parentId: 'system-extc', description: 'First Year Engineering - EXTC' },
  { id: 'extc-1st-sem-1', name: 'Semester 1', parentId: 'extc-1st-year', description: 'Semester 1 Subjects & Circuit Labs' },
  { id: 'extc-1st-sem-2', name: 'Semester 2', parentId: 'extc-1st-year', description: 'Semester 2 Subjects & Circuit Labs' },

  { id: 'extc-2nd-year', name: '2nd Year', parentId: 'system-extc', description: 'Second Year Engineering - EXTC' },
  { id: 'extc-2nd-sem-1', name: 'Semester 1', parentId: 'extc-2nd-year', description: 'Semester 3 (2nd Year Sem 1) Signals & Systems' },
  { id: 'extc-2nd-sem-2', name: 'Semester 2', parentId: 'extc-2nd-year', description: 'Semester 4 (2nd Year Sem 2) Microcontrollers & Comms' },

  { id: 'extc-3rd-year', name: '3rd Year', parentId: 'system-extc', description: 'Third Year Engineering - EXTC' },
  { id: 'extc-3rd-sem-1', name: 'Semester 1', parentId: 'extc-3rd-year', description: 'Semester 5 (3rd Year Sem 1) DSP & VLSI' },
  { id: 'extc-3rd-sem-2', name: 'Semester 2', parentId: 'extc-3rd-year', description: 'Semester 6 (3rd Year Sem 2) Wireless Networks' },

  { id: 'extc-4th-year', name: '4th Year', parentId: 'system-extc', description: 'Final Year Engineering - EXTC' },
  { id: 'extc-4th-sem-1', name: 'Semester 1', parentId: 'extc-4th-year', description: 'Semester 7 Advanced Systems & Embedded Projects' },
  { id: 'extc-4th-sem-2', name: 'Semester 2', parentId: 'extc-4th-year', description: 'Semester 8 Industrial Practice & Project Work' },

  { id: 'extc-other', name: 'Other', parentId: 'system-extc', description: 'General EXTC Electives, Hardware Kits, and Reference Books' }
];

async function ensureSystemFolders() {
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of SYSTEM_FOLDERS_STRUCTURE) {
    const existing = await Folder.findOne({ id: item.id });
    if (!existing) {
      await Folder.create({
        id: item.id,
        name: item.name,
        description: item.description,
        parentId: item.parentId,
        folderType: 'system',
        visibility: 'public',
        isSystemFolder: true,
        allowContributions: true
      });
      createdCount++;
    } else {
      // Update system properties
      await Folder.updateOne(
        { id: item.id },
        {
          $set: {
            name: item.name,
            description: item.description,
            parentId: item.parentId,
            folderType: 'system',
            visibility: 'public',
            isSystemFolder: true,
            allowContributions: true
          }
        }
      );
      updatedCount++;
    }
  }

  // Clean up legacy test folders requested by user (e.g. 4TH, 1ST, 2ND created earlier)
  const legacyTestFolderIds = ['4th-1790248001129', '1st-1790248008199', '2nd-1790248010736', '4th-1790248015325'];
  const deletedTestFolders = await Folder.deleteMany({ id: { $in: legacyTestFolderIds } });
  if (deletedTestFolders.deletedCount > 0) {
    console.log(`Deleted ${deletedTestFolders.deletedCount} legacy test folders requested by user.`);
  }

  // Also clean up old duplicate root folders if they exist
  const oldRootFolders = await Folder.find({
    id: { $in: ['placement-material-1782329667729', 'cse/ce-1790247974982', 'extc-1790247981491'] }
  });
  for (const oldF of oldRootFolders) {
    let targetNewId = 'system-placement-material';
    if (oldF.id.startsWith('cse')) targetNewId = 'system-cse-ce';
    if (oldF.id.startsWith('extc')) targetNewId = 'system-extc';

    // Move any resources in old folder to target system folder
    await Resource.updateMany({ folderId: oldF.id }, { folderId: targetNewId });
    await Folder.deleteOne({ _id: oldF._id });
    console.log(`Migrated old folder ${oldF.id} resources to ${targetNewId} and removed old folder.`);
  }

  return { createdCount, updatedCount };
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB. Initializing System Folders...');
      const res = await ensureSystemFolders();
      console.log(`System Folders Initialized: ${res.createdCount} created, ${res.updatedCount} synced.`);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error initializing system folders:', err);
      process.exit(1);
    });
}

module.exports = {
  SYSTEM_FOLDERS_STRUCTURE,
  ensureSystemFolders
};
