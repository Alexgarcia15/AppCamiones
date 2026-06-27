/**
 * CRITICAL ALERTS SERVICE - Coordinador central de alertas
 * Gestiona las 5 alertas críticas con sus reglas de sonido específicas
 */

import {
  CriticalAlert,
  AlertTypeEnum,
  AlertSeverityEnum,
  TruckStateEnum,
} from "../types/truckTypes";

// 🟢 Aquí pegas el bloque de la navegación real:
import { navigate } from "../navigation/NavigationService";

// 🟢 Aquí pegas el parche temporal del sonido:
// @ts-ignore
import alertSoundServiceInstance from "./alertSoundService";
const alertSoundService = alertSoundServiceInstance as any;

import { truckStateService } from "./remoteShutdownService";

// 👇 DE AQUÍ PARA ABAJO DEJA TODO TU CÓDIGO EXACTAMENTE COMO ESTABA
class CriticalAlertsService {
  private activeAlerts: Map<string, CriticalAlert> = new Map();
  private alertListeners: Set<(alerts: CriticalAlert[]) => void> = new Set();
  private maintenanceCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private insuranceCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  

  triggerOffRouteAlert(truckId: string, truckFicha: string, message: string) {
    const alertId = `OFF_ROUTE_${truckId}_${Date.now()}`;

    const alert: CriticalAlert = {
      id: alertId,
      type: AlertTypeEnum.OFF_ROUTE,
      severity: AlertSeverityEnum.HIGH,
      truckId,
      truckFicha,
      message: `⚠️ FUERA DE RUTA: ${truckFicha} - ${message}`,
      timestamp: new Date(),
      isActive: true,
      soundConfig: {
        soundFile: "off_route_alarm.mp3",
        duration: 0,
        volume: 0.95,
        looping: true,
        stopOnUserAction: true,
      },
    };

    this.activeAlerts.set(alertId, alert);
    alertSoundService.playAlert(alert);
    this.notifyListeners();

    return alertId;
  }

  /**
   * ALERTA 2: EXCESO DE VELOCIDAD (> 90 KPH)
   * - Sonido continuo infinito (bucle)
   * - Presionar = ir a LiveMapScreen
   */
  triggerSpeedExcessAlert(
    truckId: string,
    truckFicha: string,
    currentSpeed: number
  ) {
    const alertId = `SPEED_${truckId}_${Date.now()}`;

    const alert: CriticalAlert = {
      id: alertId,
      type: AlertTypeEnum.SPEED_EXCESS,
      severity: AlertSeverityEnum.HIGH,
      truckId,
      truckFicha,
      message: `⚡ VELOCIDAD EXCESIVA: ${truckFicha} va a ${currentSpeed} KPH`,
      timestamp: new Date(),
      isActive: true,
      soundConfig: {
        soundFile: "speed_alarm.mp3",
        duration: 0,
        volume: 0.9,
        looping: true,
        stopOnUserAction: true,
      },
      additionalData: { currentSpeed },
    };

    this.activeAlerts.set(alertId, alert);
    alertSoundService.playAlert(alert);
    this.notifyListeners();

    return alertId;
  }

  /**
   * ALERTA 3: MANTENIMIENTO - Cambio de Aceite Preventivo
   * Reglas:
   * - Faltan 400/300/200/100 KM: Alarma 10 segundos, se detiene sola
   * - Llegó al límite (0 KM): Sonido infinito hasta confirmación
   */
  triggerMaintenanceAlert(
    truckId: string,
    truckFicha: string,
    kmRemaining: number
  ) {
    const alertId = `MAINT_${truckId}_${Date.now()}`;
    const isCritical = kmRemaining === 0;

    const alert: CriticalAlert = {
      id: alertId,
      type: AlertTypeEnum.MAINTENANCE,
      severity: isCritical ? AlertSeverityEnum.HIGH : AlertSeverityEnum.MEDIUM,
      truckId,
      truckFicha,
      message: isCritical
        ? `🔧 MANTENIMIENTO CRÍTICO: ${truckFicha} alcanzó 0 KM para cambio de aceite`
        : `🔧 Mantenimiento preventivo: ${truckFicha} - Faltan ${kmRemaining} KM`,
      timestamp: new Date(),
      isActive: true,
      soundConfig: {
        soundFile: isCritical
          ? "maintenance_critical.mp3"
          : "maintenance_warning.mp3",
        duration: isCritical ? 0 : 10000, // 10 segundos si no es crítico
        volume: isCritical ? 0.95 : 0.75,
        looping: isCritical,
        stopOnUserAction: isCritical,
      },
      additionalData: { kmRemaining, isCritical },
    };

    this.activeAlerts.set(alertId, alert);
    alertSoundService.playAlert(alert);
    this.notifyListeners();

    return alertId;
  }

