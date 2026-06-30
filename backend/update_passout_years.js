require('dotenv').config();
const mongoose = require('mongoose');
const { Story } = require('./models');

async function updatePassoutYears() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  console.log('Connecting to database...');
  try {
    await mongoose.connect(uri);
    console.log('Connected successfully.');

    const stories = await Story.find({});
    console.log(`Found ${stories.length} stories in total. Modifying passout years...`);

    let updatedCount = 0;
    for (const story of stories) {
      // Generate random year between 2021 and 2028 inclusive
      const randomYear = Math.floor(Math.random() * (2028 - 2021 + 1)) + 2021;
      
      story.passoutYear = String(randomYear);
      await story.save();
      updatedCount++;
    }

    console.log(`Successfully updated passoutYear to a random year (2021-2028) for ${updatedCount} stories!`);
  } catch (err) {
    console.error('Error updating stories:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

updatePassoutYears();
