require('dotenv').config();
const mongoose = require('mongoose');
const { Story } = require('./models');

const rawStudents = [
  { name: "Arjun Mehra", branch: "CSE", subBranch: "CSE", passoutYear: "2021", company: "Infosys", role: "Systems Engineer", cgpa: "8.2" },
  { name: "Riya Sharma", branch: "CE", subBranch: "CE", passoutYear: "2022", company: "TCS Digital", role: "Digital Engineer", cgpa: "8.5" },
  { name: "Karan Patel", branch: "CSE", subBranch: "AI", passoutYear: "2023", company: "Amazon", role: "SDE-1", cgpa: "9.1" },
  { name: "Sneha Joshi", branch: "DS", subBranch: "DS", passoutYear: "2024", company: "Fractal Analytics", role: "Data Scientist", cgpa: "8.8" },
  { name: "Yash Gupta", branch: "CSE", subBranch: "CSE", passoutYear: "2025", company: "Microsoft", role: "Software Engineer", cgpa: "9.3" },
  { name: "Tanvi Kulkarni", branch: "AI", subBranch: "AI", passoutYear: "2026", company: "Adobe", role: "MTS", cgpa: "8.9" },
  { name: "Aditya Singh", branch: "CSE", subBranch: "CSE", passoutYear: "2027", company: "Atlassian", role: "Software Engineer", cgpa: "9.0" },
  { name: "Neha Agarwal", branch: "DS", subBranch: "DS", passoutYear: "2028", company: "Goldman Sachs", role: "Analyst", cgpa: "8.7" },
  { name: "Rahul Deshmukh", branch: "EXTC", subBranch: "EXTC", passoutYear: "2021", company: "Siemens", role: "Graduate Engineer", cgpa: "8.4" },
  { name: "Pooja Shah", branch: "CSE", subBranch: "AI", passoutYear: "2022", company: "Nvidia", role: "AI Engineer", cgpa: "9.2" },
  { name: "Akshay Nair", branch: "CE", subBranch: "CE", passoutYear: "2023", company: "Cognizant", role: "Programmer Analyst", cgpa: "8.1" },
  { name: "Ishita Verma", branch: "AI", subBranch: "AI", passoutYear: "2024", company: "Samsung R&D", role: "Research Engineer", cgpa: "9.4" },
  { name: "Mohit Jain", branch: "CSE", subBranch: "CSE", passoutYear: "2025", company: "Uber", role: "Software Engineer", cgpa: "9.1" },
  { name: "Simran Kaur", branch: "DS", subBranch: "DS", passoutYear: "2026", company: "Deloitte", role: "Data Analyst", cgpa: "8.6" },
  { name: "Nikhil Bansal", branch: "CSE", subBranch: "CSE", passoutYear: "2027", company: "Oracle", role: "Software Developer", cgpa: "8.9" },
  { name: "Aditi Rao", branch: "AI", subBranch: "AI", passoutYear: "2028", company: "Bosch", role: "AI Engineer", cgpa: "8.8" },
  { name: "Vivek Sharma", branch: "CSE", subBranch: "CSE", passoutYear: "2021", company: "PayPal", role: "Software Engineer", cgpa: "8.9" },
  { name: "Harsh Patil", branch: "CE", subBranch: "CE", passoutYear: "2022", company: "Accenture", role: "Application Developer", cgpa: "8.3" },
  { name: "Meera Kapoor", branch: "DS", subBranch: "DS", passoutYear: "2023", company: "American Express", role: "Analyst Engineer", cgpa: "8.8" },
  { name: "Saurabh Mishra", branch: "CSE", subBranch: "CSE", passoutYear: "2024", company: "Cisco", role: "Software Engineer", cgpa: "8.7" },
  { name: "Ananya Iyer", branch: "AI", subBranch: "AI", passoutYear: "2025", company: "Walmart Global Tech", role: "Software Engineer", cgpa: "9.0" },
  { name: "Dev Malhotra", branch: "CSE", subBranch: "CSE", passoutYear: "2026", company: "JP Morgan Chase", role: "Software Engineer", cgpa: "9.1" },
  { name: "Priyansh Gupta", branch: "CSE", subBranch: "CSE", passoutYear: "2027", company: "Morgan Stanley", role: "Technology Analyst", cgpa: "8.8" },
  { name: "Kavya Menon", branch: "DS", subBranch: "DS", passoutYear: "2028", company: "HSBC", role: "Data Analyst", cgpa: "8.7" },
  { name: "Omkar Salunkhe", branch: "EXTC", subBranch: "EXTC", passoutYear: "2021", company: "Qualcomm", role: "Embedded Engineer", cgpa: "8.8" },
  { name: "Shreya Nair", branch: "AI", subBranch: "AI", passoutYear: "2022", company: "Tiger Analytics", role: "Data Scientist", cgpa: "8.9" },
  { name: "Aarush Khanna", branch: "CSE", subBranch: "CSE", passoutYear: "2023", company: "ServiceNow", role: "Software Engineer", cgpa: "9.2" },
  { name: "Rohan Verma", branch: "CE", subBranch: "CE", passoutYear: "2024", company: "Capgemini", role: "Analyst", cgpa: "8.2" },
  { name: "Muskan Agarwal", branch: "DS", subBranch: "DS", passoutYear: "2025", company: "Mu Sigma", role: "Data Analyst", cgpa: "8.5" },
  { name: "Arnav Joshi", branch: "CSE", subBranch: "AI", passoutYear: "2026", company: "SAP Labs", role: "Associate Developer", cgpa: "9.0" },
  { name: "Tanya Bhatia", branch: "AI", subBranch: "AI", passoutYear: "2027", company: "IBM", role: "AI Engineer", cgpa: "8.8" },
  { name: "Kunal Shah", branch: "CSE", subBranch: "CSE", passoutYear: "2028", company: "Razorpay", role: "SDE-1", cgpa: "9.1" },
  { name: "Ritika Patel", branch: "DS", subBranch: "DS", passoutYear: "2021", company: "ZS Associates", role: "Business Technology Analyst", cgpa: "8.6" },
  { name: "Aman Tiwari", branch: "CSE", subBranch: "CSE", passoutYear: "2022", company: "Zoho", role: "Software Developer", cgpa: "8.7" },
  { name: "Bhavya Arora", branch: "AI", subBranch: "AI", passoutYear: "2024", company: "Intuit", role: "Software Engineer", cgpa: "9.3" },
  { name: "Siddharth Mehta", branch: "CSE", subBranch: "CSE", passoutYear: "2025", company: "Netflix", role: "Software Engineer", cgpa: "9.5" },
  { name: "Anushka Kulkarni", branch: "DS", subBranch: "DS", passoutYear: "2028", company: "Fractal Analytics", role: "Data Scientist", cgpa: "8.9" }
];

