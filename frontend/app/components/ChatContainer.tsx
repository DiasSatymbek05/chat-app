"use client";

import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { Chat } from "../types";

export default function ChatContainer() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <div className="flex w-full h-full">
      <ChatSidebar
        selectedChatId={selectedChat?.id || null}
        onSelect={setSelectedChat}
      />

      <section className="flex-1 flex items-center justify-center">
        {selectedChat ? (
          <ChatWindow key={selectedChat.id} chat={selectedChat} />
        ) : (
          <p className="text-gray-400 text-lg">
            Выберите канал, чтобы увидеть сообщения
          </p>
        )}
      </section>
    </div>
  );
}
