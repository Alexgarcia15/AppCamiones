import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { loginWithCode } = useAuth();
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!clientCode.trim()) {
      Alert.alert("Código requerido", "Por favor, introduce tu código único de cliente.");
      return;
    }

    setLoading(true);
    const authenticated = await loginWithCode(clientCode);
    setLoading(false);

    if (authenticated) {
     navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
      return;
    }

    Alert.alert("Código incorrecto", "Este código de cliente no está registrado en el sistema.");
  };

  const seleccionarCodigoPrueba = (codigo: string) => {
    setClientCode(codigo);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.box}>
        
        {/* 🟢 SOLO APPCAMIONES EN VERDE VIVO, SIN MÁS BASURA ABAJO */}
        <Text style={styles.brandText}>AppCamiones</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: owner-1"
          placeholderTextColor="#94a3b8"
          value={clientCode}
          autoCapitalize="none"
          onChangeText={setClientCode}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Configurando dispositivo..." : "Vincular Celular"}</Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Flotas de prueba (Toca para vincular rápido):</Text>
          
          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarCodigoPrueba("owner-1")}
          >
            <Text style={styles.helpText}>🚛 Juan Pérez — <Text style={styles.codeText}>owner-1</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarCodigoPrueba("owner-2")}
          >
            <Text style={styles.helpText}>🚛 Ana Martínez — <Text style={styles.codeText}>owner-2</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarCodigoPrueba("owner-3")}
          >
            <Text style={styles.helpText}>🚛 Mario López — <Text style={styles.codeText}>owner-3</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  brandText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0ef860", 
    letterSpacing: -1.5, 
    textAlign: "center",
    marginBottom: 28,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0b54f3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#1e293b",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  helpContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 16,
  },
  helpTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  userBadge: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  helpText: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  codeText: {
    color: "#0ef860", 
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});