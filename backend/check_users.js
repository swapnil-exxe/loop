require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

const primaryUri = process.env.MONGODB_URI;
const fallbackUri = 'mongodb://127.0.0.1:27017/loop_db';

async function main() {
  await mongoose.connect(primaryUri || fallbackUri);
  const users = await User.find({});
  console.log("Users in DB:", JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}
main().catch(console.error);
