"use client";

import { ReactNode } from "react";
import { useAuthStore } from "../stores/useAuthStore";

export default function HomePage({ children }: { children?: ReactNode }) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4">
        Welcome {user?.username ?? "to Chat App"}
      </h1>
      {children}
    </div>
  );
}
