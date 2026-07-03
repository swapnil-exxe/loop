require('dotenv').config();
const mongoose = require('mongoose');
const { Achievement } = require('./models');

const achievementsToSeed = [
  {
    id: "team_innovatex_2021",
    title: "Team InnovateX Wins Internal College Hackathon 2021",
    category: "Hackathon Winners",
    date: "2021-08-15",
    description: "Team InnovateX secured 1st place in the annual college hackathon by developing a smart attendance and analytics platform. The team competed against 80+ student teams and impressed the judges with innovation, usability, and technical implementation.",
    image: "/achievements/ach_2021.png"
  },
  {
    id: "spit_acm_snackdown_2022",
    title: "SPIT ACM Team Ranks 2nd in CodeChef SnackDown 2022",
    category: "Competition Winners",
    date: "2022-09-10",
    description: "The SPIT ACM coding team achieved 2nd position in the regional round of CodeChef SnackDown 2022. The team demonstrated strong problem-solving skills and algorithmic expertise while competing against top engineering colleges.",
    image: "/achievements/ach_2022.png"
  },
  {
    id: "team_bytebuddies_2023",
    title: "Team ByteBuddies Wins Mumbai Hackathon 2023",
    category: "Hackathon Winners",
    date: "2023-07-22",
    description: "Team ByteBuddies won the Mumbai Hackathon 2023 with their AI-powered career guidance platform. Their solution was recognized for addressing real student challenges through technology and data-driven recommendations.",
    image: "/achievements/ach_2023.png"
  },
  {
    id: "spit_enactus_2024",
    title: "SPIT Enactus Team Wins National Innovation Challenge 2024",
    category: "Competition Winners",
    date: "2024-10-18",
    description: "The SPIT Enactus team secured the national title at the Innovation Challenge 2024. Their social impact project focused on empowering local communities through sustainable entrepreneurship and digital transformation.",
    image: "/achievements/ach_2024.png"
  },
  {
    id: "spit_codex_sih_2026",
    title: "SPIT CodeX Team Wins Smart India Hackathon 2026",
    category: "Hackathon Winners",
    date: "2026-04-12",
    description: "Team CodeX emerged as winners at Smart India Hackathon 2026 with their AI-based Smart Campus Management System. Competing against more than 1,200 teams nationwide, they impressed judges with innovation, scalability, and real-world impact.",
    image: "/achievements/ach_2026.png"
  }
];

async function seedAchievements() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  console.log('Connecting to database...');
  try {
    await mongoose.connect(uri);
    console.log('Connected successfully. Clearing existing achievements...');

    // Clear existing achievements to avoid duplicate keys if re-run
    await Achievement.deleteMany({ id: { $in: achievementsToSeed.map(a => a.id) } });

    console.log('Inserting achievements...');
    const result = await Achievement.insertMany(achievementsToSeed);
    console.log(`Successfully seeded ${result.length} achievements!`);
  } catch (err) {
    console.error('Error seeding achievements:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedAchievements();
