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
      <View style={styles.brandBlock}>
        <Text style={styles.brandText}>HECGAR GPS</Text>
        <View style={styles.brandUnderline} />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/camion_frente.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.imageFrameAccent} />
      </View>

      <Text style={styles.subtitle}>SISTEMA DE MONITOREO SATELITAL</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleEntrar}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>VER EN TIEMPO REAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const YELLOW = "#FFD500";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandText: {
    fontSize: 34,
    fontWeight: "900",
    color: YELLOW,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(255, 213, 0, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  brandUnderline: {
    width: 64,
    height: 3,
    backgroundColor: YELLOW,
    borderRadius: 2,
    marginTop: 10,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
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
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e5e5e5",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 44,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
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
  buttonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});

export default HomeScreen;
