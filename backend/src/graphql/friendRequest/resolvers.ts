import { FriendRequest } from '../../models/FriendRequest';
import { User } from '../../models/User';
import { Chat } from '../../models/Chat';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';

interface FriendRequestInput {
  recipientId: string;
  message?: string;
}

export const friendRequestResolvers = {
  Query: {
    getFriendRequests: async (_: unknown, __: unknown, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const userId = context.user.userId;

      return FriendRequest.find({
        recipient: userId,
        isDeleted: false,
      })
        .populate('requester')
        .populate('recipient');
    },
  },

  Mutation: {
    sendFriendRequest: async (
      _: unknown,
      { input }: { input: FriendRequestInput },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const requesterId = context.user.userId;
      const recipientId = input.recipientId;

      if (requesterId === recipientId) {
        throw new GraphQLError('Cannot send friend request to yourself', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const recipientExists = await User.findOne({
        _id: recipientId,
        isDeleted: false,
      });

      if (!recipientExists) {
        throw new GraphQLError('Recipient not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const existingRequest = await FriendRequest.findOne({
        requester: requesterId,
        recipient: recipientId,
        isDeleted: false,
        status: 'pending',
      });

      if (existingRequest) {
        throw new GraphQLError('Friend request already sent', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const friendRequest = await FriendRequest.create({
        requester: new Types.ObjectId(requesterId),
        recipient: new Types.ObjectId(recipientId),
        message: input.message, 
        status: 'pending',
      });

      return friendRequest.populate('requester recipient');
    },

    respondFriendRequest: async (
      _: unknown,
      { requestId, status }: { requestId: string; status: 'accepted' | 'rejected' },
      context: any
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        isDeleted: false,
      });

      if (!friendRequest) {
        throw new GraphQLError('Friend request not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

     
      if (friendRequest.recipient.toString() !== context.user.userId) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (friendRequest.status !== 'pending') {
        throw new GraphQLError('Friend request already processed', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      friendRequest.status = status;
      await friendRequest.save();

      if (status === 'accepted') {
        const requesterId = friendRequest.requester.toString();
        const recipientId = friendRequest.recipient.toString();

        const existingChat = await Chat.findOne({
          type: 'private',
          members: { $all: [requesterId, recipientId] },
          isDeleted: false,
        });

        if (!existingChat) {
          await Chat.create({
            type: 'private',
            isPrivate: true,
            members: [new Types.ObjectId(requesterId), new Types.ObjectId(recipientId)],
            isDeleted: false,
          });
        }
      }

      return friendRequest.populate('requester recipient');
    },
  },
};
