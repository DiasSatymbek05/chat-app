import { gql } from "@apollo/client";

export const GET_MY_CHATS = gql`
  query GetChatsForUser($userId: ID!) {
    getChatsForUser(userId: $userId) {
      id
      title
      type
      members {
        id
        username
      }
      lastMessage {
        id
        text
        createdAt
        sender {
          id
          username
        }
      }
      updatedAt
    }
  }
`;

export const CREATE_CHAT = gql`
  mutation CreateChat($input: CreateChatInput!) {
    createChat(input: $input) {
      id
      title
      type
      members { id username }
      lastMessage {
        id
        text
        sender { id username }
        createdAt
      }
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($chatId: ID!) {
    getMessages(chatId: $chatId) {
      id
      text
      sender { id username }
      createdAt
      chat { id title type }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      text
      sender { id username }
      createdAt
      chat { id title type }
    }
  }
`;

export const MESSAGE_SENT = gql`
  subscription MessageSent($chatId: ID!) {
    messageSent(chatId: $chatId) {
      id
      text
      sender { id username }
      createdAt
      chat { id title type }
    }
  }
`;

export const JOIN_CHAT = gql`
  mutation JoinChat($chatId: ID!) {
    joinChat(chatId: $chatId) {
      id
      title
      type
      members { id username }
      lastMessage {
        id
        text
        sender { id username }
        createdAt
      }
      updatedAt
    }
  }
`;