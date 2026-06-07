import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function RouteAlertDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { alerta } = route.params || {};

  if (!alerta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontró la alerta seleccionada.</Text>
      </View>
    );
  }

  const region = {
    latitude: alerta.coordenadas.latitude,
    longitude: alerta.coordenadas.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>⬅️ Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Alerta: Fuera de Ruta</Text>
      <Text style={styles.subtitle}>{alerta.mensaje}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ficha Técnica del Camión</Text>
        <Text style={styles.detailText}>Unidad: <Text style={styles.bold}>{alerta.camion.ficha}</Text></Text>
        <Text style={styles.detailText}>Marca: <Text style={styles.bold}>{alerta.camion.marca}</Text></Text>
        <Text style={styles.detailText}>Modelo: <Text style={styles.bold}>{alerta.camion.modelo}</Text></Text>
        <Text style={styles.detailText}>Año: <Text style={styles.bold}>{alerta.camion.año}</Text></Text>
        <Text style={styles.detailText}>Kilometraje: <Text style={styles.bold}>{alerta.camion.kilometraje}</Text></Text>
        <Text style={styles.detailText}>Estado: <Text style={styles.bold}>{alerta.camion.estado}</Text></Text>
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.cardTitle}>Mapa de Desvío</Text>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
        >
          <Marker
            coordinate={alerta.coordenadas}
            title={`${alerta.camion.ficha} - Desvío`}
            description={`${alerta.direccion} | ${alerta.carretera}`}
          />
        </MapView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ubicación Exacta</Text>
        <Text style={styles.detailText}>Calle / tramo: <Text style={styles.bold}>{alerta.direccion}</Text></Text>
        <Text style={styles.detailText}>Carretera / Autopista: <Text style={styles.bold}>{alerta.carretera}</Text></Text>
        <Text style={styles.detailText}>Fecha de alerta: <Text style={styles.bold}>{new Date(alerta.fecha).toLocaleString()}</Text></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  errorText: { color: "#f8fafc", fontSize: 16 },
  backButton: { marginTop: 50, marginLeft: 20, marginBottom: 20 },
  backButtonText: { color: "#38bdf8", fontSize: 15, fontWeight: "600" },
  title: { color: "#f87171", fontSize: 26, fontWeight: "bold", marginHorizontal: 20, marginBottom: 6 },
  subtitle: { color: "#cbd5e1", fontSize: 14, marginHorizontal: 20, marginBottom: 20 },
  card: { backgroundColor: "#1e293b", marginHorizontal: 20, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#334155", marginBottom: 18 },
  mapCard: { backgroundColor: "#1e293b", marginHorizontal: 20, borderRadius: 14, padding: 0, borderWidth: 1, borderColor: "#334155", overflow: "hidden", marginBottom: 18 },
  cardTitle: { color: "#38bdf8", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  detailText: { color: "#e2e8f0", fontSize: 14, lineHeight: 22, marginBottom: 7 },
  bold: { color: "#ffffff", fontWeight: "700" },
  map: { width: "100%", height: 260 },
});
