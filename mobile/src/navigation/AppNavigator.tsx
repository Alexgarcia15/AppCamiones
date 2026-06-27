import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { navigationRef } from "./NavigationService";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TrucksScreen from "../screens/TrucksScreen";
import TruckDetailScreen from "../screens/TruckDetailScreen";
import LiveMapScreen from "../screens/LiveMapScreen";
import AlertsScreen from "../screens/AlertsScreen";
import RouteAlertDetailScreen from "../screens/RouteAlertDetailScreen";
import SpeedAlertDetailScreen from "../screens/SpeedAlertDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0f172a",
  },
};

// 1. ZONA PÚBLICA: Se ve SÓLO la primera vez para registrar el código del dueño
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// 2. ZONA PRIVADA: Entra DIRECTO aquí con un solo toque si ya está el código guardado
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Trucks" component={TrucksScreen} />
      <Stack.Screen name="TruckDetail" component={TruckDetailScreen} />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="RouteAlertDetail" component={RouteAlertDetailScreen} />
      <Stack.Screen name="SpeedAlertDetail" component={SpeedAlertDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Mientras la app lee la memoria del celular, mostramos una pantalla de carga limpia
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0b54f3" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme} ref={navigationRef}>
      {/* Si ya hay un dueño registrado en la memoria, va directo a sus camiones. Si no, pide el código */}
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
});