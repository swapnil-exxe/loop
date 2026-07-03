require('dotenv').config();
const mongoose = require('mongoose');
const { Story } = require('./models');

const storiesToSeed = [
  {
    id: "rohit_kulkarni",
    name: "Rohit Kulkarni",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Netflix",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.4",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored coding fundamentals, syntax, and simple logic.",
      secondYear: "Mastered basic and intermediate DSA constructs and algorithms.",
      thirdYear: "Dived into competitive coding and backend frameworks, interned at startup.",
      fourthYear: "Practiced mock runs and final revision.",
      prep: "LeetCode 1200+, Codeforces, System Design.",
      projects: "Startup Backend Engine, Real-time Stream Handler",
      howSecured: "4 coding rounds, project discussion, behavioral round."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "Codeforces", type: "CP" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "anjali_patil",
    name: "Anjali Patil",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "IBM",
    role: "AI Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Adapted to coding logic using Python.",
      secondYear: "Studied basic statistics, ML libraries, and basic DSA.",
      thirdYear: "Constructed NLP-driven tools and deep learning models.",
      fourthYear: "Revised theoretical architectures.",
      prep: "Kaggle, ML Specialization, Interview Prep.",
      projects: "NLP Sentiment Analyzer",
      howSecured: "ML concepts, coding and project discussions."
    },
    resources: [
      { name: "Kaggle ML roadmaps", type: "AI/ML" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "sarthak_jain",
    name: "Sarthak Jain",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Zoho",
    role: "Software Developer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on OOPs foundations in Java.",
      secondYear: "Completed database setups and web project routes.",
      thirdYear: "Created full-stack applications.",
      fourthYear: "Did regular practice rounds.",
      prep: "DSA, OOPs, DBMS.",
      projects: "Full-stack CRM",
      howSecured: "Coding test and technical interviews."
    },
    resources: [
      { name: "Java Reference Docs", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "muskan_shah",
    name: "Muskan Shah",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Mu Sigma",
    role: "Data Analyst",
    semester: "7",
    cgpa: "8.5",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned math and SQL basics.",
      secondYear: "Studied spreadsheet methods, statistics, and basics of python.",
      thirdYear: "Conducted analytical report case studies.",
      fourthYear: "Prepared metrics worksheets.",
      prep: "Power BI, Excel, Python.",
      projects: "Business Intelligence sheet, Scraping Script",
      howSecured: "Analytics case study and interviews."
    },
    resources: [
      { name: "Power BI Docs", type: "BI Tool" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "abhishek_yadav",
    name: "Abhishek Yadav",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "HCL Technologies",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.4",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Familiarized with code compilation and programming syntax.",
      secondYear: "Learned Java structures and basic algorithmic patterns.",
      thirdYear: "Participated in university lab projects.",
      fourthYear: "Aptitude training.",
      prep: "Aptitude, SQL, Java.",
      projects: "Local directory app",
      howSecured: "OA and technical round."
    },
    resources: [
      { name: "Aptitude practice tests", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "pranav_deshmukh",
    name: "Pranav Deshmukh",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Razorpay",
    role: "SDE-1",
    semester: "7",
    cgpa: "9.2",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored backend logic and simple DB queries.",
      secondYear: "Studied OOPs, transaction processing, and basic DSA.",
      thirdYear: "Built transaction processing engines and backend APIs.",
      fourthYear: "System design practice and mock code reviews.",
      prep: "Spring Boot, DSA, LLD.",
      projects: "Transaction Hub backend, Wallet API",
      howSecured: "Coding rounds and system design."
    },
    resources: [
      { name: "Spring Guides", type: "Backend" },
      { name: "LeetCode", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "shruti_nair",
    name: "Shruti Nair",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Tiger Analytics",
    role: "Data Scientist",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Acquired linear algebra and python skills.",
      secondYear: "Explored model fitting, analytics, and data cleansing.",
      thirdYear: "Dived into neural configurations, research structures.",
      fourthYear: "Analyzed case sheets.",
      prep: "Python, ML, Statistics.",
      projects: "Research Paper on Data Analytics",
      howSecured: "ML case study and technical rounds."
    },
    resources: [
      { name: "Statistics Roadmap", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "keshav_gupta",
    name: "Keshav Gupta",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Oracle Financial Services",
    role: "Associate Consultant",
    semester: "7",
    cgpa: "8.7",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Adapted to coding syntax in Java.",
      secondYear: "Mastered databases, SQL, and OOPs configurations.",
      thirdYear: "Designed simple enterprise dashboards.",
      fourthYear: "Aptitude and CS fundamentals.",
      prep: "OOPs, DBMS.",
      projects: "Enterprise Ledger Tool",
      howSecured: "Coding and managerial round."
    },
    resources: [
      { name: "DBMS Cheat Sheets", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "vaishnavi_rao",
    name: "Vaishnavi Rao",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "HSBC",
    role: "Data Analyst",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Acquired database logic and Excel mechanics.",
      secondYear: "Learned data structuring, scripting in Python.",
      thirdYear: "Assembled dashboard projects for university data.",
      fourthYear: "Refined visualization reporting styles.",
      prep: "SQL, Power BI, Python.",
      projects: "HSBC Mock Analytics Panel",
      howSecured: "Analytics and HR rounds."
    },
    resources: [
      { name: "Power BI Reference", type: "BI Tool" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "tushar_mishra",
    name: "Tushar Mishra",
    branch: "EXTC",
    subBranch: "EXTC",
    passoutYear: "2026",
    company: "Intel",
    role: "Firmware Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Understood electronics foundations and logic maps.",
      secondYear: "Developed microcontroller programs and assembly coding.",
      thirdYear: "Worked on low-level firmware optimizations.",
      fourthYear: "Reviewed architecture and compiler basics.",
      prep: "C++, OS, Microcontrollers.",
      projects: "Firmware Scheduler, Custom Controller Code",
      howSecured: "Technical electronics interviews."
    },
    resources: [
      { name: "Microcontrollers Guide", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "aayushi_kapoor",
    name: "Aayushi Kapoor",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Adobe",
    role: "MTS",
    semester: "7",
    cgpa: "9.3",
    photo: "https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Started with programming fundamentals and joined developer clubs.",
      secondYear: "Explored advanced data structures and algorithms.",
      thirdYear: "Built complex web projects (React/Node) and did internships.",
      fourthYear: "Did coding practice runs and interview reviews.",
      prep: "LeetCode, React, Node.js.",
      projects: "Scalable Web Editor, File Share App",
      howSecured: "OA, coding and design rounds."
    },
    resources: [
      { name: "LeetCode", type: "DSA" },
      { name: "React Guides", type: "Web Dev" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "vivek_sharma",
    name: "Vivek Sharma",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "Infosys",
    role: "Specialist Programmer",
    semester: "7",
    cgpa: "8.5",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduction to code logic and simple logic puzzles.",
      secondYear: "Mastered basic data structures.",
      thirdYear: "Dived into simple console apps and competitive rounds.",
      fourthYear: "Practiced online assessment patterns.",
      prep: "DSA and aptitude.",
      projects: "Local database search tool",
      howSecured: "Coding test and interviews."
    },
    resources: [
      { name: "Aptitude guides", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "harini_iyer",
    name: "Harini Iyer",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Nvidia",
    role: "AI Research Intern PPO",
    semester: "7",
    cgpa: "9.4",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned foundations of algebra, calculus, and Python.",
      secondYear: "Studied theoretical deep learning models.",
      thirdYear: "Worked on research papers and AI projects.",
      fourthYear: "Practiced ML interviews.",
      prep: "Deep Learning and Mathematics.",
      projects: "Research Paper on Deep Neural Networks",
      howSecured: "Research-oriented interviews."
    },
    resources: [
      { name: "Deep Learning Book", type: "Books" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "sanket_more",
    name: "Sanket More",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "SAP Labs",
    role: "Associate Developer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Developed basic syntax skills in Java and web layout logic.",
      secondYear: "Mastered core algorithms, indexing, and tables in DBMS.",
      thirdYear: "Built backend services and minor cloud setups.",
      fourthYear: "Revised SQL schemas and OOPs theory.",
      prep: "Java, SQL, Cloud Basics.",
      projects: "Cloud deployment dashboard",
      howSecured: "Technical and HR rounds."
    },
    resources: [
      { name: "SQL Zoo", type: "Database" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "riya_agarwal",
    name: "Riya Agarwal",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Fractal Analytics",
    role: "Analyst",
    semester: "7",
    cgpa: "8.7",
    photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned statistics basics and coding formats.",
      secondYear: "Explored predictive modeling libraries in Python.",
      thirdYear: "Completed data science projects and internships.",
      fourthYear: "Refined modeling theories.",
      prep: "Statistics and Python.",
      projects: "Customer Churn Prediction Model",
      howSecured: "Analytics interview."
    },
    resources: [
      { name: "Statistics Roadmaps", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "adarsh_singh",
    name: "Adarsh Singh",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Uber",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.5",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Active on programming forums, learned C++.",
      secondYear: "Mastered advanced algorithms, graphs, DP, and segment trees.",
      thirdYear: "Began competitive programming and became an expert on Codeforces, contributed to open source.",
      fourthYear: "System design preparation and mock runs.",
      prep: "Graphs, DP, System Design.",
      projects: "Open Source Contributor to Linux Core, Distributed Database",
      howSecured: "Multiple coding interviews."
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
    id: "sneha_joshi",
    name: "Sneha Joshi",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Accenture",
    role: "Data Engineer",
    semester: "7",
    cgpa: "8.6",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Focused on basic database logic and scripting in Python.",
      secondYear: "Mastered Big Data pipelines and ML basics.",
      thirdYear: "Assembled scalable Spark and Big Data pipelines.",
      fourthYear: "Analyzed query setups.",
      prep: "SQL, Spark, Python.",
      projects: "Spark Data ETL Pipeline",
      howSecured: "Technical interviews."
    },
    resources: [
      { name: "Spark reference guides", type: "Tools" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "nikhil_bansal",
    name: "Nikhil Bansal",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Goldman Sachs",
    role: "Analyst",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduction to code logic and data models.",
      secondYear: "Completed banking dashboard projects and core CS studies.",
      thirdYear: "Constructed finance-tech applications.",
      fourthYear: "Revised SQL structures.",
      prep: "DSA and DBMS.",
      projects: "Finance Ledger API",
      howSecured: "OA and interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "kavya_menon",
    name: "Kavya Menon",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "Deloitte",
    role: "Data Analyst",
    semester: "7",
    cgpa: "8.5",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Studied algebra metrics and basic Excel tables.",
      secondYear: "Developed query logic in SQL.",
      thirdYear: "Entered and won analytics competitions.",
      fourthYear: "Refined analytics case methods.",
      prep: "SQL and Power BI.",
      projects: "Analytics Dashboard Tracker",
      howSecured: "Case study round."
    },
    resources: [
      { name: "SQL Tutorial", type: "Database" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "raj_verma",
    name: "Raj Verma",
    branch: "CE",
    subBranch: "CE",
    passoutYear: "2026",
    company: "LTIMindtree",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.4",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned Java and syntax rules.",
      secondYear: "Built web frontends and basic relational databases.",
      thirdYear: "Collaborated on web portal tasks.",
      fourthYear: "Aptitude preparations.",
      prep: "Aptitude and coding.",
      projects: "Web Portal Interface",
      howSecured: "OA and interviews."
    },
    resources: [
      { name: "Java tutorials", type: "Language" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "neha_khandelwal",
    name: "Neha Khandelwal",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Walmart Global Tech",
    role: "SDE",
    semester: "7",
    cgpa: "9.1",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Developed programming bases and structured algorithms.",
      secondYear: "Mastered data structuring and database indexing.",
      thirdYear: "Designed backend systems and completed DSA practices.",
      fourthYear: "Interfaced design mock interviews.",
      prep: "LeetCode and projects.",
      projects: "E-Commerce Transaction Ledger",
      howSecured: "Coding and design interviews."
    },
    resources: [
      { name: "LeetCode", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "arpit_choudhary",
    name: "Arpit Choudhary",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Paytm",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduced to Android app logic and C++.",
      secondYear: "Began coding with Java and mobile interfaces.",
      thirdYear: "Built multiple Android apps and backend services.",
      fourthYear: "Revised web frameworks.",
      prep: "Java, Spring Boot.",
      projects: "Android Wallet App",
      howSecured: "Technical interviews."
    },
    resources: [
      { name: "Android Developer Roadmap", type: "Mobile" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "pooja_sinha",
    name: "Pooja Sinha",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Bosch",
    role: "AI Engineer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Python syntax drills and mathematical logic.",
      secondYear: "Explored ML classifiers and data structures.",
      thirdYear: "Created computer vision models and classification dashboards.",
      fourthYear: "Analyzed neural layers.",
      prep: "Deep Learning.",
      projects: "Computer Vision Object Classifier",
      howSecured: "ML-focused interviews."
    },
    resources: [
      { name: "ML Tutorial Guides", type: "AI/ML" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "dhruv_shah",
    name: "Dhruv Shah",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Morgan Stanley",
    role: "Technology Analyst",
    semester: "7",
    cgpa: "9.0",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned C++ concepts and coding rules.",
      secondYear: "Practiced backend logic, DBMS, and OOPs concepts.",
      thirdYear: "Constructed transaction dashboards and did DSA drills.",
      fourthYear: "CS core subject revisions.",
      prep: "SQL, OOPs, DSA.",
      projects: "Mock Stock Exchange app",
      howSecured: "Coding and behavioral rounds."
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
    id: "ishaan_gupta",
    name: "Ishaan Gupta",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Atlassian",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.3",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored coding languages and open-source formats.",
      secondYear: "Mastered DSA and database modeling.",
      thirdYear: "Contributed to major open-source repositories and won hackathons.",
      fourthYear: "Prepared for low-level design structures.",
      prep: "LeetCode 1000+, LLD.",
      projects: "Open Source Contributor, Collaborative Coding Platform",
      howSecured: "OA, coding and design rounds."
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
    id: "megha_patwardhan",
    name: "Megha Patwardhan",
    branch: "DS",
    subBranch: "DS",
    passoutYear: "2026",
    company: "American Express",
    role: "Analyst Engineer",
    semester: "7",
    cgpa: "8.8",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Learned SQL foundations and statistics basics.",
      secondYear: "Advanced data sorting and indexing structures in python.",
      thirdYear: "Designed analytics reports and SQL optimization engines.",
      fourthYear: "Analyzed relational schemas.",
      prep: "Python and DBMS.",
      projects: "Analytics Report Parser",
      howSecured: "Technical and HR rounds."
    },
    resources: [
      { name: "DBMS Notes", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "yuvraj_solanki",
    name: "Yuvraj Solanki",
    branch: "EXTC",
    subBranch: "EXTC",
    passoutYear: "2026",
    company: "Siemens",
    role: "Engineer Trainee",
    semester: "7",
    cgpa: "8.6",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Explored electronic circuits and microcontroller inputs.",
      secondYear: "Studied embedded systems logic, assembly, and C.",
      thirdYear: "Designed automated models and smart instrumentation.",
      fourthYear: "Revised control configurations.",
      prep: "Embedded Systems.",
      projects: "Smart Automation Interface",
      howSecured: "Technical rounds."
    },
    resources: [
      { name: "Embedded Systems Roadmap", type: "Core" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "aditi_malhotra",
    name: "Aditi Malhotra",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "Microsoft",
    role: "Software Engineer",
    semester: "7",
    cgpa: "9.4",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Introduction to code formatting and programming foundations.",
      secondYear: "Built web frontends and dived into backend structures.",
      thirdYear: "Completed Microsoft internship and secured PPO.",
      fourthYear: "Prepared design models and mock runs.",
      prep: "LeetCode, System Design.",
      projects: "Collaborative Board Editor, Web Hub",
      howSecured: "OA and 3 technical rounds."
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
    id: "sameer_khan",
    name: "Sameer Khan",
    branch: "CSE",
    subBranch: "CSE",
    passoutYear: "2026",
    company: "JP Morgan Chase",
    role: "Software Engineer",
    semester: "7",
    cgpa: "8.9",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Started coding with Java and OOPs rules.",
      secondYear: "Dived into SQL database configurations and web hosting.",
      thirdYear: "Developed transaction dashboard backends and hosted on AWS.",
      fourthYear: "CS core fundamentals revision.",
      prep: "Java, AWS, DSA.",
      projects: "AWS-hosted banking portal, Transaction API",
      howSecured: "Coding OA and interviews."
    },
    resources: [
      { name: "AWS Basics", type: "Cloud" },
      { name: "LeetCode", type: "DSA" }
    ],
    resume: "",
    resumeFile: null,
    studyMaterials: []
  },
  {
    id: "bhavya_arora",
    name: "Bhavya Arora",
    branch: "AI",
    subBranch: "AI",
    passoutYear: "2026",
    company: "Samsung R&D",
    role: "Research Engineer",
    semester: "7",
    cgpa: "9.1",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=400",
    journey: {
      firstYear: "Algebra foundations and Python syntax.",
      secondYear: "Explored convolutional layers and training ML models.",
      thirdYear: "Co-authored publications on deep learning models.",
      fourthYear: "ML algorithms revision.",
      prep: "ML, DL, Python.",
      projects: "ML Publication research software",
      howSecured: "Research and coding rounds."
    },
    resources: [
      { name: "Deep Learning documentation", type: "AI/ML" }
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

    console.log('All 30 additional stories successfully seeded!');
  } catch (err) {
    console.error('Error seeding stories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedStories();
