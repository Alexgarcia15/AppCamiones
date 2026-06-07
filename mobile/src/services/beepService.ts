import { Audio } from 'expo-av';

class BeepService {
  private beepSound: Audio.Sound | null = null;

  async playBeep(frequency: number = 1000, duration: number = 400) {
    try {
      // Crear un pequeño tono WAV en base64 (tono de 1kHz, 400ms)
      // Este es un tono muy simple que funciona sin archivos externos
      const waveData = this.generateBeepWave(frequency, duration);
      
      if (this.beepSound) {
        await this.beepSound.unloadAsync();
      }

      this.beepSound = new Audio.Sound();
      
      await this.beepSound.loadAsync({
        uri: `data:audio/wav;base64,${waveData}`,
      });

      await this.beepSound.setVolumeAsync(1.0);
      await this.beepSound.playAsync();

      // Auto-cleanup después del tono
      setTimeout(() => {
        this.beepSound?.unloadAsync().catch(e => console.log("Error unloading beep:", e));
      }, duration + 100);

    } catch (error) {
      console.log("Error reproduciendo beep:", error);
    }
  }

  async playRepeatingBeep(frequency: number = 1000, beepDuration: number = 500, repeatCount: number = 3, pauseBetween: number = 200) {
    for (let i = 0; i < repeatCount; i++) {
      await this.playBeep(frequency, beepDuration);
      if (i < repeatCount - 1) {
        await new Promise(resolve => setTimeout(resolve, pauseBetween));
      }
    }
  }

  async playLoopingBeep(frequency: number = 1000, duration: number = 600) {
    try {
      if (this.beepSound) {
        await this.beepSound.unloadAsync();
      }

      const waveData = this.generateBeepWave(frequency, duration);
      this.beepSound = new Audio.Sound();
      await this.beepSound.loadAsync({
        uri: `data:audio/wav;base64,${waveData}`,
      });

      await this.beepSound.setVolumeAsync(1.0);
      await this.beepSound.setIsLoopingAsync(true);
      await this.beepSound.playAsync();
    } catch (error) {
      console.log("Error reproduciendo beep continuo:", error);
    }
  }

  async stopLoopingBeep() {
    if (!this.beepSound) return;
    try {
      await this.beepSound.stopAsync();
      await this.beepSound.unloadAsync();
    } catch (error) {
      console.log("Error deteniendo beep continuo:", error);
    } finally {
      this.beepSound = null;
    }
  }

  // Generar un tono WAV muy simple en base64
  private generateBeepWave(frequency: number, duration: number): string {
    // Este es un tono pre-generado simple. En producción usarías una librería
    // pero para debugging, este WAV hardcoded funciona en la mayoría de dispositivos
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration / 1000);
    const audioData = new Uint8Array(44 + samples * 2);

    // WAV header (simplificado)
    const view = new DataView(audioData.buffer);
    
    // RIFF header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generar samples de tono simple
    const amplitude = 0.3;
    for (let i = 0; i < samples; i++) {
      const value = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * amplitude * 32767;
      view.setInt16(44 + i * 2, value, true);
    }

    // Convertir a base64
    return this._arrayBufferToBase64(audioData);
  }

  private _arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export const beepService = new BeepService();
