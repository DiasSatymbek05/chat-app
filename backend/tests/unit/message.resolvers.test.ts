import { messageResolvers } from '../../src/graphql/message/resolvers';
import { Message } from '../../src/models/Message';
import { Chat } from '../../src/models/Chat';
import { pubsub, MESSAGE_SENT } from '../../src/utils/pubsub';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';

jest.mock('../../src/models/Message');
jest.mock('../../src/models/Chat');
jest.mock('../../src/utils/pubsub', () => ({
  MESSAGE_SENT: 'MESSAGE_SENT',
  pubsub: {
    publish: jest.fn(),
    asyncIterator: jest.fn(),
  },
}));
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const userId = '64f000000000000000000001';
const chatId = '64f000000000000000000010';

const mockChat = {
  _id: chatId,
  type: 'group',
  members: [{ _id: new Types.ObjectId(userId) }],
  creator: { _id: new Types.ObjectId(userId) },
  save: jest.fn(),
};

const mockMessage = {
  _id: 'msg-id',
  text: 'hello',
  chat: { _id: chatId },
  populate: jest.fn().mockResolvedValue({
    _id: 'msg-id',
    text: 'hello',
    chat: { _id: chatId },
  }),
};

describe('messageResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.getMessages', () => {
    it('throws UNAUTHORIZED if no user', async () => {
      await expect(
        messageResolvers.Query.getMessages({}, { chatId }, {})
      ).rejects.toThrow(GraphQLError);
    });

    it('throws FORBIDDEN if chat not found', async () => {
      (Chat.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        messageResolvers.Query.getMessages(
          {},
          { chatId },
          { user: { userId } }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('returns messages successfully', async () => {
      (Chat.findOne as jest.Mock).mockResolvedValue(mockChat);

      const queryMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockMessage]),
      };

      (Message.find as jest.Mock).mockReturnValue(queryMock);

      const result = await messageResolvers.Query.getMessages(
        {},
        { chatId },
        { user: { userId } }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('Mutation.sendMessage', () => {
  let populateChain: any;

  beforeEach(() => {
    populateChain = {
      populate: jest.fn(),
    };
  });

  it('throws FORBIDDEN if user not member', async () => {
    (Chat.findOne as jest.Mock).mockReturnValue(populateChain);

    populateChain.populate
      .mockReturnValueOnce(populateChain) 
      .mockReturnValueOnce({
        ...mockChat,
        members: [{ _id: new Types.ObjectId('64f000000000000000000999') }],
      });

    await expect(
      messageResolvers.Mutation.sendMessage(
        {},
        { input: { chatId, text: 'hi' } },
        { user: { userId } }
      )
    ).rejects.toThrow(GraphQLError);
  });

  it('throws FORBIDDEN if channel and not creator', async () => {
    (Chat.findOne as jest.Mock).mockReturnValue(populateChain);

    populateChain.populate
      .mockReturnValueOnce(populateChain)
      .mockReturnValueOnce({
        ...mockChat,
        type: 'channel',
        creator: { _id: new Types.ObjectId('64f000000000000000000999') },
      });

    await expect(
      messageResolvers.Mutation.sendMessage(
        {},
        { input: { chatId, text: 'hi' } },
        { user: { userId } }
      )
    ).rejects.toThrow(GraphQLError);
  });

  it('sends message successfully', async () => {
    (Chat.findOne as jest.Mock).mockReturnValue(populateChain);

    populateChain.populate
      .mockReturnValueOnce(populateChain)
      .mockReturnValueOnce(mockChat);

    (Message.create as jest.Mock).mockResolvedValue(mockMessage);

    const result = await messageResolvers.Mutation.sendMessage(
      {},
      { input: { chatId, text: 'hello' } },
      { user: { userId } }
    );

    expect(Message.create).toHaveBeenCalled();
    expect(pubsub.publish).toHaveBeenCalled();
    expect(result.text).toBe('hello');
  });
});
});