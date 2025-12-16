import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { Subscription } from '../../models/Subscription';
import { Chat } from '../../models/Chat';
import { pubsub, MESSAGE_SENT } from '../../utils/pubsub';


interface SubscribeInput {
  channelId: string;
}

export const subscriptionResolvers = {
  Query: {
    getSubscriptions: async (
      _: unknown,
      { userId }: { userId: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      if (context.user.userId !== userId) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return Subscription.find({
        user: new Types.ObjectId(userId),
      })
        .populate('user')
        .populate('channel')
        .sort({ createdAt: -1 });
    },
  },

  Mutation: {
    subscribeToChannel: async (
      _: unknown,
      { input }: { input: SubscribeInput },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const userId = context.user.userId;
      const channelId = input.channelId;

      const chat = await Chat.findOne({
        _id: channelId,
        isDeleted: false,
      });

      if (!chat) {
        throw new GraphQLError('Chat not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Проверка, что пользователь состоит в чате
      const isMember = chat.members.some(
        (m: any) => m.toString() === userId
      );

      if (!isMember) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const existing = await Subscription.findOne({
        user: new Types.ObjectId(userId),
        channel: new Types.ObjectId(channelId),
      });

      if (existing) {
  await existing.populate('user');
  await existing.populate('channel');
  return existing;
}

const subscription = await Subscription.create({
  user: new Types.ObjectId(userId),
  channel: new Types.ObjectId(channelId),
  notificationsEnabled: true,
});

await subscription.populate('user');
await subscription.populate('channel');

return subscription;

    },

    unsubscribeFromChannel: async (
      _: unknown,
      { channelId }: { channelId: string },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const userId = context.user.userId;

      const result = await Subscription.findOneAndDelete({
        user: new Types.ObjectId(userId),
        channel: new Types.ObjectId(channelId),
      });

      return Boolean(result);
    },
  },
};
