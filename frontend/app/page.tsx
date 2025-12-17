"use client";

import { useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import UserList from "./components/UserList";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import { Chat } from "./types";

export default function HomePage() {
  const [showChats, setShowChats] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <ProtectedRoute>
      <AppLayout showChats={showChats} setShowChats={setShowChats}>
        <div className="flex gap-6 h-full">
          {}
          {showChats ? (
            <ChatList onSelectChat={(chat) => setSelectedChat(chat)} />
          ) : (
            <UserList />
          )}

          {}
          {selectedChat ? (
            <ChatWindow chatId={selectedChat.id} />
          ) : (
            <main className="flex-1 bg-white p-6 rounded-lg shadow-md min-h-[calc(100vh-4rem)] flex items-center justify-center">
              <h1 className="text-4xl font-bold text-gray-800">
                Welcome to the App!
              </h1>
            </main>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
