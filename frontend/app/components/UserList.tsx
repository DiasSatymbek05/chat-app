"use client";

import { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import type { Reference } from "@apollo/client";
import { useAuthStore } from "../../stores/useAuthStore";

/* ===================== TYPES ===================== */

interface User {
  id: string;
  username: string;
  email: string;
  isOnline: boolean;
}

interface GQLUserRef {
  id: string;
  __typename?: "User";
}

interface FriendRequest {
  id: string;
  status: "pending" | "accepted" | "rejected";
  requester: GQLUserRef;
  recipient: GQLUserRef;
  __typename?: "FriendRequest";
}


interface SendFriendRequestResponse {
  sendFriendRequest: FriendRequest;
}



const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      username
      email
      isOnline
    }
  }
`;

const GET_FRIEND_REQUESTS = gql`
  query GetFriendRequests {
    getFriendRequests {
      id
      status
      requester { id }
      recipient { id }
    }
  }
`;

const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($input: FriendRequestInput!) {
    sendFriendRequest(input: $input) {
      id
      status
      requester { id }
      recipient { id }
      __typename
    }
  }
`;

const FRIEND_REQUEST_FRAGMENT = gql`
  fragment FriendRequestFragment on FriendRequest {
    id
    status
    requester { id __typename }
    recipient { id __typename }
    __typename
  }
`;



export default function UserList() {
  const currentUser = useAuthStore((s) => s.user);

  const { data: usersData, loading: usersLoading } =
    useQuery<{ getUsers: User[] }>(GET_USERS);

  const { data: requestsData } =
    useQuery<{ getFriendRequests: FriendRequest[] }>(GET_FRIEND_REQUESTS);

  const [sendFriendRequest] =
    useMutation<SendFriendRequestResponse>(SEND_FRIEND_REQUEST);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");



  const { sentRequestIds, friendsIds } = useMemo(() => {
    const sent = new Set<string>();
    const friends = new Set<string>();

    requestsData?.getFriendRequests?.forEach((r) => {
      if (
        r.status === "pending" &&
        r.requester.id === currentUser?.id
      ) {
        sent.add(r.recipient.id);
      }

      if (r.status === "accepted") {
        if (r.requester.id === currentUser?.id) {
          friends.add(r.recipient.id);
        }
        if (r.recipient.id === currentUser?.id) {
          friends.add(r.requester.id);
        }
      }
    });

    return { sentRequestIds: sent, friendsIds: friends };
  }, [requestsData, currentUser?.id]);

  const users = usersData?.getUsers.filter(
    (u) => u.id !== currentUser?.id
  );


  const handleSend = async () => {
    if (!selectedUser || !currentUser) return;

    await sendFriendRequest({
      variables: {
        input: {
          recipientId: selectedUser.id,
          message,
        },
      },

      optimisticResponse: {
        sendFriendRequest: {
          id: "temp-id",
          status: "pending",
          requester: {
            id: currentUser.id,
            __typename: "User",
          },
          recipient: {
            id: selectedUser.id,
            __typename: "User",
          },
          __typename: "FriendRequest",
        },
      },

      update(cache, { data }) {
        const fr = data?.sendFriendRequest;
        if (!fr) return;

 
        const fixedFr = {
          ...fr,
          __typename: "FriendRequest",
          requester: {
            ...fr.requester,
            __typename: "User",
          },
          recipient: {
            ...fr.recipient,
            __typename: "User",
          },
        };

        const newRef = cache.writeFragment({
          fragment: FRIEND_REQUEST_FRAGMENT,
          data: fixedFr,
        });

        cache.modify({
          fields: {
            getFriendRequests(
              existingRefs: ReadonlyArray<Reference> = [],
              { readField }
            ) {
              const exists = existingRefs.some(
                (ref) => readField("id", ref) === fixedFr.id
              );

              if (exists) return existingRefs;
              return [...existingRefs, newRef as Reference];
            },
          },
        });
      },
    });

    setSelectedUser(null);
    setMessage("");
  };



  if (!currentUser || usersLoading) {
    return <div className="p-4 text-slate-600">Загрузка...</div>;
  }

 

  return (
    <>
      <aside className="w-72 bg-slate-100 border-r border-slate-300 p-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Пользователи
        </h2>

        <div className="space-y-3">
          {users?.map((user) => {
            const isSent = sentRequestIds.has(user.id);
            const isFriend = friendsIds.has(user.id);

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl p-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                  {user.username[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {user.username}
                  </p>
                  <p className="text-xs text-slate-600">
                    {user.email}
                  </p>
                </div>

                {isFriend ? (
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Вы друзья
                  </span>
                ) : isSent ? (
                  <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Ожидает
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-bold mb-2">
              Заявка в друзья
            </h3>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Привет! Давай общаться 👋"
              rows={3}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-3 py-1 border rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleSend}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
