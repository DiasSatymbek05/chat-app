import { userResolvers } from './user/resolvers';
import { chatResolvers } from './chat/resolvers';
import { messageResolvers } from './message/resolvers';
import { friendRequestResolvers } from './friendRequest/resolvers';
import { subscriptionResolvers } from './subscription/resolvers';

export const resolvers = [
  userResolvers,
  chatResolvers,
  messageResolvers,
  friendRequestResolvers,
  subscriptionResolvers,
];