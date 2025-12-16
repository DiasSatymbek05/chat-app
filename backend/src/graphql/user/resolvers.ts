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
      return User.findOne({
        _id: id,
        isDeleted: false,
      }).select('-password');
    },

    getUsers: async () => {
      return User.find({ isDeleted: false }).select('-password');
    },
  },

  Mutation: {
    registerUser: async (
      _: unknown,
      { input }: { input: RegisterInput }
    ) => {
      const existingUser = await User.findOne({
        $or: [{ email: input.email }, { username: input.username }],
      });

      if (existingUser) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await User.create({
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth
          ? new Date(input.dateOfBirth)
          : undefined,
        email: input.email,
        password: hashedPassword,
        isOnline: false,
        isDeleted: false,
      });

      const token = generateToken(user);

      return {
        token,
        user: {
          ...user.toObject(),
          password: undefined,
        },
      };
    },

    loginUser: async (
      _: unknown,
      { input }: { input: LoginInput }
    ) => {
      const user = await User.findOne({
        email: input.email,
        isDeleted: false,
      });

      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const isValidPassword = await bcrypt.compare(
        input.password,
        user.password
      );

      if (!isValidPassword) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      user.isOnline = true;
      await user.save();

      const token = generateToken(user);

      return {
        token,
        user: {
          ...user.toObject(),
          password: undefined,
        },
      };
    },
  },
};
