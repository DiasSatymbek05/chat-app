import { mergeTypeDefs } from '@graphql-tools/merge';

import { userTypeDefs } from './user/typeDefs';
import { chatTypeDefs } from './chat/typeDefs';
import { messageTypeDefs } from './message/typeDefs';
import { friendRequestTypeDefs } from './friendRequest/typeDefs';
import { subscriptionTypeDefs } from './subscription/typeDefs';

export const typeDefs = mergeTypeDefs([
  userTypeDefs,
  chatTypeDefs,
  messageTypeDefs,
  friendRequestTypeDefs,
  subscriptionTypeDefs,
]);