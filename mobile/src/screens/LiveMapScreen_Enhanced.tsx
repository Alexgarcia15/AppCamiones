/**
 * LIVE MAP SCREEN - MEJORADO CON MONITOREO MULTI-ESTADO
 * Muestra camiones con estados en tiempo real (Corriendo, Detenido, Apagado, etc.)
 * + Panel de control para seleccionar y enfocar camión
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Modal,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  obtenerAlertasFueraDeRuta,
  obtenerAlertasVelocidad,
  Camion,
} from "../utils/routeAlertUtils";
import { TruckStateEnum } from "../types/truckTypes";
import { truckStateService } from "../services/remoteShutdownService";

const { width, height } = Dimensions.get("window");

export default function LiveMapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { trucks } = useAuth();

  const [filter, setFilter] = useState<"Todos" | "Fuera" | "Velocidad">("Todos");
  const [selected, setSelected] = useState<Camion | null>(route.params?.camion ?? null);
  const [blinkState, setBlinkState] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [showTruckSelector, setShowTruckSelector] = useState(false);
  const [truckStates, setTruckStates] = useState<
    Record<string, TruckStateEnum>
  >({});

  const PAGE_SIZE = 3;

  const visibleCamiones = useMemo(() => {
    return trucks.slice(0, page * PAGE_SIZE);
  }, [trucks, page]);

  const regionInicial = useMemo(
    () => ({
      latitude: visibleCamiones[0]?.latitud || 18.4148,
      longitude: visibleCamiones[0]?.longitud || -70.0267,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [visibleCamiones]
  );

  // Inicializar monitoreo de estados de camiones
  useEffect(() => {
    trucks.forEach((camion) => {
      truckStateService.startMonitoring(camion.id, {
        ficha: camion.ficha,
        latitude: camion.latitud,
        longitude: camion.longitud,
        currentState: TruckStateEnum.RUNNING,
      });

      // Estado inicial simulado
      setTruckStates((prev) => ({
        ...prev,
        [camion.id]: TruckStateEnum.RUNNING,
      }));
    });

    return () => {
      truckStateService.stopAllMonitoring();
    };
  }, [trucks]);

  // Lógica de parpadeo y actualización de estado
  useEffect(() => {
    const LAT_MIN = 18.36;
    const LAT_MAX = 18.44;
    const LON_MIN = -70.05;
    const LON_MAX = -69.99;
    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));

    const id = setInterval(() => {
      setSelected((prevSelected) =>
        prevSelected
          ? {
              ...prevSelected,
              latitud: clamp(
                prevSelected.latitud + (Math.random() - 0.5) * 0.0004,
                LAT_MIN,
                LAT_MAX
              ),
              longitud: clamp(
                prevSelected.longitud + (Math.random() - 0.5) * 0.0004,
                LON_MIN,
                LON_MAX
              ),
            }
          : prevSelected
      );

      setBlinkState((prev) => {
        const next: Record<string, boolean> = { ...prev };
        visibleCamiones.forEach((c) => {
          const offRoute = obtenerAlertasFueraDeRuta([c]).length > 0;
          const speedAlert = obtenerAlertasVelocidad([c]).length > 0;
          if (offRoute || speedAlert) next[c.id] = !prev[c.id];
        });
        return next;
      });

      // Actualizar estados simulados (rotación entre estados)
      setTruckStates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((truckId) => {
          const states = Object.values(TruckStateEnum);
          const currentState = next[truckId];
          const currentIndex = states.indexOf(currentState);
          // Cambiar estado aleatoriamente cada 30 segundos
          if (Math.random() < 0.1) {
            next[truckId] = states[(currentIndex + 1) % states.length];
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(id);
  }, [visibleCamiones]);

  const alertasFuera = useMemo(
    () => obtenerAlertasFueraDeRuta(visibleCamiones),
    [visibleCamiones]
  );
  const alertasVel = useMemo(
    () => obtenerAlertasVelocidad(visibleCamiones),
    [visibleCamiones]
  );

  const visibles = visibleCamiones.filter((c) => {
    if (filter === "Todos") return true;
    if (filter === "Fuera") return obtenerAlertasFueraDeRuta([c]).length > 0;
    if (filter === "Velocidad") return obtenerAlertasVelocidad([c]).length > 0;
    return true;
  });

  /**
   * Obtener ícono y color según estado del camión
   */
  const getStateIcon = (state: TruckStateEnum): string => {
    switch (state) {
      case TruckStateEnum.RUNNING:
        return "🟢";
      case TruckStateEnum.STOPPED:
        return "🟡";
      case TruckStateEnum.ENGINE_ON:
        return "🟠";
      case TruckStateEnum.ASLEEP:
        return "⚫";
      case TruckStateEnum.PARKED:
        return "🔵";
      case TruckStateEnum.EMERGENCY:
        return "🔴";
      default:
        return "⭕";
    }
  };

  const getStateColor = (state: TruckStateEnum): string => {
    switch (state) {
      case TruckStateEnum.RUNNING:
        return "#22c55e";
      case TruckStateEnum.STOPPED:
        return "#eab308";
      case TruckStateEnum.ENGINE_ON:
        return "#f97316";
      case TruckStateEnum.ASLEEP:
        return "#6b7280";
      case TruckStateEnum.PARKED:
        return "#3b82f6";
      case TruckStateEnum.EMERGENCY:
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const handleSelectTruck = (camion: Camion) => {
    setSelected(camion);
    setShowTruckSelector(false);
  };

  function diasSeguro(camion: Camion): number {
    if (!camion || !camion.fechaVencimientoSeguro) return -1;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fv = new Date(camion.fechaVencimientoSeguro);
    fv.setHours(0, 0, 0, 0);
    return Math.ceil((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>⬅️ Volver</Text>
      </TouchableOpacity>

      {/* FILTROS */}
      <View style={styles.filterContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "Todos" && styles.filterActive,
          ]}
          onPress={() => setFilter("Todos")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "Fuera" && styles.filterActive]}
          onPress={() => setFilter("Fuera")}
        >
          <Text style={styles.filterText}>Fuera de Ruta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "Velocidad" && styles.filterActive,
          ]}
          onPress={() => setFilter("Velocidad")}
        >
          <Text style={styles.filterText}>Exceso Velocidad</Text>
        </TouchableOpacity>
      </View>

      {/* CONTROLES DE PÁGINA */}
      <View style={styles.pageButtons}>
        <TouchableOpacity
          style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
          disabled={page === 1}
          onPress={() => setPage((current) => Math.max(1, current - 1))}
        >
          <Text style={styles.pageButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pageButton}
          onPress={() => setShowTruckSelector(true)}
        >
          <Text style={styles.pageButtonText}>📋 Seleccionar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.pageButton,
            visibleCamiones.length >= trucks.length &&
              styles.pageButtonDisabled,
          ]}
          disabled={visibleCamiones.length >= trucks.length}
          onPress={() => setPage((current) => current + 1)}
        >
          <Text style={styles.pageButtonText}>Más</Text>
        </TouchableOpacity>
      </View>

      {/* MAPA */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={regionInicial}
        customMapStyle={mapStyleOscuroReforzado}
      >
        {alertasFuera.find((a) => a.camion.ficha === "F-02") && (
          <Polyline
            coordinates={rutaF02}
            strokeColor="#f59e0b"
            strokeWidth={4}
          />
        )}

        {visibles.map((c) => {
          const isOff = alertasFuera.some((a) => a.camion.id === c.id);
          const isFast = alertasVel.some((a) => a.camion.id === c.id);
          const blinking = !!blinkState[c.id];
          const currentState = truckStates[c.id] || TruckStateEnum.RUNNING;
          const stateColor = getStateColor(currentState);

          return (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitud, longitude: c.longitud }}
              onPress={() => setSelected(c)}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={[
                    styles.pin,
                    { backgroundColor: stateColor, opacity: blinking ? 0.3 : 1 },
                  ]}
                >
                  <Text style={styles.stateIcon}>{getStateIcon(currentState)}</Text>
                  <Text style={styles.pinText}>{c.ficha}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* CARD DE INFORMACIÓN */}
      {selected && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>
              {selected.ficha} — {selected.marca} {selected.modelo}
            </Text>
            <View
              style={[
                styles.stateBadge,
                {
                  backgroundColor: getStateColor(
                    truckStates[selected.id] || TruckStateEnum.RUNNING
                  ),
                },
              ]}
            >
              <Text style={styles.stateBadgeText}>
                {getStateIcon(truckStates[selected.id] || TruckStateEnum.RUNNING)}{" "}
                {truckStates[selected.id] || TruckStateEnum.RUNNING}
              </Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            Velocidad: {selected.velocidad ?? "N/A"} kph
          </Text>
          <Text style={styles.infoText}>
            Seguro: {diasSeguro(selected) > 0 ? `${diasSeguro(selected)} días` : "Vigente"}
          </Text>

          <View style={styles.infoButtonRow}>
            <TouchableOpacity
              style={[styles.infoButton, styles.detailsButton]}
              onPress={() => navigation.navigate("TruckDetail", { camion: selected })}
            >
              <Text style={styles.infoButtonText}>📋 Detalles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.infoButton, styles.closeButton]}
              onPress={() => setSelected(null)}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL DE SELECTOR DE CAMIÓN */}
      <Modal
        visible={showTruckSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTruckSelector(false)}
      >
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <Text style={styles.selectorTitle}>Seleccionar Camión</Text>

            <FlatList
              data={trucks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectorItem}
                  onPress={() => handleSelectTruck(item)}
                >
                  <View style={styles.selectorItemIcon}>
                    <Text style={styles.selectorItemIconText}>
                      {getStateIcon(
                        truckStates[item.id] || TruckStateEnum.RUNNING
                      )}
                    </Text>
                  </View>
                  <View style={styles.selectorItemInfo}>
                    <Text style={styles.selectorItemFicha}>{item.ficha}</Text>
                    <Text style={styles.selectorItemDetails}>
                      {item.marca} {item.modelo} • {item.estado}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.selectorCloseButton}
              onPress={() => setShowTruckSelector(false)}
            >
              <Text style={styles.selectorCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LEYENDA DE ESTADOS */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟢</Text>
          <Text style={styles.legendText}>Corriendo</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟡</Text>
          <Text style={styles.legendText}>Detenido</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>⚫</Text>
          <Text style={styles.legendText}>Apagado</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🔴</Text>
          <Text style={styles.legendText}>Emergencia</Text>
        </View>
      </View>
    </View>
  );
}

