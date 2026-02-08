'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { allAdmins, allNormalUsers } from '@/lib/data';
import type { AdminUser, NormalUser } from '@/lib/definitions';

type User = (Omit<AdminUser, 'password' | 'visible'> & { role: 'admin' | 'superadmin' }) | (Omit<NormalUser, 'password' | 'email'> & { role: 'user' });

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});


type AuthContextType = {
  user: User | null;
  login: (credentials: z.infer<typeof loginSchema>) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: z.infer<typeof registerSchema>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: z.infer<typeof loginSchema>) => {
    try {
      const { username, password } = loginSchema.parse(credentials);

      const adminUser = allAdmins.find(
        (admin) =>
          admin.username === username && admin.password === password && admin.visible
      );

      if (adminUser) {
        const userToStore = { id: adminUser.id, username: adminUser.username, role: adminUser.role, tasks: adminUser.tasks };
        setUser(userToStore as User);
        localStorage.setItem('user', JSON.stringify(userToStore));
        return { success: true };
      }

      const normalUser = allNormalUsers.find(
        (user) =>
          user.username === username && user.password === password
      );
      
      if (normalUser) {
        const userToStore = { id: normalUser.id, username: normalUser.username, role: normalUser.role };
        setUser(userToStore as User);
        localStorage.setItem('user', JSON.stringify(userToStore));
        return { success: true };
      }

      return { success: false, message: 'Invalid username or password.' };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, message: 'Invalid data provided.' };
      }
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const register = async (values: z.infer<typeof registerSchema>) => {
    try {
        const validatedValues = registerSchema.parse(values);
        
        const existingAdmin = allAdmins.find(u => u.username === validatedValues.username);
        const existingUser = allNormalUsers.find(u => u.username === validatedValues.username);

        if(existingAdmin || existingUser) {
            return { success: false, message: 'Username already exists.' };
        }
        
        const existingEmail = allNormalUsers.find(u => u.email === validatedValues.email);
        if(existingEmail) {
            return { success: false, message: 'Email is already in use.' };
        }

        const newUser: NormalUser = {
            id: new Date().toISOString(),
            role: 'user',
            ...validatedValues,
        };

        allNormalUsers.push(newUser);
        
        const userToStore = { id: newUser.id, username: newUser.username, role: newUser.role };
        setUser(userToStore as User);
        localStorage.setItem('user', JSON.stringify(userToStore));

        return { success: true };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided.' };
        }
        console.error(error);
        return { success: false, message: 'An unexpected error occurred during registration.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
