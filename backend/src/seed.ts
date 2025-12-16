import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import { User } from './models/User';

dotenv.config();

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    
    await User.deleteMany({});

   
    const passwordHash = await bcrypt.hash('password123', 10);

    
    const user = await User.create({
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: passwordHash,
      isOnline: false,
      isDeleted: false,
    });

    console.log('Seeded user:', user.email);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();