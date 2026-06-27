import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const handleEntrar = () => {
    if (user) {
      navigation.navigate('Dashboard');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.titleTop}>AppCamiones</Text>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/camion_frente.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.subtitle}>Plataforma Satelital de Monitoreo y Gestión de Flota de camiones</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleEntrar}>
          <Text style={styles.buttonText}>🚚 Entrar a la flota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    marginTop: 30,
    backgroundColor: '#1e293b',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  titleTop: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#9cbbfe",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: "#0b54f3",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;