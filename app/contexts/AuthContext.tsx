'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface Team {
  id: number;
  name: string;
  planName: string | null;
  subscriptionStatus: string | null;
  memberCount: number;
}

interface AuthContextType {
  user: User | null;
  team: Team | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTeam(data.team);
      } else {
        setUser(null);
        setTeam(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setTeam(null);
      window.location.href = '/signin';
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, team, loading, signOut, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}