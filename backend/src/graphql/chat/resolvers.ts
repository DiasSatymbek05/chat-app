import { Chat } from '../../models/Chat';
import { User } from '../../models/User';
import { FriendRequest } from '../../models/FriendRequest';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { logger } from '../../utils/logger'; 

interface CreateChatInput {
  title?: string;
  isPrivate: boolean;
  members: string[];
  type: 'group' | 'private' | 'channel';
}

export const chatResolvers = {
  Query: {
    getChat: async (_: unknown, { id }: { id: string }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized access to getChat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        logger.info(`User ${context.user.userId} fetching chat ${id}`);
        const chat = await Chat.findOne({ _id: id, isDeleted: false })
          .populate('members')
          .populate('lastMessage')
          .populate('creator');

        if (!chat) {
          logger.warn(`Chat ${id} not found`);
          throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
        }

        const isMember = chat.members.some((m: any) => m._id.toString() === context.user.userId);
        if (!isMember) {
          logger.warn(`User ${context.user.userId} forbidden from accessing chat ${id}`);
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
        }

        logger.info(`Chat ${id} returned to user ${context.user.userId}`);
        return chat;
      } catch (error: any) {
        logger.error('Error in getChat resolver', error);
        throw error;
      }
    },

    getChatsForUser: async (_: unknown, { userId }: { userId: string }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized access to getChatsForUser');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        if (context.user.userId !== userId) {
          logger.warn(`User ${context.user.userId} forbidden from accessing chats of ${userId}`);
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
        }

        logger.info(`Fetching chats for user ${userId}`);
        const chats = await Chat.find({ members: userId, isDeleted: false })
          .populate('members')
          .populate('lastMessage')
          .populate('creator')
          .sort({ updatedAt: -1 });

        logger.info(`Returned ${chats.length} chats for user ${userId}`);
        return chats;
      } catch (error: any) {
        logger.error('Error in getChatsForUser resolver', error);
        throw error;
      }
    },
  },

  Mutation: {
    createChat: async (_: unknown, { input }: { input: CreateChatInput }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to create chat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        const creatorId = context.user.userId;
        const uniqueMembers = Array.from(new Set([...input.members, creatorId]));
        logger.info(`User ${creatorId} creating chat with members: ${uniqueMembers.join(', ')}`);

        const usersCount = await User.countDocuments({ _id: { $in: uniqueMembers }, isDeleted: false });
        if (usersCount !== uniqueMembers.length) {
          logger.warn('One or more users not found for createChat');
          throw new GraphQLError('One or more users not found', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        if (input.type === 'private') {
          if (uniqueMembers.length !== 2) {
            logger.warn('Invalid number of members for private chat');
            throw new GraphQLError('Private chat must have exactly 2 members', { extensions: { code: 'BAD_USER_INPUT' } });
          }

          const [userA, userB] = uniqueMembers;
          const isFriends = await FriendRequest.findOne({
            $or: [
              { requester: userA, recipient: userB, status: 'accepted', isDeleted: false },
              { requester: userB, recipient: userA, status: 'accepted', isDeleted: false },
            ],
          });

          if (!isFriends) {
            logger.warn(`Users ${userA} and ${userB} are not friends, cannot create private chat`);
            throw new GraphQLError('You can only create private chat with friends', { extensions: { code: 'FORBIDDEN' } });
          }
        }

        const chat = await Chat.create({
          title: input.title,
          isPrivate: input.isPrivate,
          members: uniqueMembers.map(id => new Types.ObjectId(id)),
          type: input.type,
          isDeleted: false,
          creator: new Types.ObjectId(creatorId),
        });

        await chat.populate('members');
        await chat.populate('creator');

        logger.info(`Chat ${chat._id} created by user ${creatorId}`);
        return chat;
      } catch (error: any) {
        logger.error('Error in createChat resolver', error);
        throw error;
      }
    },

    joinChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to join chat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} attempting to join chat ${chatId}`);
        const chat = await Chat.findOne({ _id: chatId, isDeleted: false });

        if (!chat) {
          logger.warn(`Chat ${chatId} not found for join`);
          throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
        }

        if (chat.isPrivate) {
          logger.warn(`User ${userId} attempted to join private chat ${chatId}`);
          throw new GraphQLError('Cannot join private chat', { extensions: { code: 'FORBIDDEN' } });
        }

        const isAlreadyMember = chat.members.some((m: any) => m.toString() === userId);
        if (!isAlreadyMember) {
          chat.members.push(new Types.ObjectId(userId));
          await chat.save();
          logger.info(`User ${userId} joined chat ${chatId}`);
        } else {
          logger.info(`User ${userId} already a member of chat ${chatId}`);
        }

        await chat.populate('members');
        await chat.populate('creator');
        return chat;
      } catch (error: any) {
        logger.error('Error in joinChat resolver', error);
        throw error;
      }
    },

    deleteChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to delete chat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} attempting to delete chat ${chatId}`);

        const chat = await Chat.findOne({ _id: chatId, isDeleted: false });
        if (!chat) {
          logger.warn(`Chat ${chatId} not found for deletion`);
          throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
        }

        if (chat.creator.toString() !== userId) {
          logger.warn(`User ${userId} forbidden from deleting chat ${chatId}`);
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
        }

        chat.isDeleted = true;
        await chat.save();
        await chat.populate('members');
        await chat.populate('creator');

        logger.info(`Chat ${chatId} deleted by user ${userId}`);
        return chat;
      } catch (error: any) {
        logger.error('Error in deleteChat resolver', error);
        throw error;
      }
    },

    removeMemberFromChat: async (
      _: unknown,
      { chatId, memberId }: { chatId: string; memberId: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to remove member from chat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} attempting to remove member ${memberId} from chat ${chatId}`);

        const chat = await Chat.findOne({ _id: chatId, isDeleted: false });
        if (!chat) {
          logger.warn(`Chat ${chatId} not found for removing member`);
          throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
        }

        if (chat.creator.toString() !== userId) {
          logger.warn(`User ${userId} forbidden from removing members from chat ${chatId}`);
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
        }

        if (memberId === userId) {
          logger.warn(`Creator ${userId} cannot remove themselves from chat ${chatId}`);
          throw new GraphQLError('Creator cannot remove themselves', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        chat.members = chat.members.filter((m: any) => m.toString() !== memberId);
        await chat.save();
        await chat.populate('members');
        await chat.populate('creator');

        logger.info(`Member ${memberId} removed from chat ${chatId} by creator ${userId}`);
        return chat;
      } catch (error: any) {
        logger.error('Error in removeMemberFromChat resolver', error);
        throw error;
      }
    },

    leaveChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
      try {
        if (!context.user) {
          logger.warn('Unauthorized attempt to leave chat');
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
        }

        const userId = context.user.userId;
        logger.info(`User ${userId} attempting to leave chat ${chatId}`);

        const chat = await Chat.findOne({ _id: chatId, isDeleted: false });
        if (!chat) {
          logger.warn(`Chat ${chatId} not found for leave`);
          throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
        }

        chat.members = chat.members.filter((m: any) => m.toString() !== userId);
        await chat.save();
        await chat.populate('members');
        await chat.populate('creator');

        logger.info(`User ${userId} left chat ${chatId}`);
        return chat;
      } catch (error: any) {
        logger.error('Error in leaveChat resolver', error);
        throw error;
      }
    },
  },
};
