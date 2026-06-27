import { Audio } from 'expo-av';
import { CriticalAlert } from '../types/truckTypes';

class AlertSoundService {
  private activeSounds: Map<string, Audio.Sound> = new Map();

  /**
   * Carga y reproduce el archivo .mp3 correspondiente a la alerta
   */
  async playAlert(alert: CriticalAlert) {
    try {
      if (this.activeSounds.has(alert.id)) return;

      const soundInstance = new Audio.Sound();
      let soundFile;

      // 🛡️ ESCUDO ANTI-CRASH: Si las rutas de los archivos .mp3 no existen,
      // el catch atrapará el error y evitará que la aplicación se cierre de golpe.
      try {
        switch (alert.soundConfig.soundFile) {
          case 'off_route_alarm.mp3':
            soundFile = require('../../assets/sounds/off_route_alarm.mp3');
            break;
          case 'speed_alarm.mp3':
            soundFile = require('../../assets/sounds/speed_alarm.mp3');
            break;
          case 'maintenance_critical.mp3':
            soundFile = require('../../assets/sounds/maintenance_critical.mp3');
            break;
          case 'insurance_alert.mp3':
            soundFile = require('../../assets/sounds/insurance_alert.mp3');
            break;
          case 'engine_ignition.mp3':
            soundFile = require('../../assets/sounds/engine_ignition.mp3');
            break;
          default:
            soundFile = require('../../assets/sounds/maintenance_warning.mp3');
        }
      } catch (requireError) {
        console.warn("⚠️ Advertencia: No se encontró el archivo físico en assets/sounds/ para:", alert.soundConfig.soundFile);
        return; // Detiene la ejecución de sonido pero mantiene viva la app
      }

      await soundInstance.loadAsync(soundFile);
      await soundInstance.setVolumeAsync(alert.soundConfig.volume);
      await soundInstance.setIsLoopingAsync(alert.soundConfig.looping);
      await soundInstance.playAsync();

      this.activeSounds.set(alert.id, soundInstance);
    } catch (error) {
      console.error("Error al reproducir sonido de alerta:", error);
    }
  }

  /**
   * Detiene el sonido de una alerta específica
   */
  async stopAlert(alertId: string) {
    try {
      const sound = this.activeSounds.get(alertId);
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        this.activeSounds.delete(alertId);
      }
    } catch (error) {
      console.error("Error al detener el sonido de alerta:", error);
    }
  }

  /**
   * Apaga todos los ruidos activos
   */
  async stopAllAlerts() {
    for (const alertId of this.activeSounds.keys()) {
      await this.stopAlert(alertId);
    }
  }
}

export const alertSoundService = new AlertSoundService();