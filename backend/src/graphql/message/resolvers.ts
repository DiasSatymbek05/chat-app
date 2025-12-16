import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { withFilter } from 'graphql-subscriptions';
import { Message } from '../../models/Message';
import { Chat } from '../../models/Chat';
import { pubsub, MESSAGE_SENT } from '../../utils/pubsub';
import { logger } from '../../utils/logger';

interface SendMessageInput {
  chatId: string;
  text: string;
  attachments?: string[];
}

export const messageResolvers = {
  Query: {
    getMessages: async (
      _: unknown,
      { chatId }: { chatId: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized access to getMessages');
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} fetching messages for chat ${chatId}`);

        const chat = await Chat.findOne({
          _id: chatId,
          members: userId,
          isDeleted: false,
        });

        if (!chat) {
          logger.warn(`Chat ${chatId} not found or access denied for user ${userId}`);
          throw new GraphQLError('Chat not found or access denied', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const messages = await Message.find({ chat: chatId })
          .populate('sender')
          .populate('readBy')
          .sort({ createdAt: 1 });

        logger.info(`Returned ${messages.length} messages for chat ${chatId} to user ${userId}`);
        return messages;
      } catch (error: any) {
        logger.error('Error in getMessages resolver', error);
        throw error;
      }
    },
  },

  Mutation: {
    sendMessage: async (
      _: unknown,
      { input }: { input: SendMessageInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to send message');
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const senderId = context.user.userId;
        logger.info(`User ${senderId} sending message to chat ${input.chatId}`);

        const chat = await Chat.findOne({
          _id: input.chatId,
          isDeleted: false,
        })
          .populate('creator')
          .populate('members');

        if (!chat) {
          logger.warn(`Chat ${input.chatId} not found or access denied for user ${senderId}`);
          throw new GraphQLError('Chat not found or access denied', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        if (chat.type === 'channel' && chat.creator._id.toString() !== senderId) {
          logger.warn(`User ${senderId} forbidden to send message to channel ${input.chatId}`);
          throw new GraphQLError('Only channel creator can send messages', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const isMember = chat.members.some((m: any) => m._id.toString() === senderId);
        if (!isMember) {
          logger.warn(`User ${senderId} forbidden to send message to chat ${input.chatId}`);
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
        }

        const message = await Message.create({
          text: input.text,
          sender: new Types.ObjectId(senderId),
          chat: new Types.ObjectId(input.chatId),
          readBy: [new Types.ObjectId(senderId)],
          attachments: input.attachments ?? [],
        });

        chat.lastMessage = message._id;
        await chat.save();

        const populatedMessage = await message.populate(['sender', 'readBy', 'chat']);
        logger.info(`Message ${message._id} sent by user ${senderId} to chat ${input.chatId}`);

        await pubsub.publish(MESSAGE_SENT, {
          messageSent: populatedMessage,
        });

        return populatedMessage;
      } catch (error: any) {
        logger.error('Error in sendMessage resolver', error);
        throw error;
      }
    },
  },

  Subscription: {
    messageSent: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MESSAGE_SENT]),
        (payload: any, variables: { chatId: string } | undefined, context: any) => {
          if (!context.user) return false;
          if (!variables?.chatId) return false;
          return payload.messageSent.chat._id.toString() === variables.chatId;
        }
      ),
    },
  },
};
