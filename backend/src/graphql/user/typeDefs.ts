import { gql } from 'apollo-server-express';

export const userTypeDefs = gql`
  type User {
    id: ID!
    username: String!
    firstName: String!
    lastName: String!
    dateOfBirth: String
    email: String!
    avatarUrl: String
    isOnline: Boolean!
    isDeleted: Boolean!
  }

  input RegisterInput {
    username: String!
    firstName: String!
    lastName: String!
    dateOfBirth: String
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]!
  }

  type Mutation {
    registerUser(input: RegisterInput!): AuthPayload!
    loginUser(input: LoginInput!): AuthPayload!
  }
`;
