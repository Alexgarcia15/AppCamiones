import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Camion, filtrarCamionesPorOwnerId, obtenerCamionesPorPagina } from "../utils/routeAlertUtils";

export interface User {
  id: string;
  ownerId: string;
  username: string;
  password: string;
  name: string;
}

interface AuthContextData {
  user: User | null;
  trucks: Camion[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getPage: (page: number, size?: number) => Camion[];
}

const usuariosPrueba: User[] = [
  {
    id: "u1",
    ownerId: "owner-1",
    username: "juan",
    password: "1234",
    name: "Juan Pérez",
  },
  {
    id: "u2",
    ownerId: "owner-2",
    username: "ana",
    password: "abcd",
    name: "Ana Martínez",
  },
  {
    id: "u3",
    ownerId: "owner-3",
    username: "mario",
    password: "pass",
    name: "Mario López",
  },
];

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const trucks = useMemo(() => {
    if (!user) return [];
    return filtrarCamionesPorOwnerId(user.ownerId);
  }, [user]);

  const login = async (username: string, password: string) => {
    const normalized = username.trim().toLowerCase();
    const found = usuariosPrueba.find(
      (account) => account.username === normalized && account.password === password
    );
    if (!found) return false;
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  const getPage = (page: number, size = 3) => {
    if (!user) return [];
    return obtenerCamionesPorPagina(user.ownerId, page, size);
  };

  return (
    <AuthContext.Provider value={{ user, trucks, login, logout, getPage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
