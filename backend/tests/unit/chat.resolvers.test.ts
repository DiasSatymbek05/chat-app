import { chatResolvers } from '../../src/graphql/chat/resolvers';
import { Chat } from '../../src/models/Chat';
import { User } from '../../src/models/User';
import { FriendRequest } from '../../src/models/FriendRequest';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';

jest.mock('../../src/models/Chat');
jest.mock('../../src/models/User');
jest.mock('../../src/models/FriendRequest');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const userId = '64f000000000000000000001';

const mockChat = {
  _id: 'chat-id',
  members: [{ _id: new Types.ObjectId(userId) }],
  creator: new Types.ObjectId(userId),
  isPrivate: false,
  isDeleted: false,
  save: jest.fn(),
};

describe('chatResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.getChat', () => {
    it('returns chat if user is a member', async () => {
      const queryMock = {
        populate: jest.fn().mockReturnThis(),
      };

      
      queryMock.populate.mockReturnValueOnce(queryMock);
      queryMock.populate.mockReturnValueOnce(queryMock);
      queryMock.populate.mockResolvedValueOnce(mockChat);

      (Chat.findOne as jest.Mock).mockReturnValue(queryMock);

      const result = await chatResolvers.Query.getChat(
        {},
        { id: 'chat-id' },
        { user: { userId } }
      );

      expect(result).toBe(mockChat);
    });

    it('throws FORBIDDEN if user is not a member', async () => {
      const notMemberChat = {
        ...mockChat,
        members: [{ _id: new Types.ObjectId('64f000000000000000000999') }],
      };

      const queryMock = {
        populate: jest.fn().mockReturnThis(),
      };

      queryMock.populate.mockReturnValueOnce(queryMock);
      queryMock.populate.mockReturnValueOnce(queryMock);
      queryMock.populate.mockResolvedValueOnce(notMemberChat);

      (Chat.findOne as jest.Mock).mockReturnValue(queryMock);

      await expect(
        chatResolvers.Query.getChat(
          {},
          { id: 'chat-id' },
          { user: { userId } }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.createChat', () => {
    it('throws UNAUTHORIZED if no user in context', async () => {
      await expect(
        chatResolvers.Mutation.createChat(
          {},
          {
            input: {
              title: 'Test chat',
              isPrivate: false,
              members: [],
              type: 'group',
            },
          },
          {}
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('creates group chat successfully', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(2);
      (Chat.create as jest.Mock).mockResolvedValue({
        ...mockChat,
        populate: jest.fn().mockResolvedValue(mockChat),
      });

      const result = await chatResolvers.Mutation.createChat(
        {},
        {
          input: {
            title: 'Group chat',
            isPrivate: false,
            members: ['64f000000000000000000002'],
            type: 'group',
          },
        },
        { user: { userId } }
      );

      expect(Chat.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});