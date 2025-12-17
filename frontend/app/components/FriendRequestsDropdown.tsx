"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_FRIEND_REQUESTS,
  RESPOND_FRIEND_REQUEST,
} from "../../graphql/friendRequests";



interface FriendRequest {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
  requester: {
    id: string;
    username: string;
    email: string;
  };
}



export default function FriendRequests() {
  const { data, loading, error } = useQuery<{
    getFriendRequests: FriendRequest[];
  }>(GET_FRIEND_REQUESTS);

  const [respondFriendRequest, { loading: responding }] = useMutation(
    RESPOND_FRIEND_REQUEST,
    {
     refetchQueries: [{ query: GET_FRIEND_REQUESTS }]

    }
  );

  if (loading) {
    return (
      <div className="p-3 text-sm text-gray-400">
        Загрузка заявок...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-sm text-red-500">
        Ошибка загрузки заявок
      </div>
    );
  }

 const requests =
  data?.getFriendRequests.filter(
    (r) => r.status === "pending"
  ) ?? [];


  if (requests.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-400">
        Нет новых заявок
      </div>
    );
  }

  const handleRespond = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    await respondFriendRequest({
      variables: {
        requestId,
        status,
      },
    });
  };

  return (
    <div className="absolute right-0 mt-3 w-80 bg-white border rounded-lg shadow-xl z-50">
      <div className="p-3 border-b font-semibold text-sm">
        Заявки в друзья
      </div>

      <div className="max-h-96 overflow-y-auto">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
          >
            {/* INFO */}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-gray-900">
                {req.requester.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {req.requester.email}
              </p>
              {req.message && (
                <p className="text-xs text-gray-600 mt-1 italic truncate">
                  “{req.message}”
                </p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 shrink-0">
              <button
                disabled={responding}
                onClick={() =>
                  handleRespond(req.id, "accepted")
                }
                className="w-7 h-7 rounded-full bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                ✓
              </button>

              <button
                disabled={responding}
                onClick={() =>
                  handleRespond(req.id, "rejected")
                }
                className="w-7 h-7 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
