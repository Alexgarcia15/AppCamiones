/**
 * REMOTE SHUTDOWN SERVICE - Control remoto del vehiculo
 * Envia comandos de apagado de emergencia al servidor real (droplet)
 * El servidor reenvia el comando al dispositivo GPS fisico via socket TCP
 */

import { API_BASE_URL } from "../context/AuthContext";
import { RemoteCommandResponse } from "../types/truckTypes";

class RemoteShutdownService {
  /**
   * Enviar comando de apagado remoto de emergencia
   * Llama al endpoint real del backend (server.js -> /api/apagar-camion)
   */
  async executeRemoteShutdown(
    imei: string,
    truckFicha: string,
    token: string
  ): Promise<RemoteCommandResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apagar-camion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imei }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo enviar el comando de apagado");
      }

      return {
        success: true,
        commandId: `CMD-${Date.now()}`,
        commandType: "ENGINE_CUT",
        truckId: imei,
        executedAt: new Date(),
        statusCode: response.status,
        message: data.mensaje || `Comando enviado a ${truckFicha}`,
        estimatedExecutionTime: 8,
      };
    } catch (error: any) {
      console.error("Error ejecutando apagado remoto:", error);
      throw new Error(error.message || "No se pudo enviar comando de apagado remoto");
    }
  }
}

export const remoteShutdownService = new RemoteShutdownService();