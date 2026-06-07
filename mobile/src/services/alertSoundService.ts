/**
 * ALERT SOUND SERVICE - Control avanzado de alarmas y sonidos
 * Gestiona playback de sonidos con lógica de bucle, severidad y cancelación manual
 */

import { Audio } from "expo-av";
import { Vibration } from "react-native";
import {
  AlertTypeEnum,
  AlertSeverityEnum,
  CriticalAlert,
  AlertSoundConfig,
} from "../types/truckTypes";

// Estados internos del servicio
interface SoundPlaybackState {
  alertId: string;
  alertType: AlertTypeEnum;
  soundObject: Audio.Sound | null;
  isPlaying: boolean;
  loopTimeoutId?: NodeJS.Timeout;
  startTime: Date;
}

class AlertSoundService {
  private playbackStates: Map<string, SoundPlaybackState> = new Map();
  private soundConfigs: Map<AlertTypeEnum, AlertSoundConfig> = new Map();
  private maxConcurrentAlerts = 3;

  constructor() {
    this.initializeSoundConfigs();
    this.setupAudioSession();
  }

  /**
   * Inicializa configuraciones de sonido para cada tipo de alerta
   */
  private initializeSoundConfigs() {
    // 1. FUERA DE RUTA: Sonido continuo e infinito (no se detiene hasta confirmación)
    this.soundConfigs.set(AlertTypeEnum.OFF_ROUTE, {
      soundFile: "off_route_alarm.mp3",
      duration: 0,
      volume: 0.95,
      looping: true,
      stopOnUserAction: true,
    });

    // 2. EXCESO DE VELOCIDAD: Sonido continuo e infinito
    this.soundConfigs.set(AlertTypeEnum.SPEED_EXCESS, {
      soundFile: "speed_alarm.mp3",
      duration: 0,
      volume: 0.9,
      looping: true,
      stopOnUserAction: true,
    });

    // 3a. MANTENIMIENTO (Faltan 400/300/200/100 KM): Alarma 10 segundos, se detiene sola
    this.soundConfigs.set(AlertTypeEnum.MAINTENANCE, {
      soundFile: "maintenance_warning.mp3",
      duration: 10000,
      volume: 0.75,
      looping: false,
      stopOnUserAction: false,
    });

    // 3b. MANTENIMIENTO CRÍTICO (0 KM): Sonido infinito hasta confirmación
    this.soundConfigs.set(AlertTypeEnum.MAINTENANCE, {
      soundFile: "maintenance_critical.mp3",
      duration: 0,
      volume: 0.95,
      looping: true,
      stopOnUserAction: true,
    });

    // 4. VENCIMIENTO DE SEGURO (1 semana): Alerta 2 veces al día de forma aleatoria
    this.soundConfigs.set(AlertTypeEnum.INSURANCE_EXPIRY, {
      soundFile: "insurance_alert.mp3",
      duration: 8000,
      volume: 0.7,
      looping: false,
      stopOnUserAction: false,
    });

    // 5. ENCENDIDO DE MOTOR: Alerta rápida (4 segundos)
    this.soundConfigs.set(AlertTypeEnum.ENGINE_IGNITION, {
      soundFile: "engine_ignition.mp3",
      duration: 4000,
      volume: 0.6,
      looping: false,
      stopOnUserAction: false,
    });
  }

  /**
   * Configura la sesión de audio para reproducción en primer plano
   */
  private async setupAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionHandlingIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpiece: false,
      });
    } catch (error) {
      console.error("Error configurando sesión de audio:", error);
    }
  }

  /**
   * MÉTODO PRINCIPAL: Reproducir alarma para una alerta crítica
   */
  async playAlert(alert: CriticalAlert): Promise<void> {
    if (this.playbackStates.size >= this.maxConcurrentAlerts) {
      console.warn(`Máximo de alarmas concurrentes (${this.maxConcurrentAlerts}) alcanzado`);
      return;
    }

    try {
      const config = this.soundConfigs.get(alert.type) || alert.soundConfig;

      // Crear objeto de sonido
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync(require(`../assets/sounds/${config.soundFile}`));
      await soundObject.setVolumeAsync(config.volume);

      // Guardar estado de reproducción
      const playbackState: SoundPlaybackState = {
        alertId: alert.id,
        alertType: alert.type,
        soundObject,
        isPlaying: true,
        startTime: new Date(),
      };

      this.playbackStates.set(alert.id, playbackState);

      // Iniciar reproducción
      await soundObject.playAsync();

      // Aplicar vibración si está habilitada
      this.triggerVibration(alert.severity);

      // Configurar lógica de duración
      if (config.duration > 0) {
        // Alarma con duración limitada
        playbackState.loopTimeoutId = setTimeout(() => {
          this.stopAlert(alert.id);
        }, config.duration);
      } else if (config.looping) {
        // Alarma infinita: reiniciar cuando termine
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish && playbackState.isPlaying) {
            this.playAlert(alert); // Re-reproducir
          }
        });
      }
    } catch (error) {
      console.error(`Error reproduciendo alerta ${alert.id}:`, error);
    }
  }

  /**
   * Detener una alarma por ID (invocado por usuario o automáticamente)
   */
  async stopAlert(alertId: string): Promise<void> {
    const playbackState = this.playbackStates.get(alertId);

    if (!playbackState) return;

    try {
      playbackState.isPlaying = false;

      if (playbackState.loopTimeoutId) {
        clearTimeout(playbackState.loopTimeoutId);
      }

      if (playbackState.soundObject) {
        await playbackState.soundObject.stopAsync();
        await playbackState.soundObject.unloadAsync();
      }

      this.playbackStates.delete(alertId);
    } catch (error) {
      console.error(`Error deteniendo alerta ${alertId}:`, error);
    }
  }

  /**
   * Detener todas las alarmas activas
   */
  async stopAllAlerts(): Promise<void> {
    for (const [alertId] of this.playbackStates) {
      await this.stopAlert(alertId);
    }
  }

  /**
   * Pausar/Reanudar una alarma
   */
  async pauseAlert(alertId: string): Promise<void> {
    const playbackState = this.playbackStates.get(alertId);
    if (playbackState?.soundObject) {
      await playbackState.soundObject.pauseAsync();
    }
  }

  async resumeAlert(alertId: string): Promise<void> {
    const playbackState = this.playbackStates.get(alertId);
    if (playbackState?.soundObject) {
      await playbackState.soundObject.playAsync();
    }
  }

  /**
   * Aplicar vibración según severidad
   */
  private triggerVibration(severity: AlertSeverityEnum) {
    const patterns: Record<AlertSeverityEnum, number[]> = {
      [AlertSeverityEnum.LOW]: [100],                    // Un vibración corta
      [AlertSeverityEnum.MEDIUM]: [200, 100, 200],       // Patrón medio
      [AlertSeverityEnum.HIGH]: [300, 100, 300, 100, 300], // Patrón intenso
    };

    try {
      Vibration.vibrate(patterns[severity]);
    } catch (error) {
      console.warn("Error con vibración:", error);
    }
  }

  /**
   * Obtener estado actual de reproducción
   */
  getPlaybackState(alertId: string): SoundPlaybackState | undefined {
    return this.playbackStates.get(alertId);
  }

  /**
   * Obtener todas las alertas activas
   */
  getActiveAlerts(): SoundPlaybackState[] {
    return Array.from(this.playbackStates.values()).filter((s) => s.isPlaying);
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    await this.stopAllAlerts();
  }
}

// Instancia singleton
export const alertSoundService = new AlertSoundService();
