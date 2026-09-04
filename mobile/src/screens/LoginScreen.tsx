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
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { loginWithCode } = useAuth();
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!clientCode.trim()) {
      Alert.alert("Codigo requerido", "Introduce tu codigo de acceso.");
      return;
    }
    setLoading(true);
    const authenticated = await loginWithCode(clientCode.trim());
    setLoading(false);
    if (!authenticated) {
      Alert.alert("Codigo incorrecto", "Este codigo no esta registrado.");
    }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/camion_frente.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="Codigo de acceso"
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
          <Text style={styles.buttonText}>{loading ? "Verificando..." : "Activar"}</Text>
        </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  headerImage: {
    width: '100%',
    height: '100%',
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
});