const rutaF02 = [
  { latitude: 18.4350, longitude: -70.038 },
  { latitude: 18.428, longitude: -70.036 },
  { latitude: 18.422, longitude: -70.0335 },
  { latitude: 18.418, longitude: -70.031 },
  { latitude: 18.414, longitude: -70.028 },
];

const mapStyleOscuroReforzado: any[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  backButton: {
    padding: 12,
    zIndex: 10,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  filterContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterBtn: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterActive: {
    borderColor: "#2563eb",
    backgroundColor: "#1e293b",
  },
  filterText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 12,
  },
  pageButtons: {
    position: "absolute",
    top: 140,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  pageButton: {
    backgroundColor: "#111827",
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flex: 1,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: "#f8fafc",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  map: {
    width,
    height,
  },
  pin: {
    width: 66,
    height: 66,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  stateIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  pinText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  infoCard: {
    position: "absolute",
    bottom: 24,
    left: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 5,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  stateBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  stateBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 11,
  },
  infoText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 4,
  },
  infoButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  infoButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  detailsButton: {
    backgroundColor: "#2563eb",
  },
  closeButton: {
    backgroundColor: "#334155",
  },
  infoButtonText: {
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 12,
  },
  closeText: {
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 12,
  },
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  selectorContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#111827",
    borderRadius: 12,
    marginBottom: 10,
  },
  selectorItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectorItemIconText: {
    fontSize: 20,
  },
  selectorItemInfo: {
    flex: 1,
  },
  selectorItemFicha: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectorItemDetails: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  selectorCloseButton: {
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  selectorCloseText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  legendContainer: {
    position: "absolute",
    bottom: 280,
    left: 12,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    color: "#cbd5e1",
    fontSize: 12,
  },
});
