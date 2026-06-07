/**
 * TRUCK DETAIL SCREEN - MEJORADO CON APAGADO REMOTO
 * Detalles técnicos del camión + Botón de Emergencia para corte de corriente
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { remoteShutdownService } from "../services/remoteShutdownService";
import { Camion } from "../utils/routeAlertUtils";

interface RouteParams {
  camion: Camion;
}

export default function TruckDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const { camion } = route.params || {};

  if (!camion) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>No se encontraron datos de la unidad.</Text>
      </View>
    );
  }

  // Datos mecánicos según el modelo
  const esMack = camion.marca.toLowerCase() === "mack";
  const detallesMecanicos = {
    motor: esMack ? "Mack MP7 - 11 Litros" : "Cummins ISX15",
    potencia: esMack ? "405 HP" : "450 HP",
    transmision: esMack ? "Fuller Roadranger 18 cambios" : "Eaton Fuller 10 cambios",
    diferencial: esMack ? "Relación 4.11 (Para 50 Toneladas)" : "Relación 3.73",
    aceite: "15W-40 Premium Diesel",
  };

  // Calcular KM para próximo mantenimiento
  const kmProximoMantenimiento = 200000; // KM de siguiente mantenimiento
  const kmFaltantes = kmProximoMantenimiento - (camion.kilometraje || 0);
  const porcentajeFaltante = (kmFaltantes / 5000) * 100; // Escala de 5000 KM

  /**
   * MANEJO DE APAGADO REMOTO DE EMERGENCIA
   */
  const handleEmergencyShutdown = async () => {
    setIsLoading(true);
    try {
      const response = await remoteShutdownService.executeRemoteShutdown(
        camion.id,
        camion.ficha,
        "user-id-temp" // En producción, obtener del contexto
      );

      if (response.success) {
        Alert.alert(
          "✅ Comando Ejecutado",
          `${response.message}\n\nEl motor de ${camion.ficha} será apagado en aproximadamente ${response.estimatedExecutionTime} segundos.`,
          [{ text: "Aceptar" }]
        );

        // Opcional: Actualizar estado del camión a "APAGADO/EMERGENCIA"
        setShowEmergencyConfirm(false);
      } else {
        Alert.alert(
          "❌ Error",
          "No se pudo enviar el comando de apagado remoto. Intente nuevamente."
        );
      }
    } catch (error) {
      Alert.alert(
        "❌ Error de Conexión",
        "No se pudo conectar con el servidor de control remoto."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Botón para volver atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>⬅️ Volver a la lista</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{camion.marca} {camion.modelo}</Text>
      <Text style={styles.subHeader}>Ficha: {camion.ficha} | Año: {camion.año}</Text>

      {/* Tarjeta de Estado Operativo */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📍 Estado Operativo</Text>
        <Text style={styles.infoText}>Estado: <Text style={styles.boldText}>{camion.estado}</Text></Text>
        <Text style={styles.infoText}>📊 Kilometraje: {camion.kilometraje} KM</Text>
      </View>

      {/* Tarjeta de Ficha Técnica */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚙️ Ficha Técnica del Tren Motriz</Text>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Motor:</Text>
          <Text style={styles.specValue}>{detallesMecanicos.motor}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Potencia:</Text>
          <Text style={styles.specValue}>{detallesMecanicos.potencia}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Transmisión:</Text>
          <Text style={styles.specValue}>{detallesMecanicos.transmision}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Diferenciales:</Text>
          <Text style={styles.specValue}>{detallesMecanicos.diferencial}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Tipo de Aceite:</Text>
          <Text style={styles.specValue}>{detallesMecanicos.aceite}</Text>
        </View>
      </View>

      {/* Tarjeta de Mantenimiento Preventivo */}
      <View style={[styles.sectionCard, kmFaltantes < 1000 && styles.maintenanceAlertCard]}>
        <Text style={styles.sectionTitle}>🔧 Mantenimiento Preventivo</Text>
        <Text style={styles.infoText}>
          Próximo cambio de aceite: {kmProximoMantenimiento.toLocaleString()} KM
        </Text>
        <Text style={[styles.infoText, kmFaltantes < 1000 && styles.urgentText]}>
          Faltan: <Text style={styles.boldText}>{kmFaltantes.toLocaleString()} KM</Text>
        </Text>

        {/* Barra de progreso visual */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(porcentajeFaltante, 100)}%`,
                backgroundColor:
                  kmFaltantes < 1000
                    ? "#ef4444"
                    : kmFaltantes < 3000
                    ? "#f97316"
                    : "#22c55e",
              },
            ]}
          />
        </View>

        {kmFaltantes < 100 && (
          <Text style={styles.criticalWarning}>
            ⚠️ MANTENIMIENTO CRÍTICO - ¡Requiere atención inmediata!
          </Text>
        )}
      </View>

      {/* BOTÓN DE APAGADO REMOTO DE EMERGENCIA */}
      <View style={styles.emergencySection}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => setShowEmergencyConfirm(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.emergencyButtonIcon}>🛑</Text>
              <Text style={styles.emergencyButtonText}>Apagado Remoto de Emergencia</Text>
              <Text style={styles.emergencyButtonSubText}>Corte de corriente al GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL DE CONFIRMACIÓN DE SEGURIDAD */}
      <Modal
        visible={showEmergencyConfirm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmergencyConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Confirmación de Seguridad</Text>

            <Text style={styles.modalMessage}>
              ¿Está seguro de que desea apagar el motor de la unidad{" "}
              <Text style={styles.boldText}>{camion.ficha}</Text>?
            </Text>

            <Text style={styles.modalWarning}>
              Esta acción enviará un comando de corte de corriente al dispositivo GPS del
              vehículo, apagando el motor sin importar su ubicación.
            </Text>

            <Text style={styles.modalInfo}>
              • El comando será enviado en los próximos segundos\n• El motor se apagará en
              5-10 segundos\n• Solo el conductor podrá reiniciarlo
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEmergencyConfirm(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEmergencyShutdown}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Apagado</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
  },
  subHeader: {
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 20,
    marginTop: 5,
  },
  sectionCard: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  maintenanceAlertCard: {
    borderColor: "#ef4444",
    backgroundColor: "#1a1f2e",
  },
  sectionTitle: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 8,
  },
  infoText: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  specLabel: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    width: 110,
  },
  specValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left",
    flex: 1,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 6,
  },
  urgentText: {
    color: "#ef4444",
  },
  criticalWarning: {
    color: "#fef08a",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(180, 83, 9, 0.2)",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
  },
  emergencySection: {
    marginBottom: 40,
  },
  emergencyButton: {
    backgroundColor: "#dc2626",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  emergencyButtonIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  emergencyButtonSubText: {
    color: "#fecaca",
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    borderTopWidth: 3,
    borderTopColor: "#dc2626",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fca5a5",
    marginBottom: 16,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "white",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  modalWarning: {
    fontSize: 13,
    color: "#fca5a5",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  modalInfo: {
    fontSize: 12,
    color: "#cbd5e1",
    marginBottom: 20,
    lineHeight: 18,
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#334155",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#dc2626",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
