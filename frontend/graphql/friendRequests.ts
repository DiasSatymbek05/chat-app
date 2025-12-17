import { gql } from "@apollo/client";

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($input: FriendRequestInput!) {
    sendFriendRequest(input: $input) {
      id
      status
      requester {
        id
        username
      }
      recipient {
        id
        username
      }
    }
  }
`;
export const RESPOND_FRIEND_REQUEST = gql`
  mutation RespondFriendRequest(
    $requestId: ID!
    $status: FriendRequestStatus!
  ) {
    respondFriendRequest(requestId: $requestId, status: $status) {
      id
      status
    }
  }
`;
export const GET_FRIEND_REQUESTS = gql`
  query GetFriendRequests {
    getFriendRequests {
      id
      status
      message
      requester {
        id
        username
        email
      }
      createdAt
    }
  }
`;