import { Chat } from '../../models/Chat';
import { User } from '../../models/User';
import { FriendRequest } from '../../models/FriendRequest';
import { GraphQLError } from 'graphql';
import { Types } from 'mongoose';

interface CreateChatInput {
  title?: string;
  isPrivate: boolean;
  members: string[];
  type: 'group' | 'private' | 'channel';
}

export const chatResolvers = {
  Query: {
    getChat: async (_: unknown, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
      }

      const chat = await Chat.findOne({ _id: id, isDeleted: false })
        .populate('members')
        .populate('lastMessage')
        .populate('creator');

      if (!chat) {
        throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
      }

      const isMember = chat.members.some((m: any) => m._id.toString() === context.user.userId);
      if (!isMember) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }

      return chat;
    },

    getChatsForUser: async (_: unknown, { userId }: { userId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
      }

      if (context.user.userId !== userId) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }

      return Chat.find({ members: userId, isDeleted: false })
        .populate('members')
        .populate('lastMessage')
        .populate('creator')
        .sort({ updatedAt: -1 });
    },
  },

  Mutation: {
    createChat: async (_: unknown, { input }: { input: CreateChatInput }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
      }

      const creatorId = context.user.userId;
      const uniqueMembers = Array.from(new Set([...input.members, creatorId]));

      const usersCount = await User.countDocuments({ _id: { $in: uniqueMembers }, isDeleted: false });
      if (usersCount !== uniqueMembers.length) {
        throw new GraphQLError('One or more users not found', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (input.type === 'private') {
        if (uniqueMembers.length !== 2) {
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
      return chat;
    },

    joinChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
      }

      const userId = context.user.userId;
      const chat = await Chat.findOne({ _id: chatId, isDeleted: false });

      if (!chat) {
        throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
      }

      if (chat.isPrivate) {
        throw new GraphQLError('Cannot join private chat', { extensions: { code: 'FORBIDDEN' } });
      }

      const isAlreadyMember = chat.members.some((m: any) => m.toString() === userId);
      if (!isAlreadyMember) {
        chat.members.push(new Types.ObjectId(userId));
        await chat.save();
      }

      await chat.populate('members');
      await chat.populate('creator');
      return chat;
    },
    deleteChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
  }

  const userId = context.user.userId;

  const chat = await Chat.findOne({ _id: chatId, isDeleted: false });

  if (!chat) {
    throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
  }

  
  if (chat.creator.toString() !== userId) {
    throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
  }

  chat.isDeleted = true;
  await chat.save();

  await chat.populate('members');
  await chat.populate('creator');
  return chat;
},
    removeMemberFromChat: async (
  _: unknown,
  { chatId, memberId }: { chatId: string; memberId: string },
  context: any
) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
  }

  const userId = context.user.userId;
  const chat = await Chat.findOne({ _id: chatId, isDeleted: false });

  if (!chat) {
    throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
  }

 
  if (chat.creator.toString() !== userId) {
    throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
  }

 
  if (memberId === userId) {
    throw new GraphQLError('Creator cannot remove themselves', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  chat.members = chat.members.filter((m: any) => m.toString() !== memberId);
  await chat.save();

  await chat.populate('members');
  await chat.populate('creator');
  return chat;
},

    leaveChat: async (_: unknown, { chatId }: { chatId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHORIZED' } });
      }

      const userId = context.user.userId;
      const chat = await Chat.findOne({ _id: chatId, isDeleted: false });

      if (!chat) {
        throw new GraphQLError('Chat not found', { extensions: { code: 'NOT_FOUND' } });
      }

      chat.members = chat.members.filter((m: any) => m.toString() !== userId);
      await chat.save();

      await chat.populate('members');
      await chat.populate('creator');
      return chat;
    },
  },
};
