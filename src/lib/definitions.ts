import type { User as FirebaseUser } from 'firebase/auth';

export type Unit = {
  id: string;
  title: string;
  type: 'Sale' | 'Rent';
  category: 'Apartment' | 'Villa' | 'Office' | 'Land';
  description: string;
  price: number;
  city: string;
  governorate: string;
  photos: { id: string; url: string; hint: string }[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  clientName?: string;
  clientPhone?: string;
  fromBroker?: boolean;
  createdBy: string;
  createdByName: string;
  sharedWith?: string[];
  shareHistory?: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    at: string;
  }[];
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  createdBy: string;
  createdByName: string;
  sharedWith?: string[];
  shareHistory?: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    at: string;
  }[];
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  createdBy: string;
  createdByName: string;
};

export type Broker = {
  id: string;
  name: string;
  company: string;
  phone: string;
  createdBy: string;
  createdByName: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  role: 'user';
};

export type AdminUser = {
  id: string; // This is the uid from Firebase Auth
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'superadmin';
  tasks: string[];
  visible: boolean;
};

export type AppUser = (UserProfile | AdminUser) & { uid: string };

export type NormalUser = UserProfile;


export type ChatMessage = {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
};

export type Chat = {
  id: string;
  unitId: string;
  unitTitle: string;
  userId: string;
  userName: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  readByAdmin: boolean;
};
