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
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    const authenticated = await login(username, password);
    setLoading(false);

    if (authenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
      return;
    }

    Alert.alert("Error de autenticación", "Usuario o contraseña incorrectos.");
  };

  // Función rápida para autocompletar los campos de prueba
  const seleccionarUsuarioPrueba = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Inicio de Sesión</Text>
        <Text style={styles.subtitle}>Accede solo a tus camiones y alertas</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#94a3b8"
          value={username}
          autoCapitalize="none"
          onChangeText={setUsername}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#94a3b8"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Verificando..." : "Ingresar"}</Text>
        </TouchableOpacity>

        {/* Sección de usuarios de prueba interactivos */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Usuarios de prueba (Toca para rellenar):</Text>
          
          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarUsuarioPrueba("juan", "1234")}
          >
            <Text style={styles.helpText}>🚚 Juan — <Text style={styles.codeText}>juan / 1234</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarUsuarioPrueba("ana", "abcd")}
          >
            <Text style={styles.helpText}>🚚 Ana — <Text style={styles.codeText}>ana / abcd</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userBadge} 
            onPress={() => seleccionarUsuarioPrueba("mario", "pass")}
          >
            <Text style={styles.helpText}>🚚 Mario — <Text style={styles.codeText}>mario / pass</Text></Text>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 24,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#4453f86b",
    color: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0ef860",
  },
  button: {
    backgroundColor: "#2563eb",
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
    padding: 10,
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
    color: "#38bdf8",
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});