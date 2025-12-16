import { gql } from 'apollo-server-express';

export const friendRequestTypeDefs = gql`
  enum FriendRequestStatus {
    pending
    accepted
    rejected
  }

  type FriendRequest {
    id: ID!
    requester: User!
    recipient: User!
    status: FriendRequestStatus!
    message: String
    isDeleted: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input FriendRequestInput {
    recipientId: ID!
    message: String
  }

  type Query {
    getFriendRequests: [FriendRequest!]!
  }

  type Mutation {
    sendFriendRequest(input: FriendRequestInput!): FriendRequest!
    respondFriendRequest(requestId: ID!, status: FriendRequestStatus!): FriendRequest!
  }
`;
