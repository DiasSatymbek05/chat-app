import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { withFilter } from 'graphql-subscriptions';

import { Message } from '../../models/Message';
import { Chat } from '../../models/Chat';
import { pubsub, MESSAGE_SENT } from '../../utils/pubsub';

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
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const userId = context.user.userId;

      const chat = await Chat.findOne({
        _id: chatId,
        members: userId,
        isDeleted: false,
      });

      if (!chat) {
        throw new GraphQLError('Chat not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return Message.find({ chat: chatId })
        .populate('sender')
        .populate('readBy')
        .sort({ createdAt: 1 });
    },
  },

  Mutation: {
    sendMessage: async (
      _: unknown,
      { input }: { input: SendMessageInput },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const senderId = context.user.userId;

      const chat = await Chat.findOne({
        _id: input.chatId,
        isDeleted: false,
      })
        .populate('creator')
        .populate('members');

      if (!chat) {
        throw new GraphQLError('Chat not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      
      if (chat.type === 'channel' && chat.creator._id.toString() !== senderId) {
        throw new GraphQLError('Only channel creator can send messages', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

  
      const isMember = chat.members.some((m: any) => m._id.toString() === senderId);
      if (!isMember) {
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

      const populatedMessage = await message.populate([
        'sender',
        'readBy',
        'chat',
      ]);

   
      await pubsub.publish(MESSAGE_SENT, {
        messageSent: populatedMessage,
      });

      return populatedMessage;
    },
  },

  Subscription: {
    messageSent: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MESSAGE_SENT]),
        (
          payload: any,
          variables: { chatId: string } | undefined,
          context: any
        ) => {
          if (!context.user) return false;
          if (!variables?.chatId) return false;

          return payload.messageSent.chat._id.toString() === variables.chatId;
        }
      ),
    },
  },
};
