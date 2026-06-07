import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useAlerts } from "../context/AlertsContext";
import { obtenerAlertasFueraDeRuta, obtenerAlertasVelocidad, obtenerAlertasSeguro, simularAlarmaSeguro } from "../utils/routeAlertUtils";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, trucks, logout } = useAuth();
  const { triggerAlert } = useAlerts();
  const [blinkAnim] = useState(new Animated.Value(1));

  // Cierre de sesión seguro: limpia el estado global y expulsa al usuario
  const handleLogout = async () => {
    try {
      await logout();
      // Al cambiar 'user' a null, AppNavigator te expulsa automáticamente a la zona pública (Login)
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión correctamente");
    }
  };

  const alertasFueraRuta = useMemo(() => obtenerAlertasFueraDeRuta(trucks), [trucks]);
  const alertasVelocidad = useMemo(() => obtenerAlertasVelocidad(trucks), [trucks]);
  const alertasSeguro = useMemo(() => obtenerAlertasSeguro(trucks), [trucks]);

  useEffect(() => {
    if (alertasSeguro.length > 0) {
      simularAlarmaSeguro(alertasSeguro[0]);
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: false }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [alertasSeguro.length, blinkAnim]);

  const handleSeguroCardPress = () => {
    if (alertasSeguro.length > 0) {
      Alert.alert("Vencimiento de Seguro", alertasSeguro[0].mensaje, [{ text: "Aceptar" }], {
        cancelable: true,
      });
    }
  };

 // Línea 44: El inicio del retorno visual
return (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    
    {/* ⬇️ AQUÍ REEMPLAZAS LO VIEJO Y PEGAS ESTO (Línea 46) ⬇️ */}
 <View style={styles.topBar}>
        {/* Flecha Izquierda: Cierra sesión y va a la portada principal del camión */}
        <TouchableOpacity onPress={handleLogout} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>⟸</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Bienvenido {user?.name ?? "Dueño"} al Centro de Operaciones</Text>
        
        {/* Flecha Derecha: Manda directo a la pantalla de Inicio de Sesión (Login) */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.logoutText}>⟹</Text>
        </TouchableOpacity>
      </View>
    {/* ⬆️ AQUÍ TERMINA EL BLOQUE PEGADO ⬆️ */}

    <Text style={styles.subtitle}>PANEL DE CONTROL</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Trucks")}> 
          <Text style={styles.icon}>🚚</Text>
          <Text style={styles.cardTitle}>Mis Camiones</Text>
          <Text style={styles.cardValue}>{trucks.length} Unidad{trucks.length === 1 ? "" : "es"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, alertasFueraRuta.length > 0 && styles.alertCard]}
          onPress={() => navigation.navigate("Alerts")}
        >
          <Text style={styles.icon}>🛑</Text>
          <Text style={styles.cardTitle}>Fuera de Ruta</Text>
          <Text style={styles.cardValue}>{alertasFueraRuta.length} Evento{alertasFueraRuta.length === 1 ? "" : "s"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, alertasVelocidad.length > 0 && styles.speedAlertCard]}
          onPress={() =>
            alertasVelocidad.length > 0
              ? navigation.navigate("SpeedAlertDetail", { alerta: alertasVelocidad[0] })
              : navigation.navigate("Alerts")
          }
        >
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.cardTitle}>Exceso de Velocidad</Text>
          <Text style={styles.cardValue}>{alertasVelocidad.length} Alerta{alertasVelocidad.length === 1 ? "" : "s"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, alertasSeguro.length > 0 && styles.insuranceAlertCard]}
          onPress={handleSeguroCardPress}
        >
          <Animated.View style={[{ opacity: alertasSeguro.length > 0 ? blinkAnim : 1 }]}>
            <Text style={styles.icon}>🔰</Text>
            <Text style={styles.cardTitle}>Alerta de Seguro</Text>
            <Text style={[styles.cardDangerValue, alertasSeguro.length > 0 && styles.activeInsuranceText]}>
              {alertasSeguro.length > 0
                ? `⏳ ${alertasSeguro[0].diasParaVencer} día${alertasSeguro[0].diasParaVencer === 1 ? "" : "s"}`
                : "Vigente"}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullWidthCard} onPress={() => navigation.navigate("LiveMap")}> 
          <View style={styles.row}>
            <Text style={styles.iconLarge}>📍</Text>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitleLarge}>Tiempo Real</Text>
              <Text style={styles.cardValueLarge}>Monitorear camiones en vivo en el mapa</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.testPanel}>
        <Text style={styles.testPanelTitle}>🛠️ PANEL DE PRUEBAS GPS</Text>
        <Text style={styles.testPanelSubtitle}>Prueba rápida del sistema de alertas y sonidos</Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => triggerAlert("velocidad")}
        >
          <Text style={styles.testButtonText}>Simular Exceso de Velocidad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => triggerAlert("ignicion")}
        >
          <Text style={styles.testButtonText}>Simular Encendido de Motor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => triggerAlert("aceite", 400)}
        >
          <Text style={styles.testButtonText}>Simular Alerta de Aceite (400 KM)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 16, // Lo bajé un poquitico de 18 a 16 para que quepa bien con las dos flechas a los lados
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 25,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#1e293b",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  alertCard: {
    borderColor: "#f87171",
    backgroundColor: "#111827",
  },
  speedAlertCard: {
    borderColor: "#facc15",
    backgroundColor: "#111827",
  },
  insuranceAlertCard: {
    borderColor: "#f43f5e",
    backgroundColor: "#111827",
  },
  activeInsuranceText: {
    color: "#ff1744",
    fontWeight: "bold",
  },
  fullWidthCard: {
    backgroundColor: "#1e293b",
    width: "100%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  iconLarge: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 14,
    color: "#cbd5e1",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  cardTitleLarge: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    color: "#38bdf8",
    fontWeight: "bold",
  },
  cardDangerValue: {
    fontSize: 12,
    color: "#f43f5e",
    fontWeight: "bold",
    textAlign: "center",
  },
  cardValueLarge: {
    fontSize: 13,
    color: "#38bdf8",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 5,
    width: "100%",
  },
  homeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1f2937",
    marginTop: -16,
  },
  homeButtonText: {
    fontSize: 32,
    color: "#00ff40", // Mantiene su verde encendido
    fontWeight: "900",
    includeFontPadding: false,
  },
  logoutButton: {
    backgroundColor: "#1f2937",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: -16, // Lo alineé a la misma altura que el botón izquierdo
  },
 logoutText: {
    color: "#00ff40", // <-- Cambia el color aquí abajo en los estilos
    fontSize: 32,
    fontWeight: "900",
    includeFontPadding: false,
  },
  testPanel: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  testPanelTitle: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  testPanelSubtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 14,
  },
  testButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});