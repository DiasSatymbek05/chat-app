"use client";

import { ReactNode, useEffect, useState } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "../../lib/apollo";
import { useAuthStore } from "../../stores/useAuthStore";
import FriendRequests from "../components/FriendRequestsDropdown";

interface LayoutProps {
  children: ReactNode;
  showChats: boolean; 
  setShowChats?: React.Dispatch<React.SetStateAction<boolean>>; 
}

export default function AppLayout({ children, showChats, setShowChats }: LayoutProps) {
  const { user, logout, initialize } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [openRequests, setOpenRequests] = useState(false);

  useEffect(() => {
    initialize();
    setIsReady(true);
  }, [initialize]);

  return (
    <ApolloProvider client={apolloClient}>
      <div className="flex flex-col min-h-screen bg-white font-sans">
        {/* HEADER */}
        <header className="relative bg-black text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChatApp</h1>

          {isReady && user ? (
            <div className="flex items-center gap-4 relative">
              {/* 🔔 Заявки в друзья */}
              <div className="relative">
                <button
                  onClick={() => setOpenRequests((v) => !v)}
                  className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition shadow"
                >
                  Заявки
                </button>
                {openRequests && <FriendRequests />}
              </div>

              {/* Кнопка переключения списков */}
              <button
                onClick={() => setShowChats && setShowChats(prev => !prev)}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition shadow"
              >
                {showChats ? "Список пользователей" : "Список чатов"}
              </button>

              {/* AVATAR */}
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <span className="font-medium">{user.username}</span>

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 transition-colors text-white px-3 py-1 rounded shadow"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <a
                href="/login"
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition text-white shadow"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 transition text-white shadow"
              >
                Register
              </a>
            </div>
          )}
        </header>

        {/* CONTENT */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </ApolloProvider>
  );
}
