import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AppNavigator from "./mobile/src/navigation/AppNavigator";
import { AuthProvider } from "./mobile/src/context/AuthContext";
// Conectamos las nuevas piezas de las alertas
import { AlertProvider } from "./mobile/src/context/AlertsContext";
import { AlertNotificationComponent } from "./mobile/src/components/AlertNotificationComponent";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <View style={styles.shell}>
            <View style={styles.header}>
              <Text style={styles.title}>App_Camiones</Text>
              
            </View>

            <View style={styles.content}>
              <AppNavigator />
            </View>

            <Pressable style={styles.fab} android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
              <Text style={styles.fabLabel}>+</Text>
            </Pressable>

            <AlertNotificationComponent />
          </View>
        </AlertProvider>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#09121f",
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#0f1b2c",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#FFD700",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    color: "#a3b3c6",
    marginTop: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: "#0d1724",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f8cff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
  },
});




