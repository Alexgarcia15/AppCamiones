import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

function HomeScreen() {
  const navigation = useNavigation<any>(); 

  return (
    <View style={styles.container}>
      
      {/* SECCIÓN DEL LOGO/ICONO DE LA APP (ARRIBA DEL TODO) */}
      <Image
        source={require('../../../assets/icon.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      {/* TÍTULO EN AZUL INTENSO - ENCIIMA DE LA IMAGEN */}
      <Text style={styles.titleTop}>AppCamiones</Text>
      
      {/* --- CABECERA CON LA IMAGEN GRANDE DEL FRENTE --- */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/camion_frente.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      {/* SUBTÍTULO ABAJO DE LA IMAGEN */}
      <Text style={styles.subtitle}>Plataforma Satelital de Monitoreo y Gestión de Flota de camiones</Text>

      {/* Espacio para los botones */}
      <View style={styles.buttonContainer}>
        
        {/* Botón para ir al Dashboard */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>🔐 Iniciar Sesión</Text>
        </TouchableOpacity>

        {/* Botón para ir al Mapa */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>📍 Pasar a la flota</Text>
        </TouchableOpacity>

        {/* Botón directo a Alertas */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>⚠️ Ver Alertas de Ruta</Text>
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
    padding: 20 // Se aumentó un poco para que no quede pegado a los bordes del celular
  },
  logoImage: {
    width: 80,         // Tamaño ideal para que se vea como un logo arriba
    height: 80,
    marginBottom: 10,  // Espacio pequeño entre el icono y el texto de abajo
  },
  imageContainer: {
    width: '100%',
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden',
    marginBottom: 30, 
    backgroundColor: '#1e293b',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  titleTop: {
    fontSize: 40,          
    fontWeight: "900",      
    letterSpacing: 1,      
    marginBottom: 40, // Espacio entre las letras y el camión
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
    gap: 15, 
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