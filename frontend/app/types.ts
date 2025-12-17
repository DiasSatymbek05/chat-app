export interface Chat {
  id: string;
  title?: string;
  type: "group" | "private" | "channel";
  creatorId: string;
  members: { id: string; username: string }[];
  lastMessage?: { id: string; text: string; createdAt: string; sender: { id: string; username: string } };
  updatedAt: string;
}
export interface Message {
  id: string;
  text: string;
  sender: { id: string; username: string };
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
}

