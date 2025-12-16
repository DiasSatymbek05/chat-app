import { logger } from '../../utils/logger';
import { User, IUser } from '../../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

interface RegisterInput {
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const generateToken = (user: IUser): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const userResolvers = {
  Query: {
    getUser: async (_: unknown, { id }: { id: string }) => {
      try {
        logger.info(`Fetching user with id: ${id}`);
        const user = await User.findOne({
          _id: id,
          isDeleted: false,
        }).select('-password');

        if (!user) {
          logger.warn(`User ${id} not found`);
          throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
        }

        logger.info(`User ${id} returned`);
        return user;
      } catch (error: any) {
        logger.error('Error in getUser resolver', error);
        throw error;
      }
    },

    getUsers: async () => {
      try {
        logger.info('Fetching all users');
        const users = await User.find({ isDeleted: false }).select('-password');
        logger.info(`Returned ${users.length} users`);
        return users;
      } catch (error: any) {
        logger.error('Error in getUsers resolver', error);
        throw error;
      }
    },
  },

  Mutation: {
    registerUser: async (_: unknown, { input }: { input: RegisterInput }) => {
      try {
        logger.info(`Register attempt for username: ${input.username}, email: ${input.email}`);
        const existingUser = await User.findOne({
          $or: [{ email: input.email }, { username: input.username }],
        });

        if (existingUser) {
          logger.warn(`Registration failed: user already exists for username/email: ${input.username}/${input.email}`);
          throw new GraphQLError('User already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user = await User.create({
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          email: input.email,
          password: hashedPassword,
          isOnline: false,
          isDeleted: false,
        });

        const token = generateToken(user);
        logger.info(`User registered successfully: ${user._id}`);

        return {
          token,
          user: {
            ...user.toObject(),
            password: undefined,
          },
        };
      } catch (error: any) {
        logger.error('Error in registerUser resolver', error);
        throw error;
      }
    },

    loginUser: async (_: unknown, { input }: { input: LoginInput }) => {
      try {
        logger.info(`Login attempt for email: ${input.email}`);
        const user = await User.findOne({
          email: input.email,
          isDeleted: false,
        });

        if (!user) {
          logger.warn(`Login failed: invalid credentials for email: ${input.email}`);
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          logger.warn(`Login failed: invalid credentials for user ${user._id}`);
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        user.isOnline = true;
        await user.save();

        const token = generateToken(user);
        logger.info(`User logged in successfully: ${user._id}`);
        return {
          token,
          user: {
            ...user.toObject(),
            password: undefined,
          },
        };
      } catch (error: any) {
        logger.error('Error in loginUser resolver', error);
        throw error;
      }
    },
  },
};
