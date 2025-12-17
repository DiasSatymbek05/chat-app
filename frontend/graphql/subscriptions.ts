import { gql } from '@apollo/client';

export const MESSAGE_SENT = gql`
  subscription MessageSent($chatId: ID!) {
    messageSent(chatId: $chatId) {
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
