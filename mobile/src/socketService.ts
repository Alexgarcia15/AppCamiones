/**
 * SOCKET SERVICE - Conexion unica y centralizada al servidor en tiempo real
 * Se autentica UNA sola vez cuando el usuario inicia sesion, no en cada pantalla.
 * Esto evita listeners duplicados cuando el dueno navega entre varios camiones.
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../context/AuthContext';

class SocketService {
  private socket: Socket | null = null;
  private autenticado = false;

  conectar(token: string) {
    if (this.socket && this.autenticado) {
      // Ya conectado y autenticado, no repetir
      return this.socket;
    }

    if (!this.socket) {
      this.socket = io(API_BASE_URL);
    }

    this.socket.emit('autenticar', token);

    this.socket.once('autenticado', (respuesta: { ok: boolean }) => {
      this.autenticado = respuesta.ok;
      console.log(respuesta.ok ? '🔑 Autenticado en el servidor' : '❌ Token rechazado');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  estaAutenticado(): boolean {
    return this.autenticado;
  }

  desconectar() {
    this.socket?.disconnect();
    this.socket = null;
    this.autenticado = false;
  }
}

export const socketService = new SocketService();