import { userResolvers } from '../../src/graphql/user/resolvers';
import { User } from '../../src/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

jest.mock('../../src/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedUser = {
  _id: 'user-id',
  username: 'testuser',
  email: 'test@test.com',
  password: 'hashed-password',
  isDeleted: false,
  isOnline: false,
  save: jest.fn(),
  toObject: jest.fn().mockReturnValue({
    _id: 'user-id',
    username: 'testuser',
    email: 'test@test.com',
  }),
};

describe('userResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('Query.getUser', () => {
    it('returns user when found', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockedUser),
      });

      const result = await userResolvers.Query.getUser({}, { id: 'user-id' });

      expect(result).toBe(mockedUser);
    });

    it('throws NOT_FOUND when user does not exist', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        userResolvers.Query.getUser({}, { id: 'bad-id' })
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.registerUser', () => {
    it('registers new user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue(mockedUser);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await userResolvers.Mutation.registerUser({}, {
        input: {
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'password',
        },
      });

      expect(result.token).toBe('jwt-token');
      expect(result.user.username).toBe('testuser');
    });

    it('throws error if user already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockedUser);

      await expect(
        userResolvers.Mutation.registerUser({}, {
          input: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: 'password',
          },
        })
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.loginUser', () => {
    it('logs in user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await userResolvers.Mutation.loginUser({}, {
        input: {
          email: 'test@test.com',
          password: 'password',
        },
      });

      expect(result.token).toBe('jwt-token');
      expect(mockedUser.save).toHaveBeenCalled();
    });

    it('throws error on invalid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        userResolvers.Mutation.loginUser({}, {
          input: {
            email: 'bad@test.com',
            password: 'password',
          },
        })
      ).rejects.toThrow(GraphQLError);
    });
  });
});