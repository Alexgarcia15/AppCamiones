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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "No se pudo desvincular el dispositivo.");
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* ENCABEZADO */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>⟸</Text>
        </TouchableOpacity>
        
        <View style={styles.titleWrapper}>
          <Text style={styles.ownerNameText}>{user?.name ? user.name.split(" ")[0] + " " + (user.name.split(" ")[1] || "") : "Dueño"}</Text>
          <Text style={styles.truckCountSubtitle}>{trucks.length} Camiones</Text>
        </View>
        
        <View style={{ width: 40 }} /> 
      </View>

      <Text style={styles.instructionText}>TOCA UNA FICHA PARA VER EN TIEMPO REAL</Text>

      {/* 🚚 FICHAS DE LOS CAMIONES */}
      <View style={styles.listaCamiones}>
        {trucks.length === 0 ? (
          <Text style={styles.noTrucksText}>No tienes camiones asignados a esta flota.</Text>
        ) : (
          trucks.map((camion: any) => (
            <TouchableOpacity 
              key={camion.id} 
              style={styles.truckCard}
              onPress={() => {
                // 🛡️ CORRECCIÓN DE CRASH: Mandamos el IMEI real del camión para que el mapa no explote
                if (camion.latitud && camion.longitud) {
                  navigation.navigate("LiveMap", { 
                    imei: camion.imei || camion.id, 
                    nombreCamion: `Ficha ${camion.ficha}` 
                  });
                } else {
                  Alert.alert("Error", "Coordenadas GPS no disponibles para esta unidad.");
                }
              }}
            >
              {/* Información del camión a la izquierda */}
              <View style={styles.truckInfoLeft}>
                <Text style={styles.truckIcon}>🚚</Text>
                <View style={styles.textContainer}>
                  <Text style={styles.truckNameText}>Ficha {camion.ficha}</Text>
                  <Text style={styles.truckDetailText} numberOfLines={1}>{camion.marca} {camion.modelo}</Text>
                </View>
              </View>

              {/* 📍 BOTÓN VER MAPA: Arreglado con espacio seguro para que no se salga del celular */}
              <View style={styles.truckStatusRight}>
                <Text style={styles.verMapaText}>Ver mapa 📍</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ALERTAS */}
      <Text style={styles.sectionTitle}>ALERTAS EN VIVO</Text>
      <View style={styles.grid}>
        <View style={[styles.miniCard, alertasFueraRuta.length > 0 && styles.alertCard]}>
          <Text style={styles.miniCardTitle}>🛑 Fuera de Ruta</Text>
          <Text style={styles.miniCardValue}>{alertasFueraRuta.length}</Text>
        </View>

        <View style={[styles.miniCard, alertasVelocidad.length > 0 && styles.speedAlertCard]}>
          <Text style={styles.miniCardTitle}>⚡ Excesos Vel.</Text>
          <Text style={styles.miniCardValue}>{alertasVelocidad.length}</Text>
        </View>
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
    paddingHorizontal: 15, // Más margen interno para proteger los bordes en pantallas chicas
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    width: "100%",
  },
  homeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1f2937",
  },
  homeButtonText: {
    fontSize: 24,
    color: "#f43f5e",
    fontWeight: "900",
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerNameText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
  },
  truckCountSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#38bdf8",
    marginTop: 4,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0ef860", 
    textAlign: "center",
    marginBottom: 20,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  listaCamiones: {
    width: "100%",
    marginBottom: 25,
  },
  truckCard: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    width: "100%", // Obliga a la tarjeta a quedarse dentro del marco
  },
  truckInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Le da control de espacio al texto para que no empuje el botón del mapa
    marginRight: 10,
  },
  textContainer: {
    flex: 1, // Evita que los nombres largos tiren el botón hacia afuera
  },
  truckIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  truckNameText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  truckDetailText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  truckStatusRight: {
    backgroundColor: "#0b54f32b",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0b54f3",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90, // Le da un tamaño fijo seguro para que nunca se mocha
  },
  verMapaText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "bold",
  },
  noTrucksText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
    paddingLeft: 2,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  miniCard: {
    backgroundColor: "#1e293b",
    width: "48%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniCardTitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  miniCardValue: {
    color: "#38bdf8",
    fontWeight: "bold",
    fontSize: 15,
  },
  alertCard: { borderColor: "#f87171", backgroundColor: "#111827" },
  speedAlertCard: { borderColor: "#facc15", backgroundColor: "#111827" },
});