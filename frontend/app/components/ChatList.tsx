"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useAuthStore } from "../../stores/useAuthStore";
import { Chat } from "../types";

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
}

const GET_CHATS_FOR_USER = gql`
  query GetChatsForUser($userId: ID!) {
    getChatsForUser(userId: $userId) {
      id
      title
      type
      members {
        id
        username
      }
    }
  }
`;

export default function ChatList({ onSelectChat }: ChatListProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { data, loading } = useQuery<{ getChatsForUser: Chat[] }>(GET_CHATS_FOR_USER, {
    variables: { userId: currentUser?.id },
    skip: !currentUser,
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (!currentUser || loading) {
    return <div className="p-4 text-slate-600">Загрузка чатов...</div>;
  }

  const chats = data?.getChatsForUser || [];

  return (
    <aside className="w-72 bg-slate-100 border-r border-slate-300 p-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Чаты</h2>

      <div className="space-y-3">
        {chats.map((chat) => {
          const otherMember = chat.members.find((m) => m.id !== currentUser.id);
          const title =
            chat.title ||
            (chat.type === "private" ? otherMember?.username : undefined) ||
            "Без названия";

          return (
            <div
              key={chat.id}
              onClick={() => {
                setSelectedChatId(chat.id);
                onSelectChat(chat); 
              }}
              className={`flex items-center gap-3 bg-white border border-slate-300 rounded-xl p-3 shadow-sm cursor-pointer ${
                selectedChatId === chat.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                {title[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-600">
                  {chat.members.length} {chat.members.length === 1 ? "участник" : "участника"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
