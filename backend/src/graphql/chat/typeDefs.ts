import { gql } from 'apollo-server-express';

export const chatTypeDefs = gql`
  enum ChatType {
    group
    private
    channel
  }

  type Chat {
    id: ID!
    title: String
    isPrivate: Boolean!
    members: [User!]!
    lastMessage: Message
    type: ChatType!
    isDeleted: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input CreateChatInput {
    title: String
    isPrivate: Boolean!
    members: [ID!]!
    type: ChatType!
  }

  type Query {
    getChat(id: ID!): Chat
    getChatsForUser(userId: ID!): [Chat!]!
  }

  type Mutation {
    createChat(input: CreateChatInput!): Chat!
    joinChat(chatId: ID!, userId: ID!): Chat!
    leaveChat(chatId: ID!, userId: ID!): Chat!
  }
`;
