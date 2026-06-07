import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { obtenerAlertasFueraDeRuta, obtenerAlertasVelocidad, simularEnvioAlarma, simularAlarmaVelocidad } from "../utils/routeAlertUtils";

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const { trucks } = useAuth();

  const alertasRuta = obtenerAlertasFueraDeRuta(trucks);
  const alertasVelocidad = obtenerAlertasVelocidad(trucks);

  useEffect(() => {
    if (alertasRuta.length > 0) {
      simularEnvioAlarma(alertasRuta[0]);
    }
    if (alertasVelocidad.length > 0) {
      simularAlarmaVelocidad(alertasVelocidad[0]);
    }
  }, [alertasRuta, alertasVelocidad]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>⚠️ Alertas de Flota</Text>
      </View>
      {alertasRuta.length === 0 && alertasVelocidad.length === 0 ? (
        <Text style={styles.subtitle}>No hay alertas críticas en este momento</Text>
      ) : (
        <>
          {alertasVelocidad.map((alerta) => (
            <TouchableOpacity
              key={alerta.id}
              style={[styles.alertCard, styles.speedCard]}
              onPress={() => navigation.navigate("SpeedAlertDetail", { alerta })}
            >
              <Text style={styles.alertTitle}>Exceso de Velocidad</Text>
              <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
              <Text style={styles.alertInfo}>Velocidad: {alerta.velocidadActual} kph</Text>
              <Text style={styles.alertInfo}>Ubicación: {alerta.coordenadas.latitude.toFixed(4)}, {alerta.coordenadas.longitude.toFixed(4)}</Text>
            </TouchableOpacity>
          ))}

          {alertasRuta.map((alerta) => (
            <TouchableOpacity
              key={alerta.id}
              style={styles.alertCard}
              onPress={() => navigation.navigate("RouteAlertDetail", { alerta })}
            >
              <Text style={styles.alertTitle}>Fuera de Ruta</Text>
              <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
              <Text style={styles.alertInfo}>Ubicación: {alerta.direccion}</Text>
              <Text style={styles.alertInfo}>Autopista: {alerta.carretera}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    paddingRight: 15,
  },
  backButtonText: {
    fontSize: 20,
    color: "#ffffff",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ef4444",
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 24,
  },
  alertCard: {
    backgroundColor: "#1e293b",
    borderColor: "#f87171",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  speedCard: {
    borderColor: "#facc15",
    backgroundColor: "#131a2b",
  },
  alertTitle: {
    color: "#fee2e2",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  alertMessage: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 6,
  },
  alertInfo: {
    color: "#94a3b8",
    fontSize: 13,
  },
});