const firstYearOptions = [
  "Maintained a strong GPA, focused on adapts to university and college environment.",
  "Participated in college tech clubs and learned C/C++ syntax foundations.",
  "Learned programming basics with Python and web styling tags (HTML/CSS).",
  "Participated in initial coding challenges and hackathons to test fundamental logics."
];

const secondYearOptions = [
  "Completed basic and intermediate DSA arrays, lists, strings. Began LeetCode puzzles.",
  "Developed web projects, learned React/Node configurations and SQL databases.",
  "Focused heavily on core OOPs principles and system architectures.",
  "Dived into Data Structures and Algorithms with Java, solved 250+ tasks."
];

const thirdYearOptions = [
  "Secured a summer internship and completed core university projects.",
  "Completed complex data models, advanced algorithms, trees, and graphs.",
  "Built MERN stack interfaces and worked on database scaling problems.",
  "Participated in Smart India Hackathon and completed a fintech app project."
];

const fourthYearOptions = [
  "Focused on placements, case analysis, and regular mock technical runs.",
  "Revised Operating Systems, Computer Networks, and DBMS sheets.",
  "Mock interview runs and optimized resume profiles.",
  "Revised system design architectures and completed company prep sheets."
];

const prepOptions = [
  "LeetCode, Striver Sheet, DBMS notes, OS sheets.",
  "LeetCode, System Design Primer, SQL tutorials.",
  "Aptitude guides, Java basics, SQL schemas.",
  "Python, ML theory, statistics roadmaps, Kaggle tasks."
];

const howSecuredOptions = [
  "OA with 2 medium coding questions followed by 3 rounds of technical interviews.",
  "Aptitude assessment, coding test, and 2 rounds of technical/HR conversations.",
  "Resume shortlisting, technical rounds on project structures, LLD and system models.",
  "ML/analytical case study discussion followed by behavioral rounds."
];

const photos = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400"
];

const resourcesList = [
  [{ name: "LeetCode", type: "DSA" }, { name: "Striver Sheet", type: "DSA" }],
  [{ name: "SQL Zoo", type: "Database" }, { name: "System Design Primer", type: "System Design" }],
  [{ name: "Kaggle", type: "AI/ML" }, { name: "Python Docs", type: "Language" }],
  [{ name: "GeeksforGeeks", type: "Core CS" }]
];

async function seedRemainingStories() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  console.log('Connecting to database to insert stories 66 to 102...');
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');

    let count = 0;
    for (const raw of rawStudents) {
      const id = raw.name.toLowerCase().replace(/\s+/g, '_') + '_' + raw.passoutYear;
      
      const firstYear = firstYearOptions[Math.floor(Math.random() * firstYearOptions.length)];
      const secondYear = secondYearOptions[Math.floor(Math.random() * secondYearOptions.length)];
      const thirdYear = thirdYearOptions[Math.floor(Math.random() * thirdYearOptions.length)];
      const fourthYear = fourthYearOptions[Math.floor(Math.random() * fourthYearOptions.length)];
      const prep = prepOptions[Math.floor(Math.random() * prepOptions.length)];
      const howSecured = howSecuredOptions[Math.floor(Math.random() * howSecuredOptions.length)];
      const photo = photos[Math.floor(Math.random() * photos.length)];
      const resources = resourcesList[Math.floor(Math.random() * resourcesList.length)];

      const story = {
        id,
        name: raw.name,
        branch: raw.branch,
        subBranch: raw.subBranch,
        passoutYear: raw.passoutYear,
        company: raw.company,
        role: raw.role,
        semester: "7",
        cgpa: raw.cgpa,
        photo,
        journey: {
          firstYear,
          secondYear,
          thirdYear,
          fourthYear,
          prep,
          projects: "College Major Project, Minor Web Interface",
          howSecured
        },
        resources,
        resume: "",
        resumeFile: null,
        studyMaterials: []
      };

      await Story.findOneAndUpdate({ id }, story, { upsert: true, new: true });
      console.log(`Seeded story ${id} for ${raw.name} (${raw.company})`);
      count++;
    }

    console.log(`Successfully seeded ${count} additional student profiles!`);
  } catch (err) {
    console.error('Error seeding stories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedRemainingStories();
