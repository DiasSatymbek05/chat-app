import { FriendRequest } from '../../models/FriendRequest';
import { User } from '../../models/User';
import { Chat } from '../../models/Chat';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { logger } from '../../utils/logger';

interface FriendRequestInput {
  recipientId: string;
  message?: string;
}

export const friendRequestResolvers = {
  Query: {
    getFriendRequests: async (_: unknown, __: unknown, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized access to getFriendRequests');
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const userId = context.user.userId;
        logger.info(`Fetching friend requests for user ${userId}`);

        const requests = await FriendRequest.find({
          recipient: userId,
          isDeleted: false,
        }).populate('requester').populate('recipient');

        logger.info(`Returned ${requests.length} friend requests for user ${userId}`);
        return requests;
      } catch (error: any) {
        logger.error('Error in getFriendRequests resolver', error);
        throw error;
      }
    },
  },

  Mutation: {
    sendFriendRequest: async (
      _: unknown,
      { input }: { input: FriendRequestInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to send friend request');
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const requesterId = context.user.userId;
        const recipientId = input.recipientId;
        logger.info(`User ${requesterId} sending friend request to ${recipientId}`);

        if (requesterId === recipientId) {
          logger.warn(`User ${requesterId} attempted to send friend request to themselves`);
          throw new GraphQLError('Cannot send friend request to yourself', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const recipientExists = await User.findOne({
          _id: recipientId,
          isDeleted: false,
        });

        if (!recipientExists) {
          logger.warn(`Friend request failed: recipient ${recipientId} not found`);
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
          logger.warn(`Friend request already exists from ${requesterId} to ${recipientId}`);
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

        await friendRequest.populate('requester recipient');
        logger.info(`Friend request created from ${requesterId} to ${recipientId}`);
        return friendRequest;
      } catch (error: any) {
        logger.error('Error in sendFriendRequest resolver', error);
        throw error;
      }
    },

    respondFriendRequest: async (
      _: unknown,
      { requestId, status }: { requestId: string; status: 'accepted' | 'rejected' },
      context: any
    ) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to respond to friend request');
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} responding to friend request ${requestId} with status ${status}`);

        const friendRequest = await FriendRequest.findOne({
          _id: requestId,
          isDeleted: false,
        });

        if (!friendRequest) {
          logger.warn(`Friend request ${requestId} not found`);
          throw new GraphQLError('Friend request not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (friendRequest.recipient.toString() !== userId) {
          logger.warn(`User ${userId} forbidden from responding to friend request ${requestId}`);
          throw new GraphQLError('Forbidden', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        if (friendRequest.status !== 'pending') {
          logger.warn(`Friend request ${requestId} already processed`);
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
            logger.info(`Private chat created between ${requesterId} and ${recipientId}`);
          }
        }

        await friendRequest.populate('requester recipient');
        logger.info(`Friend request ${requestId} responded with status ${status} by user ${userId}`);
        return friendRequest;
      } catch (error: any) {
        logger.error('Error in respondFriendRequest resolver', error);
        throw error;
      }
    },
  },
};
