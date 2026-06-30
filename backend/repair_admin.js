require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

const primaryUri = process.env.MONGODB_URI;
const fallbackUri = 'mongodb://127.0.0.1:27017/loop_db';

async function main() {
  await mongoose.connect(primaryUri || fallbackUri);
  await User.updateOne(
    { email: 'admin@spit.ac.in' },
    { 
      role: 'Administrator', 
      onboarded: true, 
      hasPendingEdit: false,
      pendingRole: ''
    }
  );
  console.log("Admin account repaired successfully!");
  await mongoose.disconnect();
}
main().catch(console.error);
