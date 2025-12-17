import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      username
      firstName
      lastName
      email
      avatarUrl
      isOnline
    }
  }
`;

export const GET_CHATS_FOR_USER = gql`
  query GetChatsForUser($userId: ID!) {
    getChatsForUser(userId: $userId) {
      id
      title
      type
      isPrivate
      members {
        id
        username
      }
      lastMessage {
        id
        text
        sender {
          id
          username
        }
        createdAt
      }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($chatId: ID!) {
    getMessages(chatId: $chatId) {
      id
      text
      sender {
        id
        username
      }
      createdAt
    }
  }
`;
