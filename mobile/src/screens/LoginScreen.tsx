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
        <View style={styles.imageFrameAccent} />
      </View>

      <View style={styles.box}>
        <TextInput
          style={styles.input}
          placeholder="Codigo de acceso"
          placeholderTextColor="#7a7a7a"
          value={clientCode}
          autoCapitalize="none"
          onChangeText={setClientCode}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, loading && styles.buttonTextDisabled]}>
            {loading ? "VERIFICANDO..." : "ACTIVAR"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const YELLOW = "#FFD500";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    padding: 24,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: YELLOW,
    shadowColor: YELLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageFrameAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: YELLOW,
  },
  box: {
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: YELLOW,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  input: {
    backgroundColor: "#000000",
    color: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4d4d4d",
    fontSize: 16,
  },
  button: {
    backgroundColor: YELLOW,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: YELLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#1a1a1a",
    borderColor: YELLOW,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.8,
  },
  buttonTextDisabled: {
    color: YELLOW,
  },
});
