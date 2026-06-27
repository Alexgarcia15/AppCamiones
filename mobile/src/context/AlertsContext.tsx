import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { beepService } from '../services/beepService';

interface AlertContextType {
  activeAlert: { type: string; message: string; infinite: boolean } | null;
  triggerAlert: (type: 'ruta' | 'velocidad' | 'aceite' | 'seguro' | 'ignicion', kmFaltantes?: number) => void;
  dismissAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);

  // Inicializar Audio con el formato moderno de Expo
  useEffect(() => {
    const initAudio = async () => {
      try {
      await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  playThroughEarpieceAndroid: false, // 🟢 CAMBIADO: 'shouldRouteThrough...' ahora se llama así
});

      } catch (error) {
        console.log("Error inicializando audio:", error);
      }
    };
    initAudio();
  }, []);

  // Función para reproducir la sirena o los pitidos de emergencia
  async function playAlarmSound(isInfinite: boolean, durationMs?: number, alertType?: string) {
    try {
      // Descargar sonido anterior si existe
      if (soundInstance) {
        await soundInstance.unloadAsync().catch(() => {});
      }

      // Reproducir vibración inmediatamente como feedback
      const vibrationPattern = alertType === 'velocidad' || alertType === 'ruta' 
        ? [0, 100, 100, 100, 100, 100] // Patrón más agresivo para alertas críticas
        : [0, 50, 100, 50]; // Patrón normal

      console.log("🎯 Iniciando vibración con patrón:", vibrationPattern);
      
      try {
        Vibration.vibrate(vibrationPattern);
        console.log("✓ Vibración ejecutada");
      } catch (vibError) {
        console.log("⚠️ Error en vibración:", vibError);
      }

      // Intentar cargar archivo de sonido
      let sound: Audio.Sound | null = null;
      try {
        const soundObj = new Audio.Sound();
        await soundObj.loadAsync(require('../assets/alarma.mp3'));
        sound = soundObj;
        console.log("✓ Sonido alarma.mp3 cargado");
      } catch (loadError) {
        console.log("⚠️ No se pudo cargar alarma.mp3, usando beep generado");

        if (isInfinite) {
          const beepFrequency = alertType === 'velocidad' || alertType === 'ruta' ? 800 : 600;
          await beepService.playLoopingBeep(beepFrequency, 700);
        } else {
          const beepFrequency = alertType === 'velocidad' || alertType === 'ruta' ? 800 : 600;
          const repeatCount = 2;
          const beepDuration = 500;
          const pauseBetween = 200;

          await beepService.playRepeatingBeep(beepFrequency, beepDuration, repeatCount, pauseBetween);
        }
      }

      if (sound) {
        setSoundInstance(sound);
        await sound.setVolumeAsync(1.0);

        try {
          if (isInfinite) {
            await sound.setIsLoopingAsync(true);
          }
          await sound.playAsync();
          console.log("✓ Sonido reproduciendo");
        } catch (playError) {
          console.log("⚠️ Error reproduciendo sonido:", playError);
        }

        // Si tiene una duración fija (alerta temporal)
        if (!isInfinite && durationMs) {
          setTimeout(async () => {
            try {
              if (sound) {
                await sound.stopAsync().catch(() => {});
                await sound.unloadAsync().catch(() => {});
                setSoundInstance(null);
              }
            } catch (stopError) {
              console.log("⚠️ Error deteniendo sonido programado:", stopError);
            }
          }, durationMs);
        }
      }
    } catch (error) {
      console.log("❌ Error general con sonido/vibración:", error);
      try {
        Vibration.vibrate([0, 100, 50, 100]);
        console.log("✓ Vibración fallback ejecutada");
      } catch (e) {
        console.log("❌ Fallo también el fallback de vibración:", e);
      }
    }
  }

  // Se tipó la entrada estrictamente para cumplir con AlertContextType
  const triggerAlert = (type: 'ruta' | 'velocidad' | 'aceite' | 'seguro' | 'ignicion', kmFaltantes?: number) => {
    let message = "";
    let infinite = false;
    let duration = 0;

    switch (type) {
      case 'ruta':
        message = "¡ALERTA CRÍTICA! Camión fuera de ruta asignada.";
        infinite = true;
        break;
      case 'velocidad':
        message = "¡ALERTA DE VELOCIDAD! Unidad excedió los 90 KPH.";
        infinite = true;
        break;
      case 'aceite':
        if (kmFaltantes === 0) {
          message = "¡MANTENIMIENTO CRÍTICO! Cambio de aceite obligatorio YA.";
          infinite = true;
        } else {
          message = `Aviso: Faltan ${kmFaltantes} KM para el cambio de aceite.`;
          infinite = false;
          duration = 10000; // 10 segundos
        }
        break;
      case 'seguro':
        message = "Recordatorio: El seguro del camión vence en 1 semana.";
        infinite = false;
        duration = 8000;
        break;
      case 'ignicion':
        message = "Notificación: Motor encendido.";
        infinite = false;
        duration = 4000; // 4 segundos exactos
        break;
    }

    console.log(`🔔 ALERTA DISPARADA: ${type} - ${message}`);
    
    setActiveAlert({ type, message, infinite });
    
    // Ejecutar vibración de forma segura
    const vibrationPattern = type === 'velocidad' || type === 'ruta' 
      ? [0, 100, 100, 100, 100, 100]
      : [0, 50, 100, 50];
    
    try {
      Vibration.vibrate(vibrationPattern);
      console.log("✓ Vibración iniciada");
    } catch (e) {
      console.log("✗ Error en vibración:", e);
    }
    
    // Lanzar sonido
    playAlarmSound(infinite, duration, type);
  };

  const dismissAlert = async () => {
    try {
      if (soundInstance) {
        await soundInstance.stopAsync().catch(() => {});
        await soundInstance.unloadAsync().catch(() => {});
        setSoundInstance(null);
      }
    } catch (error) {
      console.log("Error al descartar alerta de media real:", error);
    }

    try {
      await beepService.stopLoopingBeep();
    } catch (error) {
      console.log("Error al detener beep continuo:", error);
    }

    setActiveAlert(null);
  };

  return (
    <AlertContext.Provider value={{ activeAlert, triggerAlert, dismissAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlerts debe usarse dentro de AlertProvider");
  return context;
};