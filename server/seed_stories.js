require('dotenv').config();
const mongoose = require('mongoose');
const { Story } = require('./models');

const storiesToSeed = [
  {
    id: "aarav_sharma",
    name: "Aarav Sharma",
    branch: "CSE",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Microsoft",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.1",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on adapting to engineering life, learned Python and C programming, participated in coding clubs and hackathons. Built basic projects like calculator apps and portfolio websites.",
      secondYear: "Started DSA seriously using Java. Solved 300+ problems on LeetCode. Learned web development and built a hostel management system.",
      thirdYear: "Completed internship at a startup. Participated in SIH and college hackathons. Solved 700+ DSA questions and revised DBMS and OS thoroughly.",
      fourthYear: "Focused on placements and interview preparation. Practiced mock interviews and system design basics.",
      prep: "Striver Sheet, LeetCode Daily, DBMS Notes, OS Notes, CN Revision, Resume Reviews.",
      projects: "Hostel Management System, Portfolio Website, Calculator App",
      howSecured: "OA had DSA and aptitude. Technical rounds focused on trees, graphs, DBMS and OOPs. Practiced mock interviews regularly."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Striver Sheet", type: "DSA" },
      { name: "DBMS Notes", type: "Core" },
      { name: "CS50", type: "Programming" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "priya_verma",
    name: "Priya Verma",
    branch: "CSE",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Amazon",
    role: "SDE-1",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored programming through Python and C. Joined coding community and attended workshops.",
      secondYear: "Started DSA and SQL. Built recommendation system project and learned machine learning basics.",
      thirdYear: "Interned as Data Analyst. Solved 800+ DSA problems and improved problem-solving speed.",
      fourthYear: "Focused on placement preparation and Amazon interview experiences.",
      prep: "LeetCode, InterviewBit, Striver Sheet, Mock Interviews.",
      projects: "Recommendation System, Data Analysis Projects",
      howSecured: "OA included coding and work simulation. Technical interviews focused on arrays, graphs, OOPs and leadership principles."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "InterviewBit", type: "DSA" },
      { name: "Striver Sheet", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "rohan_patil",
    name: "Rohan Patil",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Google",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.4",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Strong focus on mathematics and programming fundamentals.",
      secondYear: "Completed DSA in Java and participated in competitive programming.",
      thirdYear: "Reached Specialist on Codeforces and solved 1500+ problems.",
      fourthYear: "Prepared for Google interviews and system design basics.",
      prep: "CP, LeetCode, System Design, Core Subjects.",
      projects: "Competitive Programming Templates, Sorting Visualizer",
      howSecured: "Three technical rounds involving graphs, DP, trees and behavioral questions."
    },
    resources: [
      { name: "Codeforces", type: "CP" },
      { name: "LeetCode", type: "DSA" },
      { name: "System Design Primer", type: "System Design" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "sneha_kulkarni",
    name: "Sneha Kulkarni",
    branch: "CSE",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Adobe",
    role: "Member of Technical Staff",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned programming and participated in hackathons.",
      secondYear: "Started AI/ML and DSA simultaneously.",
      thirdYear: "Built NLP and Computer Vision projects.",
      fourthYear: "Focused on placements and mock interviews.",
      prep: "LeetCode, Kaggle, ML Projects, DBMS Revision.",
      projects: "NLP Text Summarizer, Computer Vision Face Detector",
      howSecured: "Coding round, project discussion and technical interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Kaggle", type: "AI/ML" },
      { name: "DBMS Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "aditya_singh",
    name: "Aditya Singh",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Atlassian",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored programming and development.",
      secondYear: "Solved 500+ DSA questions.",
      thirdYear: "Built scalable MERN projects and interned at startup.",
      fourthYear: "Focused on advanced DSA and system design.",
      prep: "LeetCode, Striver Sheet, Low-Level Design.",
      projects: "MERN Stack E-commerce, Scalable Chat Application",
      howSecured: "OA, coding interview, LLD discussion and HR round."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Striver Sheet", type: "DSA" },
      { name: "LLD Primer", type: "System Design" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "neha_gupta",
    name: "Neha Gupta",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "JP Morgan Chase",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.7",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned C and Python.",
      secondYear: "Started DSA and databases.",
      thirdYear: "Completed fintech projects and internship.",
      fourthYear: "Focused on placements.",
      prep: "LeetCode, SQL Practice, DBMS.",
      projects: "Stock Portfolio Tracker, Financial Analysis Tool",
      howSecured: "OA, coding round, technical round and managerial round."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "SQL Zoo", type: "Database" },
      { name: "DBMS Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "karan_mehta",
    name: "Karan Mehta",
    branch: "EXTC",
    subBranch: "EXTC",
    passoutYear: "2026",
    company: "Nvidia",
    role: "Embedded Software Engineer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Strong electronics foundation.",
      secondYear: "Learned C++, DSA and microcontrollers.",
      thirdYear: "Built IoT projects and internship.",
      fourthYear: "Focused on embedded systems.",
      prep: "C++, OS, Embedded Systems.",
      projects: "Smart Agriculture IoT, Embedded Robot Controller",
      howSecured: "Technical interviews focused on C++, OS and projects."
    },
    resources: [
      { name: "C++ Reference", type: "Language" },
      { name: "Embedded System Guides", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "ananya_deshmukh",
    name: "Ananya Deshmukh",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Goldman Sachs",
    role: "Analyst Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned basic programming and data structures.",
      secondYear: "Maintained good academic performance and started web development.",
      thirdYear: "Built fintech projects and secured internship.",
      fourthYear: "Focused on core DSA, DBMS, OOPs, fintech projects and internship.",
      prep: "LeetCode, InterviewBit, Mock Interviews.",
      projects: "Expense Tracker, Banking Ledger API",
      howSecured: "Coding OA followed by technical and HR rounds."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "InterviewBit", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "rahul_nair",
    name: "Rahul Nair",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Oracle",
    role: "Software Developer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned Java and basic object-oriented programming.",
      secondYear: "Explored Spring Boot framework and built web backend projects.",
      thirdYear: "Dived into SQL and database optimizations.",
      fourthYear: "Focused on Java, Spring Boot and DSA.",
      prep: "LeetCode and backend projects.",
      projects: "Spring Boot Microservices, User Directory API",
      howSecured: "Technical rounds on Java and SQL."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Baeldung Spring Guides", type: "Backend" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "ishita_jain",
    name: "Ishita Jain",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Samsung R&D",
    role: "Research Engineer",
    semester: "7",
    cgpa: "9.2",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on mathematics and linear algebra foundations.",
      secondYear: "Learned Python, numpy, pandas, and data science basics.",
      thirdYear: "Worked on ML projects, research papers and Kaggle competitions.",
      fourthYear: "Prepared for research-heavy and algorithmic evaluation rounds.",
      prep: "ML Concepts, Deep Learning papers, LeetCode.",
      projects: "Medical Image Segmentation, Text Classification Model",
      howSecured: "Technical interviews on ML concepts and coding."
    },
    resources: [
      { name: "Kaggle", type: "AI/ML" },
      { name: "Hands-on ML Book", type: "Books" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "vivek_yadav",
    name: "Vivek Yadav",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "Deloitte",
    role: "Technology Analyst",
    semester: "7",
    cgpa: "8.5",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored basic programming and computer hardware.",
      secondYear: "Learned web development technologies (HTML, CSS, JavaScript).",
      thirdYear: "Built full-stack applications and did internship projects.",
      fourthYear: "Focused on technology consulting case studies and technical assessments.",
      prep: "Full-stack development and internship experience.",
      projects: "Admin Dashboard Panel, Task Scheduler Application",
      howSecured: "Aptitude, coding and managerial rounds."
    },
    resources: [
      { name: "Web Dev Roadmaps", type: "Web Dev" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "pooja_shah",
    name: "Pooja Shah",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Accenture",
    role: "Data Engineer",
    semester: "7",
    cgpa: "8.6",
    photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Adapted to database concepts and SQL foundations.",
      secondYear: "Studied data modeling, ETL, and python libraries.",
      thirdYear: "Practiced Power BI dashboarding and database optimizations.",
      fourthYear: "Focused on Python, SQL, Power BI and ML projects.",
      prep: "Data engineering roadmaps, SQL Query optimization guides.",
      projects: "Sales Reporting Dashboard, ETL Pipeline Script",
      howSecured: "Data engineering and SQL-focused interviews."
    },
    resources: [
      { name: "SQL Zoo", type: "SQL" },
      { name: "Power BI Docs", type: "BI Tool" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "siddharth_joshi",
    name: "Siddharth Joshi",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Morgan Stanley",
    role: "Technology Analyst",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Mastered C++ and OOPs theory.",
      secondYear: "Started competitive programming and dived into backend structures.",
      thirdYear: "Won university coding events and built server-side systems.",
      fourthYear: "Prepared extensively on operating systems, computer networks, and DSA.",
      prep: "Competitive programming and backend development.",
      projects: "P2P Messaging System, Custom DB Engine",
      howSecured: "OA, technical rounds and HR."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "GeeksforGeeks Core Subjects", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "tanvi_rao",
    name: "Tanvi Rao",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Infosys",
    role: "Specialist Programmer",
    semester: "7",
    cgpa: "8.7",
    photo: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Built strong logic building skills and programming fundamentals.",
      secondYear: "Studied basic AI modules and algorithm complexities.",
      thirdYear: "Built classification tools and web interfaces.",
      fourthYear: "Focused on DSA, AI projects and internships.",
      prep: "LeetCode, basic web development, python libraries.",
      projects: "Smart Chatbot, Object Detector App",
      howSecured: "Coding test and technical interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "arjun_kapoor",
    name: "Arjun Kapoor",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Uber",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.3",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned programming fundamentals and participated in hackathons.",
      secondYear: "Completed DSA, OOPs and DBMS. Solved 600+ problems.",
      thirdYear: "Built scalable projects, completed internship and revised core subjects.",
      fourthYear: "Focused entirely on placement preparation and mock interviews.",
      prep: "LeetCode, Striver Sheet, System Design Primer, DBMS and OS Notes.",
      projects: "Distributed Queue, Ride Booking Mock Engine",
      howSecured: "OA had medium-hard DSA. Interviews focused on graphs, trees, LLD and project discussions. Consistency in DSA helped crack the offer."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Striver Sheet", type: "DSA" },
      { name: "System Design Primer", type: "System Design" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  }
];

async function seedStories() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  console.log('Connecting to database to insert stories...');
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');

    for (const story of storiesToSeed) {
      await Story.findOneAndUpdate({ id: story.id }, story, { upsert: true, new: true });
      console.log(`Successfully seeded/updated story for ${story.name} (${story.company})`);
    }

    console.log('All 15 stories successfully seeded!');
  } catch (err) {
    console.error('Error seeding stories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedStories();
