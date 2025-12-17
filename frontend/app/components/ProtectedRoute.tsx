"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/useAuthStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, initialize } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initialize();
    setIsReady(true);
  }, [initialize]);

 
  useEffect(() => {
    if (isReady && !token) {
      router.replace("/login");
    }
  }, [token, isReady, router]);


  if (!isReady || !token) return null;

  return <>{children}</>;
}
