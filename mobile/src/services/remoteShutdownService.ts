/**
 * REMOTE SHUTDOWN SERVICE - Control remoto del vehículo
 * Envía comandos de apagado de emergencia a dispositivo GPS físico vía API
 */

import { RemoteCommandResponse } from "../types/truckTypes";

class RemoteShutdownService {
  private apiBaseUrl = "https://api.gpstracker.example.com"; // URL ficticia
  private commandTimeout = 30000; // 30 segundos para confirmar ejecución

  /**
   * Enviar comando de apagado remoto de emergencia
   * Simula un corte de corriente en el dispositivo GPS del vehículo
   */
  async executeRemoteShutdown(
    truckId: string,
    truckFicha: string,
    userId: string
  ): Promise<RemoteCommandResponse> {
    try {
      // Simulación: En producción, esto sería un fetch real a la API del GPS
      const response = await this.simulateRemoteCommand(
        truckId,
        truckFicha,
        userId,
        "ENGINE_CUT"
      );

      return response;
    } catch (error) {
      console.error("Error ejecutando apagado remoto:", error);
      throw new Error("No se pudo enviar comando de apagado remoto");
    }
  }

  /**
   * Simulación de respuesta API - Reemplazar con fetch real en producción
   */
  private async simulateRemoteCommand(
    truckId: string,
    truckFicha: string,
    userId: string,
    commandType: "ENGINE_CUT" | "REMOTE_SHUTDOWN"
  ): Promise<RemoteCommandResponse> {
    return new Promise((resolve) => {
      // Simular latencia de red (2-5 segundos)
      const delay = Math.random() * 3000 + 2000;

      setTimeout(() => {
        resolve({
          success: true,
          commandId: `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          commandType,
          truckId,
          executedAt: new Date(),
          statusCode: 200,
          message: `Comando de apagado remoto enviado exitosamente a ${truckFicha}. Dispositivo GPS debe ejecutar en 5-10 segundos.`,
          estimatedExecutionTime: 8,
        });
      }, delay);
    });
  }

  /**
   * Enviar comando de geofencing (zona prohibida)
   */
  async setGeofenceAlert(
    truckId: string,
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<RemoteCommandResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          commandId: `GEO-${Date.now()}`,
          commandType: "GEOFENCE_ALERT",
          truckId,
          executedAt: new Date(),
          statusCode: 200,
          message: `Geofence configurado: ${latitude}, ${longitude} (radio: ${radiusMeters}m)`,
          estimatedExecutionTime: 3,
        });
      }, 1500);
    });
  }

  /**
   * Verificar estatus de comando enviado
   */
  async checkCommandStatus(commandId: string): Promise<RemoteCommandResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          commandId,
          commandType: "ENGINE_CUT",
          truckId: "",
          executedAt: new Date(),
          statusCode: 200,
          message: "Comando ejecutado correctamente en el dispositivo",
          estimatedExecutionTime: 0,
        });
      }, 1000);
    });
  }
}

export const remoteShutdownService = new RemoteShutdownService();

/**
 * TRUCK STATE SERVICE - Monitoreo de estado GPS en tiempo real
 */

import { TruckRealtimeState, TruckStateEnum } from "../types/truckTypes";

class TruckStateService {
  private simulatedStates: Map<string, TruckRealtimeState> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Iniciar monitoreo de un camión (simular GPS)
   */
  startMonitoring(truckId: string, initialState: Partial<TruckRealtimeState>) {
    const state: TruckRealtimeState = {
      id: truckId,
      ficha: initialState.ficha || "F-00",
      currentState: initialState.currentState || TruckStateEnum.ASLEEP,
      latitude: initialState.latitude || 18.4148,
      longitude: initialState.longitude || -70.0267,
      speed: initialState.speed || 0,
      altitude: initialState.altitude || 45,
      heading: initialState.heading || 0,
      distance: initialState.distance || 0,
      lastUpdate: new Date(),
      battery: initialState.battery || 85,
      signalStrength: initialState.signalStrength || 95,
      engineHours: initialState.engineHours || 0,
      totalKM: initialState.totalKM || 150000,
    };

    this.simulatedStates.set(truckId, state);

    // Simular actualización GPS cada 2 segundos
    const interval = setInterval(() => {
      this.updateTruckLocation(truckId);
    }, 2000);

    this.updateIntervals.set(truckId, interval);
  }

  /**
   * Detener monitoreo de un camión
   */
  stopMonitoring(truckId: string) {
    const interval = this.updateIntervals.get(truckId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(truckId);
    }
  }

  /**
   * Actualizar ubicación simulada (GPS variación aleatoria)
   */
  private updateTruckLocation(truckId: string) {
    const state = this.simulatedStates.get(truckId);
    if (!state) return;

    // Variar ubicación ligeramente (±0.0002 coordenadas)
    state.latitude += (Math.random() - 0.5) * 0.0004;
    state.longitude += (Math.random() - 0.5) * 0.0004;

    // Variar velocidad (0-110 KPH)
    state.speed = Math.max(0, state.speed + (Math.random() - 0.5) * 5);

    // Batería disminuye ligeramente
    state.battery = Math.max(10, state.battery - 0.1);

    // Distancia acumulada (si está en movimiento)
    if (state.speed > 5) {
      state.distance += (state.speed / 3600) * 2000; // 2 segundos de intervalo
    }

    // Dirección (0-360°)
    state.heading = Math.floor(Math.random() * 360);

    state.lastUpdate = new Date();

    // Actualizar en el mapa simulado
    this.simulatedStates.set(truckId, state);
  }

  /**
   * Obtener estado actual del camión
   */
  getTruckState(truckId: string): TruckRealtimeState | undefined {
    return this.simulatedStates.get(truckId);
  }

  /**
   * Cambiar estado del camión manualmente (para pruebas)
   */
  setTruckState(truckId: string, newState: TruckStateEnum) {
    const state = this.simulatedStates.get(truckId);
    if (state) {
      state.currentState = newState;

      // Ajustar velocidad según estado
      if (newState === TruckStateEnum.ASLEEP) {
        state.speed = 0;
      } else if (newState === TruckStateEnum.RUNNING) {
        state.speed = Math.random() * 80 + 20;
      }
    }
  }

  /**
   * Obtener todos los camiones monitoreados
   */
  getAllMonitoredTrucks(): TruckRealtimeState[] {
    return Array.from(this.simulatedStates.values());
  }

  /**
   * Limpiar todos los monitoreos
   */
  stopAllMonitoring() {
    for (const [truckId] of this.updateIntervals) {
      this.stopMonitoring(truckId);
    }
    this.simulatedStates.clear();
    this.updateIntervals.clear();
  }
}

export const truckStateService = new TruckStateService();
