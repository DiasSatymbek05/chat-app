"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, User } from "../stores/useAuthStore";
import { gql } from "@apollo/client"; import { useQuery } from "@apollo/client/react"; import { jwtDecode } from "jwt-decode";

const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      email
      avatarUrl
    }
  }
`;

interface TokenPayload {
  userId: string;
  username?: string;
  exp: number;
}

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();

  const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let userId: string | null = null;
  if (savedToken) {
    try {
      const payload = jwtDecode<TokenPayload>(savedToken);
      userId = payload.userId;
      if (payload.username && !user) {
        
        setUser({ id: userId, username: payload.username, email: "", avatarUrl: "" }, savedToken);
      }
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  const { data, loading, error } = useQuery<{ getUser: User }>(GET_USER_QUERY, {
    variables: { id: userId! },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.getUser) {
      setUser(data.getUser, savedToken!);
    }
    if (!savedToken || error) {
      logout();
      router.push("/login");
    }
  }, [data, error, savedToken, setUser, logout, router]);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}