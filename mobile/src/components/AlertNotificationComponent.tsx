import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAlerts } from '../context/AlertsContext';
import { navigate } from '../navigation/NavigationService';

export const AlertNotificationComponent = () => {
  const { activeAlert, dismissAlert } = useAlerts();

  if (!activeAlert) return null;

  // Si es ruta o velocidad, le damos la opción de brincar al mapa directo
  const handleAction = () => {
    if (activeAlert.type === 'ruta' || activeAlert.type === 'velocidad') {
      navigate('LiveMap');
    }
    dismissAlert();
  };

  return (
    <View style={[styles.container, activeAlert.infinite ? styles.bgCritico : styles.bgPreventivo]}>
      <Text style={styles.titulo}>⚠️ CONTROL DE FLOTA</Text>
      <Text style={styles.mensaje}>{activeAlert.message}</Text>

      <View style={styles.primaryButtonRow}>
        <TouchableOpacity style={styles.botonApagarLarge} onPress={dismissAlert} accessibilityLabel="Apagar Alarma">
          <Text style={styles.textBotonLarge}>⏹️ Apagar Alarma</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        {(activeAlert.type === 'ruta' || activeAlert.type === 'velocidad') && (
          <TouchableOpacity style={styles.botonVer} onPress={handleAction}>
            <Text style={styles.textBoton}>Ver en Mapa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bgCritico: { backgroundColor: '#b91c1c' }, // Rojo intenso para sonido infinito
  bgPreventivo: { backgroundColor: '#d97706' }, // Amarillo/Marrón para temporizados
  titulo: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  mensaje: { color: '#fff', fontSize: 14, marginBottom: 12 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  primaryButtonRow: { marginTop: 8, marginBottom: 10 },
  botonApagarLarge: { backgroundColor: '#b91c1c', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  textBotonLarge: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  botonApagar: { backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  botonVer: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  textBoton: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});