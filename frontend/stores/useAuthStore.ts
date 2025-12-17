import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  username: string;
  email: string;
}

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  exp: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setUser: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  initialize: () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      set({
        token,
        user: {
          id: decoded.userId, 
          username: decoded.username,
          email: decoded.email,
        },
      });
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },
}));
