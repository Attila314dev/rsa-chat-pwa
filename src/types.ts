export type Role = "owner" | "admin" | "member" | "guest";

export interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  ownerId: string;
  members: Record<string, Role>; // userId -> role
}

export interface Message {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  sentAt: string; // ISO
}
