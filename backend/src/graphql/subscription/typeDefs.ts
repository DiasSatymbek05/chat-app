import { gql } from 'apollo-server-express';

export const subscriptionTypeDefs = gql`
  type SubscriptionEntity {
    id: ID!
    user: User!
    channel: Chat!
    notificationsEnabled: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input SubscribeInput {
    channelId: ID!
  }

  type Query {
    getSubscriptions(userId: ID!): [SubscriptionEntity!]!
  }

  type Mutation {
    subscribeToChannel(input: SubscribeInput!): SubscriptionEntity!
    unsubscribeFromChannel(channelId: ID!): Boolean!
  }
`;
