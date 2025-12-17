import { gql } from 'apollo-server-express';

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    text: String!
    sender: User
    chat: Chat!
    readBy: [User!]!
    attachments: [String]
    createdAt: String!
    updatedAt: String!
  }

  input SendMessageInput {
    chatId: ID!
    text: String!
    attachments: [String]
  }

  type Query {
    getMessages(chatId: ID!): [Message!]!
  }

  type Mutation {
    sendMessage(input: SendMessageInput!): Message!
  }
    type Subscription {
  messageSent(chatId: ID!): Message
}

`
;