  /**
   * ALERTA 4: VENCIMIENTO DE SEGURO (Falta 1 semana)
   * - Alerta diaria: suena 2 veces al día de forma aleatoria
   * - Cada sonido dura 8 segundos
   */
  setupInsuranceExpiryAlerts(
    truckId: string,
    truckFicha: string,
    daysUntilExpiry: number
  ) {
    if (daysUntilExpiry > 7) return; // No disparar si falta más de 1 semana

    const intervalId = setInterval(() => {
      // Random entre 6 AM y 10 PM
      const randomHour = Math.floor(Math.random() * 16) + 6;
      const now = new Date();

      if (now.getHours() === randomHour) {
        const alertId = `INS_${truckId}_${Date.now()}`;

        const alert: CriticalAlert = {
          id: alertId,
          type: AlertTypeEnum.INSURANCE_EXPIRY,
          severity: AlertSeverityEnum.MEDIUM,
          truckId,
          truckFicha,
          message: `🔰 SEGURO VENCIENDO: ${truckFicha} - Falta ${daysUntilExpiry} día(s)`,
          timestamp: new Date(),
          isActive: true,
          soundConfig: {
            soundFile: "insurance_alert.mp3",
            duration: 8000,
            volume: 0.7,
            looping: false,
            stopOnUserAction: false,
          },
          additionalData: { daysUntilExpiry },
        };

        this.activeAlerts.set(alertId, alert);
        alertSoundService.playAlert(alert);
        this.notifyListeners();
      }
    }, 3600000); // Verificar cada hora

    this.insuranceCheckIntervals.set(truckId, intervalId);
  }

  /**
   * ALERTA 5: ENCENDIDO DE MOTOR (Ignición ON)
   * - Alerta rápida de 4 segundos
   * - Notifica al dueño del encendido
   */
  triggerEngineIgnitionAlert(truckId: string, truckFicha: string) {
    const alertId = `IGN_${truckId}_${Date.now()}`;

    const alert: CriticalAlert = {
      id: alertId,
      type: AlertTypeEnum.ENGINE_IGNITION,
      severity: AlertSeverityEnum.LOW,
      truckId,
      truckFicha,
      message: `🚗 ENCENDIDO DETECTADO: ${truckFicha} motor encendido`,
      timestamp: new Date(),
      isActive: true,
      soundConfig: {
        soundFile: "engine_ignition.mp3",
        duration: 4000,
        volume: 0.6,
        looping: false,
        stopOnUserAction: false,
      },
    };

    this.activeAlerts.set(alertId, alert);
    alertSoundService.playAlert(alert);
    this.notifyListeners();

    // Auto-remover después de duración
    setTimeout(() => {
      this.removeAlert(alertId);
    }, 5000);

    return alertId;
  }

  /**
   * Desactivar/Confirmar una alerta
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.isActive = false;
    await alertSoundService.stopAlert(alertId);
    this.notifyListeners();

    return true;
  }

  /**
   * Remover alerta completamente
   */
  removeAlert(alertId: string) {
    this.activeAlerts.delete(alertId);
    alertSoundService.stopAlert(alertId);
    this.notifyListeners();
  }

  /**
   * Obtener todas las alertas activas
   */
  getActiveAlerts(): CriticalAlert[] {
    return Array.from(this.activeAlerts.values()).filter((a) => a.isActive);
  }

  /**
   * Obtener alertas de un camión específico
   */
  getTruckAlerts(truckId: string): CriticalAlert[] {
    return this.getActiveAlerts().filter((a) => a.truckId === truckId);
  }

  /**
   * Suscribirse a cambios de alertas
   */
  subscribe(listener: (alerts: CriticalAlert[]) => void): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners() {
    const activeAlerts = this.getActiveAlerts();
    this.alertListeners.forEach((listener) => listener(activeAlerts));
  }

  /**
   * Limpiar todo (logout, etc)
   */
  async cleanup() {
    await alertSoundService.stopAllAlerts();
    this.activeAlerts.clear();
    this.alertListeners.clear();

    for (const [, intervalId] of this.maintenanceCheckIntervals) {
      clearInterval(intervalId);
    }
    for (const [, intervalId] of this.insuranceCheckIntervals) {
      clearInterval(intervalId);
    }

    this.maintenanceCheckIntervals.clear();
    this.insuranceCheckIntervals.clear();
  }
}

export const criticalAlertsService = new CriticalAlertsService();
