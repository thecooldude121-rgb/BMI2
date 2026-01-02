import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'HR' | 'Manager';
  avatar?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Admin',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    department: 'Sales'
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    if (email && password) {
      setUser({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'John Smith',
        email,
        role: 'Admin',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        department: 'Sales'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);

    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe !== 'true') {
      localStorage.removeItem('userEmail');
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionData');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const rolePermissions = {
      Admin: ['all'],
      Manager: ['crm', 'hrms', 'analytics', 'lead-generation', 'integrations', 'calendar', 'settings', 'gamification', 'dashboard', 'team'],
      Sales: ['crm', 'lead-generation', 'calendar', 'integrations', 'dashboard', 'team'],
      HR: ['hrms', 'analytics', 'dashboard']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};