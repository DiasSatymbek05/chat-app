"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MY_CHATS, CREATE_CHAT } from "../../graphql/chat";
import { Chat } from "../types";

interface GetChatsForUserData {
  getChatsForUser: Chat[];
}

interface CreateChatData {
  createChat: Chat;
}

interface CreateChatVars {
  input: {
    title: string;
    isPrivate: boolean;
    members: string[];
    type: "group" | "private" | "channel";
  };
}

interface Props {
  selectedChatId: string | null;
  onSelect: (chat: Chat) => void;
}

export default function ChatSidebar({ selectedChatId, onSelect }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data, loading, error, refetch } = useQuery<GetChatsForUserData>(GET_MY_CHATS);

  const [createChat] = useMutation<CreateChatData, CreateChatVars>(CREATE_CHAT);

  if (loading) return <p className="p-4 text-gray-800">Загрузка каналов...</p>;
  if (error) return <p className="p-4 text-red-700">Ошибка загрузки каналов</p>;

  const channels = data?.getChatsForUser.filter(c => c.type === "channel") || [];

  const handleCreateChannel = async () => {
    if (!newTitle.trim()) return;

    const result = await createChat({
      variables: {
        input: {
          title: newTitle,
          isPrivate: false,
          members: [],
          type: "channel",
        },
      },
    });

    const newChat = result.data?.createChat;
    if (newChat) {
      onSelect(newChat); // сразу выбираем новый канал
      refetch();
    }

    setNewTitle("");
    setShowModal(false);
  };

  return (
    <aside className="w-80 border-r p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-900">Каналы</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-blue-700 hover:text-blue-900 font-bold"
        >
          + Новый
        </button>
      </div>

      <ul className="space-y-2">
        {channels.length > 0 ? (
          channels.map(chat => {
            const isSelected = chat.id === selectedChatId;
            return (
              <li
                key={chat.id}
                onClick={() => onSelect(chat)}
                className={`p-2 rounded cursor-pointer ${
                  isSelected ? "bg-blue-100 font-semibold text-gray-900" : "hover:bg-gray-100 text-gray-900"
                }`}
              >
                <p className="truncate">{chat.title || chat.members.map(m => m.username).join(", ")}</p>
                {chat.lastMessage && (
                  <p className="text-xs text-gray-700 truncate">
                    {chat.lastMessage.sender.username}: {chat.lastMessage.text}
                  </p>
                )}
              </li>
            );
          })
        ) : (
          <li className="text-gray-500 text-sm">Нет доступных каналов</li>
        )}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3 text-gray-900">Создать канал</h3>
            <input
              type="text"
              placeholder="Название канала"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-4 text-gray-900"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 border rounded text-gray-900"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateChannel}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
