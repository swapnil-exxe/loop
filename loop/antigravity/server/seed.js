require('dotenv').config();
const mongoose = require('mongoose');
const { User, Story, Resource, Achievement, Folder, PendingStory, PendingResource } = require('./models');

const defaultUsers = [
  { email: 'aditya.sharma@spit.ac.in', role: 'Senior / Contributor', status: 'Active' },
  { email: 'neha.patel@spit.ac.in', role: 'Senior / Contributor', status: 'Active' },
  { email: 'rohan.mehta@spit.ac.in', role: 'Alumni / Contributor', status: 'Active' },
  { email: 'simran.kaur@spit.ac.in', role: 'Senior / Contributor', status: 'Active' },
  { email: 'junior.student@spit.ac.in', role: 'Student', status: 'Active' },
  { email: 'admin@spit.ac.in', role: 'Administrator', status: 'Active' }
];

const sampleStories = [
  {
    id: '1',
    name: 'Aditya Sharma',
    branch: 'CSE',
    subBranch: 'AI',
    passoutYear: '2025',
    company: 'NVIDIA',
    role: 'AI Research Engineer',
    semester: '7',
    cgpa: '9.6',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=400',
    journey: {
      firstYear: 'Spent the first year getting familiar with college life. Explored web development and basic C++ programming. Joined the SPIT Coding Club and began participating in local hackathons to understand teamwork.',
      secondYear: 'Fascinated by Machine Learning, I completed Andrew Karpathy\'s neural networks series. Maintained a high GPA while taking statistics and linear algebra courses, which laid the foundation for DL.',
      thirdYear: 'Dived deep into deep learning research and worked under an SPIT professor. Built an edge-AI computer vision project. Prepared for the internship season by practicing medium-hard LeetCode questions.',
      fourthYear: 'Secured an AI Research internship at NVIDIA, which was later converted into a full-time offer (PPO). Currently mentoring juniors in the Coding club and working on my final year capstone project.',
      prep: 'Focused heavily on mathematics behind Deep Learning (Linear Algebra, Calculus). Practiced DSA on LeetCode (around 450 questions), and solved Striver\'s SDE sheet.',
      projects: '1. "Edge-YOLO": Embedded object detection optimized for microcontrollers.\n2. "Spit-BERT": A semantic search engine for the SPIT college library catalog.',
      howSecured: 'Applied through the SPIT campus placement drive. Cleared 1 resume filtering round, 1 coding test (2 hard DSA questions), and 3 technical interviews focusing on ML system design and math.'
    },
    resources: [
      { name: 'LeetCode 75', type: 'DSA' },
      { name: 'Andrej Karpathy\'s Neural Networks (YouTube)', type: 'AI' },
      { name: 'Deep Learning Book by Ian Goodfellow', type: 'Books' }
    ],
    resume: 'aditya_sharma_nvidia.pdf',
    studyMaterials: [
      { title: 'NVIDIA Interview Prep Cheat Sheet', type: 'PDF', fileName: 'nvidia_prep_sheet.pdf', fileSize: '1.24 MB', url: '#' },
      { title: 'Deep Learning & Math Roadmap', type: 'Image', fileName: 'dl_math_roadmap.png', fileSize: '3.42 MB', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600&h=400' }
    ]
  },
  {
    id: '2',
    name: 'Neha Patel',
    branch: 'CSE',
    subBranch: 'DS',
    passoutYear: '2025',
    company: 'Microsoft',
    role: 'Software Engineer',
    semester: '7',
    cgpa: '9.2',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400',
    journey: {
      firstYear: 'Learnt Python and HTML/CSS. Participated in my first SPIT coding contest. Made great friends and focused on adapting to the college curriculum.',
      secondYear: 'Dived into Data Structures and Algorithms. Started resolving LeetCode problems daily. Built a full-stack React project for the SPIT Hackathon, winning the runner-up prize.',
      thirdYear: 'Cracked the Microsoft summer internship during the on-campus hiring drive. The interviews tested DSA, OOPs, and basic system design. Worked on Azure Cloud services during my 2-month stint.',
      fourthYear: 'Received a Pre-Placement Offer (PPO) from Microsoft! Spending the final year writing research papers on distributed systems and guiding juniors on coding roadmaps.',
      prep: 'Completed Striver\'s A-Z DSA sheet. Took dynamic programming courses online. Explored basic web scalability concepts on System Design Primer.',
      projects: '1. "EcoSnap": A mobile app using React Native that identifies recyclables and tracks carbon footprint.\n2. "CloudScale": A lightweight distributed key-value store in Go.',
      howSecured: 'Campus placement drive. Consisted of an online test (3 DSA coding questions) and 3 rounds of interviews (2 technical, 1 AA/HR round exploring cultural fit and system concepts).'
    },
    resources: [
      { name: 'Striver\'s A-Z DSA Sheet', type: 'DSA' },
      { name: 'System Design Primer (GitHub)', type: 'System Design' },
      { name: 'NeetCode.io', type: 'Coding Practice' }
    ],
    resume: 'neha_patel_microsoft.pdf',
    studyMaterials: [
      { title: 'Microsoft Interview Questions & Answers', type: 'PDF', fileName: 'ms_interview_questions.pdf', fileSize: '0.92 MB', url: '#' },
      { title: 'System Design Interview Cheatsheet', type: 'Image', fileName: 'system_design_cheatsheet.jpg', fileSize: '2.15 MB', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600&h=400' }
    ]
  },
  {
    id: '3',
    name: 'Rohan Mehta',
    branch: 'CE',
    subBranch: 'CSE',
    passoutYear: '2024',
    company: 'J.P. Morgan',
    role: 'Quantitative Analyst',
    semester: '8',
    cgpa: '9.4',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
    journey: {
      firstYear: 'Learnt Java and OOPs concepts. Maintained strict study schedules to keep the CGPA above 9.5. Joined the college finance club to learn quantitative analysis.',
      secondYear: 'Mastered advanced DSA. Read extensively about algorithms, statistics, and probability. Built a stock market portfolio simulator using React and Express.',
      thirdYear: 'Prepared specifically for quant and fintech firms. Solved brain teasers and advanced probability puzzles. Secured a quantitative research internship at JPMC.',
      fourthYear: 'Successfully completed the internship and secured a full-time role. Mentoring juniors who want to bridge the gap between computer engineering and financial technology.',
      prep: 'Read "Heard on the Street" and "Fifty Challenging Problems in Probability". Solved LeetCode Medium/Hard questions focusing on mathematics and graphs.',
      projects: '1. "QuantSim": A high-frequency market simulator for backtesting trading strategies.\n2. "SPIT-Share": A peer-to-peer textbook and notes sharing platform.',
      howSecured: 'On-campus placement. Had a rigorous coding round focusing on algorithms, followed by a mathematical test on probability and statistics. Concluded with 2 technical rounds.'
    },
    resources: [
      { name: 'Fifty Challenging Problems in Probability', type: 'Mathematics' },
      { name: 'Heard on the Street (Quant Guide)', type: 'Quantitative Finance' },
      { name: 'LeetCode Math Tag', type: 'DSA' }
    ],
    resume: 'rohan_mehta_jpmc.pdf',
    studyMaterials: [
      { title: 'Quantitative Interview Preparation Booklets', type: 'PDF', fileName: 'quant_prep_booklet.pdf', fileSize: '4.80 MB', url: '#' },
      { title: 'Probability & Statistics Formulas Cheat Sheet', type: 'Image', fileName: 'probability_formulas.png', fileSize: '1.85 MB', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600&h=400' }
    ]
  },
  {
    id: '4',
    name: 'Simran Kaur',
    branch: 'EXTC',
    subBranch: 'EXTC',
    passoutYear: '2025',
    company: 'Qualcomm',
    role: 'Hardware Design Engineer',
    semester: '7',
    cgpa: '8.9',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
    journey: {
      firstYear: 'Explored core electronics. Learnt breadboarding and basic circuits. Practiced standard college lab work and learned C programming.',
      secondYear: 'Started learning Verilog and FPGA design. Built digital clock circuits and worked on microcontroller projects (Arduino & Raspberry Pi).',
      thirdYear: 'Balanced coding with core hardware concepts. Participated in national level embedded system competitions. Secured Qualcomm internship on campus.',
      fourthYear: 'Finished the hardware design internship and secured PPO. Working on an IoT based healthcare monitoring system for my final year major project.',
      prep: 'Revised Digital Design by Morris Mano. Practiced basic C programming and OS concepts. Studied microprocessor architectures in depth.',
      projects: '1. "IoT HealthBand": Wearable sensor node transmitting real-time vitals to cloud.\n2. "RISC-V Core": A lightweight 32-bit RISC-V processor implemented in Verilog.',
      howSecured: 'On-campus recruitment. 1 online test containing core electronics, aptitude, and C programming questions. Followed by 2 rounds of technical interviews.'
    },
    resources: [
      { name: 'Digital Design by Morris Mano', type: 'Books' },
      { name: 'Neso Academy (YouTube)', type: 'College Subjects' },
      { name: 'GeeksforGeeks C Language Section', type: 'Coding' }
    ],
    resume: 'simran_kaur_qualcomm.pdf',
    studyMaterials: [
      { title: 'Digital Logic and Verilog Reference Sheet', type: 'Image', fileName: 'verilog_reference_sheet.png', fileSize: '2.30 MB', url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=600&h=400' },
      { title: 'Qualcomm Technical Interview Questions', type: 'PDF', fileName: 'qualcomm_questions.pdf', fileSize: '1.10 MB', url: '#' }
    ]
  }
];

const sampleAchievements = [
  {
    id: '1',
    title: 'Smart India Hackathon 2025 Winners',
    description: 'A team of six SPIT students won the first prize of Rs 1 Lakh at the SIH 2025 Finals held in Bangalore for their AI-driven agricultural mapping solution.',
    date: '2025-12-18',
    category: 'Hackathon Winners',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: '2',
    title: 'Record Placements at SPIT',
    description: 'SPIT records 95% placement in the current academic year with an average package of 15 LPA for CSE, CE, and EXTC branches, and a highest package of 44 LPA.',
    date: '2026-04-10',
    category: 'Placement Successes',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: '3',
    title: 'GSoC 2025 Selection Milestones',
    description: 'Eight students from Sardar Patel Institute of Technology have been selected for Google Summer of Code 2025, working with Apache, Linux, and CNCF.',
    date: '2025-05-04',
    category: 'Internship Achievements',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: '4',
    title: 'ACM ICPC Regional Finalists',
    description: 'Team "SPIT_Overflow" represented the college at the ICPC Amritapuri Regionals, securing a rank in the top 30 coding teams across India.',
    date: '2025-11-23',
    category: 'Competition Winners',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600&h=400'
  }
];

const sampleResources = [
  {
    id: '1',
    title: 'Striver\'s SDE Sheet & Practice Guide',
    category: 'Coding',
    type: 'Sheet',
    link: '#',
    uploadedBy: 'Neha Patel',
    date: '2025-08-12',
    folderId: 'sem-5'
  },
  {
    id: '2',
    title: 'SPIT DBMS Complete Semester Lecture Notes',
    category: 'College Subjects',
    type: 'Note',
    link: '#',
    uploadedBy: 'Aditya Sharma',
    date: '2025-06-30',
    folderId: 'sem-4'
  },
  {
    id: '3',
    title: 'Complete Web Development Roadmap 2026',
    category: 'Web Development',
    type: 'Roadmap',
    link: '#',
    uploadedBy: 'Rohan Mehta',
    date: '2026-01-10',
    folderId: 'sem-2'
  },
  {
    id: '4',
    title: 'Deep Learning & ML Cheat Sheet',
    category: 'CSE',
    type: 'PDF',
    link: '#',
    uploadedBy: 'Aditya Sharma',
    date: '2025-09-05',
    folderId: 'sem-7'
  },
  {
    id: '5',
    title: 'Microsoft SDE Interview Preparation Guide',
    category: 'Placement',
    type: 'Interview Questions',
    link: '#',
    uploadedBy: 'Neha Patel',
    date: '2025-08-20',
    folderId: 'sem-6'
  }
];

const defaultFolders = [
  { id: '1st-year', name: '1st Year', parentId: null },
  { id: '2nd-year', name: '2nd Year', parentId: null },
  { id: '3rd-year', name: '3rd Year', parentId: null },
  { id: '4th-year', name: '4th Year', parentId: null },
  { id: 'sem-1', name: 'Semester 1', parentId: '1st-year' },
  { id: 'sem-2', name: 'Semester 2', parentId: '1st-year' },
  { id: 'sem-3', name: 'Semester 3', parentId: '2nd-year' },
  { id: 'sem-4', name: 'Semester 4', parentId: '2nd-year' },
  { id: 'sem-5', name: 'Semester 5', parentId: '3rd-year' },
  { id: 'sem-6', name: 'Semester 6', parentId: '3rd-year' },
  { id: 'sem-7', name: 'Semester 7', parentId: '4th-year' },
  { id: 'sem-8', name: 'Semester 8', parentId: '4th-year' }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  console.log('Connecting to MongoDB at:', uri);
  
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  // Clean current database data
  await User.deleteMany({});
  await Story.deleteMany({});
  await Resource.deleteMany({});
  await Achievement.deleteMany({});
  await Folder.deleteMany({});
  await PendingStory.deleteMany({});
  await PendingResource.deleteMany({});

  console.log('Database collections cleared.');

  // Seed folders
  await Folder.insertMany(defaultFolders);
  console.log('Folders seeded.');

  // Seed users
  await User.insertMany(defaultUsers);
  console.log('Platform users seeded.');

  // Seed stories
  await Story.insertMany(sampleStories);
  console.log('Stories seeded.');

  // Seed achievements
  await Achievement.insertMany(sampleAchievements);
  console.log('Achievements seeded.');

  // Seed resources
  await Resource.insertMany(sampleResources);
  console.log('Study resources seeded.');

  await mongoose.disconnect();
  console.log('Database disconnected. Seeding completed successfully.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
