/**
 * TIPOS Y INTERFACES - SISTEMA DE MONITOREO GPS AVANZADO
 * Definiciones para estados de camiones y alertas críticas
 */

// Estados posibles del camión en tiempo real
export enum TruckStateEnum {
  RUNNING = "Corriendo",      // Motor encendido, en movimiento
  STOPPED = "Detenido",       // Motor encendido, sin movimiento
  ENGINE_ON = "Encendido",    // Motor recién encendido (ignición ON)
  ASLEEP = "Apagado",         // Motor apagado
  PARKED = "Guardado",        // Estacionado en zona segura
  EMERGENCY = "Emergencia",   // Apagado remoto activado
}

// Tipos de alertas críticas
export enum AlertTypeEnum {
  OFF_ROUTE = "off_route",              // Fuera de ruta
  SPEED_EXCESS = "speed_excess",        // Exceso de velocidad
  MAINTENANCE = "maintenance",          // Cambio de aceite/mantenimiento
  INSURANCE_EXPIRY = "insurance_expiry", // Vencimiento de seguro
  ENGINE_IGNITION = "engine_ignition",  // Encendido de motor
}

// Niveles de severidad de alerta
export enum AlertSeverityEnum {
  LOW = "low",           // Bajo (notificación simple)
  MEDIUM = "medium",     // Medio (alarma con sonido corto)
  HIGH = "high",         // Alto (alarma continua hasta desactivación manual)
}

// Configuración de sonido para alertas
export interface AlertSoundConfig {
  soundFile: string;              // Archivo de audio (ej: "alert_loop.mp3")
  duration: number;              // Duración en ms (0 = infinito/bucle)
  volume: number;                // Volumen de 0-1
  looping: boolean;              // ¿Repetir indefinidamente?
  stopOnUserAction: boolean;     // ¿Se detiene al tocar la alerta?
}

// Estructura de una alerta crítica
export interface CriticalAlert {
  id: string;
  type: AlertTypeEnum;
  severity: AlertSeverityEnum;
  truckId: string;
  truckFicha: string;
  message: string;
  timestamp: Date;
  isActive: boolean;
  soundConfig: AlertSoundConfig;
  additionalData?: Record<string, any>; // Datos adicionales (velocidad, KM faltantes, etc.)
}

// Estructura de estado del camión en tiempo real
export interface TruckRealtimeState {
  id: string;
  ficha: string;
  currentState: TruckStateEnum;
  latitude: number;
  longitude: number;
  speed: number;                  // KPH
  altitude: number;              // Metros
  heading: number;               // Dirección (0-360°)
  distance: number;              // Distancia GPS precisaacum en metros
  lastUpdate: Date;
  battery: number;               // Porcentaje batería del dispositivo GPS
  signalStrength: number;        // Fortaleza de señal GPS (0-100)
  engineHours: number;           // Horas de funcionamiento acumuladas
  totalKM: number;               // KM totales
}

// Respuesta simulada de API de GPS para apagado remoto
export interface RemoteCommandResponse {
  success: boolean;
  commandId: string;
  commandType: "REMOTE_SHUTDOWN" | "ENGINE_CUT" | "GEOFENCE_ALERT";
  truckId: string;
  executedAt: Date;
  statusCode: number;
  message: string;
  estimatedExecutionTime: number; // Segundos para ejecutar en el dispositivo
}

// Configuración global de alertas
export interface AlertsSystemConfig {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  maxConcurrentAlerts: number;
  autoStopAfter?: number;        // Auto-detener alarmas después de N segundos
}
