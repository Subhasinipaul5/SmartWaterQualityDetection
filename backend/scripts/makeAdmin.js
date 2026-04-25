/**
 * makeAdmin.js — One-time script to promote an existing account to admin
 *
 * Usage (run from inside the backend/ folder):
 *   node scripts/makeAdmin.js your_email@gmail.com
 *
 * Example:
 *   node scripts/makeAdmin.js arjun@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('\n❌  Please provide an email address.');
  console.error('    Usage: node scripts/makeAdmin.js paulsubhasini31@gmail.com\n');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected to MongoDB:', process.env.MONGO_URI);

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`\n❌  No account found with email: ${email}`);
      console.error('    Make sure you have registered first on the website.\n');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`\n✅  ${user.name} (${user.email}) is already an admin. Nothing changed.\n`);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save({ validateBeforeSave: false });

    console.log('\n🎉  SUCCESS!');
    console.log(`    Name  : ${user.name}`);
    console.log(`    Email : ${user.email}`);
    console.log(`    Role  : ${user.role.toUpperCase()}`);
    console.log('\n    You can now log in to the admin panel with this account.\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌  Error:', err.message);
    process.exit(1);
  }
};

run();
