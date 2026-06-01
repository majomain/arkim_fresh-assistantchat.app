"use client";

import { createContext } from "react";

export type UserType = {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isTechnician: boolean;
  isActive: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es',
  defaultSite: string;
  assignedSites: string[];
};

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (route?: string) => Promise<void>;
  updateLang: (lang: UserType['language']) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { },
  logout: async () => { },
  refreshSession: async (route = undefined) => { },
  updateLang: () => { }
});
