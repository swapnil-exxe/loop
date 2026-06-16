require('dotenv').config();
const mongoose = require('mongoose');
const { Story } = require('./models');

const storiesToSeed = [
  {
    id: "akash_jadhav",
    name: "Akash Jadhav",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Cisco",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned C programming, participated in coding contests, explored web development.",
      secondYear: "Started DSA in Java and built full-stack projects.",
      thirdYear: "Completed internship and solved 700+ LeetCode problems.",
      fourthYear: "Focused on networking fundamentals and placements.",
      prep: "LeetCode, Striver Sheet, CN, DBMS.",
      projects: "Full-stack Projects, Network Topology Visualizer",
      howSecured: "Coding OA, networking concepts, technical and HR rounds."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Striver Sheet", type: "DSA" },
      { name: "Computer Networks Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "ritika_patel",
    name: "Ritika Patel",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "TCS Digital",
    role: "Digital Engineer",
    semester: "7",
    cgpa: "8.6",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on Python and engineering mathematics.",
      secondYear: "Started machine learning and DSA.",
      thirdYear: "Worked on sentiment analysis project.",
      fourthYear: "Prepared for placements and aptitude.",
      prep: "Aptitude, Python, DSA, ML.",
      projects: "Sentiment Analysis Model",
      howSecured: "Aptitude test, coding round and technical interview."
    },
    resources: [
      { name: "Python Docs", type: "Language" },
      { name: "ML Basics", type: "AI/ML" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "mohit_agrawal",
    name: "Mohit Agrawal",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "Capgemini",
    role: "Software Analyst",
    semester: "7",
    cgpa: "8.4",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored coding and joined technical clubs.",
      secondYear: "Built Java projects and learned SQL.",
      thirdYear: "Completed internship and hackathons.",
      fourthYear: "Focused on placement drives.",
      prep: "Java, SQL, DSA Basics.",
      projects: "Java Console Projects, Database design",
      howSecured: "Aptitude, coding assessment and interview."
    },
    resources: [
      { name: "Java Fundamentals", type: "Language" },
      { name: "SQL Tutorial", type: "Database" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "harsh_vyas",
    name: "Harsh Vyas",
    branch: "CSE",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Flipkart",
    role: "SDE-1",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Strong programming fundamentals.",
      secondYear: "DSA and database systems.",
      thirdYear: "Competitive coding and internship.",
      fourthYear: "Advanced interview preparation.",
      prep: "LeetCode, Codeforces, DBMS.",
      projects: "Database Engine Simulator, Web Apps",
      howSecured: "OA, technical rounds and behavioral round."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Codeforces", type: "CP" },
      { name: "DBMS Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "shreya_nair",
    name: "Shreya Nair",
    branch: "CSE",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Walmart Global Tech",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Started with coding fundamentals and joined programming groups.",
      secondYear: "Mastered core DSA and started web technologies.",
      thirdYear: "Dived into Machine learning and did some AI projects.",
      fourthYear: "Dedicated revision of CS fundamentals and practice interviews.",
      prep: "LeetCode, ML Projects, OOPs.",
      projects: "Machine Learning Predictor, E-Commerce Search API",
      howSecured: "Coding OA followed by technical interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "OOPs Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "yash_thakur",
    name: "Yash Thakur",
    branch: "EXTC",
    subBranch: "EXTC",
    passoutYear: "2026",
    company: "Qualcomm",
    role: "Associate Engineer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned fundamentals of hardware logic and circuit analysis.",
      secondYear: "Developed micro-controller programming skills and basic C/C++.",
      thirdYear: "Focused on Embedded Operating Systems and architecture concepts.",
      fourthYear: "Prepared for core technical evaluation in electronics.",
      prep: "Embedded C, OS, Computer Architecture.",
      projects: "Microcontroller Smart Hub, Operating System Simulator",
      howSecured: "Technical rounds focused on embedded systems."
    },
    resources: [
      { name: "Embedded C Guides", type: "Core" },
      { name: "Operating Systems Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "nidhi_shah",
    name: "Nidhi Shah",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "ZS Associates",
    role: "Business Technology Analyst",
    semester: "7",
    cgpa: "8.7",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Adapted to statistical logic and database querying basics.",
      secondYear: "Advanced data manipulation techniques in python and visualization.",
      thirdYear: "Practiced business case analysis and solving analytical problems.",
      fourthYear: "Reviewed analytics case studies, SQL, Excel, and statistics.",
      prep: "SQL, Excel, Python, Statistics.",
      projects: "Sales Forecasting Excel Dashboard, Data Pipeline in Python",
      howSecured: "Case study round and interviews."
    },
    resources: [
      { name: "SQL Tutorial", type: "Database" },
      { name: "Statistics Course", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "kunal_desai",
    name: "Kunal Desai",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "ServiceNow",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.1",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on learning programming logic with C and Java.",
      secondYear: "Mastered Data Structures and Algorithms with extensive coding.",
      thirdYear: "Built web applications using Spring Boot framework.",
      fourthYear: "Revised database management, OS, and prepared for placements.",
      prep: "Java, Spring Boot, DSA.",
      projects: "Spring Boot Enterprise CRM, Algorithm Visualizer",
      howSecured: "OA followed by coding and project discussions."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Spring Boot Guide", type: "Backend" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "simran_kaur_2026",
    name: "Simran Kaur",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Fractal Analytics",
    role: "Data Scientist",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduction to coding logic and applied statistics.",
      secondYear: "Practiced standard ML algorithms and statistics.",
      thirdYear: "Worked on predictive analytics case studies.",
      fourthYear: "Focused on modeling, Python, and analytics case studies.",
      prep: "Machine Learning, Statistics, Python.",
      projects: "Predictive Analytics Engine, Customer Segmentation Model",
      howSecured: "Case study and ML interview rounds."
    },
    resources: [
      { name: "ML Roadmaps", type: "AI/ML" },
      { name: "Applied Statistics", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "manav_bansal",
    name: "Manav Bansal",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "Cognizant",
    role: "Programmer Analyst",
    semester: "7",
    cgpa: "8.3",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Adapted to computer engineering coursework and logic building.",
      secondYear: "Studied Java backend and database architectures.",
      thirdYear: "Developed simple tools and did basic mock aptitude tests.",
      fourthYear: "Aptitude training, core CS subject revision.",
      prep: "Java, SQL, Aptitude.",
      projects: "Employee Ledger System",
      howSecured: "Online test and technical interview."
    },
    resources: [
      { name: "Aptitude Prep Guide", type: "Core" },
      { name: "SQL Practice", type: "Database" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "aditi_joshi",
    name: "Aditi Joshi",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "PayPal",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.2",
    photo: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Practiced coding languages and fundamental math.",
      secondYear: "Began resolving complex algorithms and completed basic backend development.",
      thirdYear: "Built secure payment dashboard APIs and studied system design.",
      fourthYear: "Mock interviews, coding rounds, and deep focus on placements.",
      prep: "LeetCode, System Design, Backend Projects.",
      projects: "Secured Wallet API, Distributed Chat App",
      howSecured: "DSA-heavy interviews and project discussions."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "System Design Primer", type: "System Design" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "saurabh_mishra",
    name: "Saurabh Mishra",
    branch: "CSE",
    subBranch: "DS",
    passoutYear: "2026",
    company: "American Express",
    role: "Engineer Analyst",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored Python and structured databases.",
      secondYear: "Studied OOPs, relational database management and basic DSA.",
      thirdYear: "Developed transaction dashboard projects and analytics tools.",
      fourthYear: "Advanced DSA practice and SQL optimization.",
      prep: "DSA, SQL, OOPs.",
      projects: "Transaction Fraud Detector",
      howSecured: "Coding assessment and interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "SQL Zoo", type: "Database" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "meera_iyer",
    name: "Meera Iyer",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Bosch",
    role: "AI Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned machine learning fundamentals and math for ML.",
      secondYear: "Started working with neural networks and deep learning.",
      thirdYear: "Collaborated on automated driver assistant projects.",
      fourthYear: "Revised core AI architectures and model deployments.",
      prep: "Deep Learning, ML Projects, Python.",
      projects: "Pedestrian Detection Model, Smart Sensor Integration",
      howSecured: "ML-based project discussions and coding round."
    },
    resources: [
      { name: "Deep Learning Book", type: "AI/ML" },
      { name: "TensorFlow Docs", type: "AI/ML" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "arnav_khanna",
    name: "Arnav Khanna",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "SAP Labs",
    role: "Developer Associate",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Practiced coding languages and adapted to computer engineering logic.",
      secondYear: "Studied OOPs, databases, computer networks, and basic web tools.",
      thirdYear: "Built enterprise-ready management dashboards and interned.",
      fourthYear: "Revised core CS concepts and solved algorithms.",
      prep: "Java, DBMS, CN.",
      projects: "Enterprise Planner System",
      howSecured: "Technical rounds and HR interview."
    },
    resources: [
      { name: "DBMS Notes", type: "Core" },
      { name: "Computer Networks Guide", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "priti_more",
    name: "Priti More",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "Wipro Turbo",
    role: "Project Engineer",
    semester: "7",
    cgpa: "8.4",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Acquired fundamentals of logic design and C programming.",
      secondYear: "Strengthened core CS theory and basic algorithms.",
      thirdYear: "Completed database modeling tasks and minor projects.",
      fourthYear: "Aptitude drills and quick DSA revision.",
      prep: "DSA, Aptitude, Core CS Subjects.",
      projects: "Inventory System App",
      howSecured: "Online assessment and interview."
    },
    resources: [
      { name: "GeeksforGeeks DSA", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "dev_malhotra",
    name: "Dev Malhotra",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Intuit",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.3",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Strong core logic development and programming syntax.",
      secondYear: "Mastered algorithmic optimizations and data structures.",
      thirdYear: "Built highly distributed scalable architecture apps.",
      fourthYear: "Advanced mock interview runs and LLD preparations.",
      prep: "900+ LeetCode Questions, System Design, OOPs.",
      projects: "Distributed Task Scheduler, Mock payment gateway",
      howSecured: "Hard coding rounds, LLD and behavioral rounds."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "LLD Guides", type: "System Design" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "isha_mehta",
    name: "Isha Mehta",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Deloitte USI",
    role: "Data Analyst",
    semester: "7",
    cgpa: "8.6",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned statistics and analytical tools basics.",
      secondYear: "Studied query syntax, data models, and analytical formulas.",
      thirdYear: "Built analytics reports and worked with mock client pipelines.",
      fourthYear: "Polished dashboarding, SQL, and business metrics.",
      prep: "SQL, Python, Power BI.",
      projects: "Business Intelligence dashboard, Python scraping scripts",
      howSecured: "Analytics case study and interviews."
    },
    resources: [
      { name: "Power BI documentation", type: "Tools" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "ritesh_pawar",
    name: "Ritesh Pawar",
    branch: "EXTC",
    subBranch: "EXTC",
    passoutYear: "2026",
    company: "Siemens",
    role: "Graduate Engineer Trainee",
    semester: "7",
    cgpa: "8.5",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Familiarized with fundamental electrical networks and instrumentation.",
      secondYear: "Studied logic gates, microcontrollers, and C programming.",
      thirdYear: "Built automation hardware models and interned.",
      fourthYear: "Revised control systems, signals, and instrumentation logic.",
      prep: "Electronics Fundamentals, C Programming.",
      projects: "Home automation system, Signals generator",
      howSecured: "Technical interview on electronics and projects."
    },
    resources: [
      { name: "Electronics roadmaps", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "tanisha_kapoor",
    name: "Tanisha Kapoor",
    branch: "CSE",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Accenture Advanced Technology",
    role: "Application Development Associate",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduced to OOPs, programming concepts and cloud basics.",
      secondYear: "Started using Java for standard app development and basic algorithms.",
      thirdYear: "Dived into simple cloud functions and server hosting.",
      fourthYear: "Mock interviews and placement preparations.",
      prep: "Java, DSA, Cloud Basics.",
      projects: "Cloud-hosted task manager, Java App",
      howSecured: "OA, technical interview and HR round."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Cloud Basics Guides", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "omkar_salunkhe",
    name: "Omkar Salunkhe",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Barclays",
    role: "Technology Developer",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Acquired fundamentals of computers, C++ coding and design structures.",
      secondYear: "Focused heavily on OOPs, data structures, and database query setups.",
      thirdYear: "Completed enterprise banking web apps and backend services.",
      fourthYear: "Maintained good practice of DSA, systems, and banking domain cases.",
      prep: "DSA, SQL, System Design, Backend Development.",
      projects: "Mock Banking Ledger, Secure Transfer API",
      howSecured: "OA, coding rounds, managerial and HR interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "SQL Zoo", type: "Database" }
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

    console.log('All 20 new stories successfully seeded!');
  } catch (err) {
    console.error('Error seeding stories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedStories();
