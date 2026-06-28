import React, { createContext, ReactNode, useContext, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camion, filtrarCamionesPorOwnerId, obtenerCamionesPorPagina } from "../utils/routeAlertUtils";

// Ahora el usuario solo necesita su código único de cliente (ownerId)
export interface User {
  ownerId: string;
  name: string;
}

// Lista de tus clientes autorizados en tu sistema
const clientesAutorizados: User[] = [
  { ownerId: "juan", name: "Juan Pérez (10 Camiones)" },
  { ownerId: "ana", name: "Ana Martínez (Flota Haina)" },
  { ownerId: "mario", name: "Mario López (Flota Santiago)" },
];

interface AuthContextData {
  user: User | null;
  trucks: Camion[];
  loading: boolean;
  loginWithCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getPage: (page: number, size?: number) => Camion[];
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Para saber si está leyendo la memoria al arrancar

  // Al abrir la app, revisa automáticamente si el celular ya tiene un dueño guardado
  useEffect(() => {
    async function cargarSesionGuardada() {
      try {
        const codigoGuardado = await AsyncStorage.getItem("@codigo_dueno");
        if (codigoGuardado) {
          const found = clientesAutorizados.find((c) => c.ownerId === codigoGuardado.trim().toLowerCase());
          if (found) {
            setUser(found);
          }
        }
      } catch (e) {
        console.log("Error leyendo la memoria interna", e);
      } finally {
        setLoading(false);
      }
    }
    cargarSesionGuardada();
  }, []);

  const trucks = useMemo(() => {
    if (!user) return [];
    // Filtra automáticamente solo los camiones que le pertenecen a este dueño
    return filtrarCamionesPorOwnerId(user.ownerId);
  }, [user]);

  // Esta función se ejecuta solo la primera vez que ingresan el código
  const loginWithCode = async (code: string) => {
    const normalized = code.trim().toLowerCase();
    const found = clientesAutorizados.find((c) => c.ownerId === normalized);
    
    if (!found) return false;

    // Guarda el código en el celular para que nunca más tenga que loguearse
    await AsyncStorage.setItem("@codigo_dueno", normalized);
    setUser(found);
    return true;
  };

  // Por si tú necesitas resetear la app de un cliente
  const logout = async () => {
    await AsyncStorage.removeItem("@codigo_dueno");
    setUser(null);
  };

  const getPage = (page: number, size = 3) => {
    if (!user) return [];
    return obtenerCamionesPorPagina(user.ownerId, page, size);
  };

  return (
    <AuthContext.Provider value={{ user, trucks, loading, loginWithCode, logout, getPage }}>
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
