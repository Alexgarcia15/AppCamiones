import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Aquí importas tu navegador principal. 
// Como tu estructura tiene "mobile/src...", busca dónde está tu navegación
import AppNavigator from "./mobile/src/navigation/AppNavigator";
import { AuthProvider } from "./mobile/src/context/AuthContext";
import { AlertProvider } from "./mobile/src/context/AlertsContext";
import { AlertNotificationComponent } from "./mobile/src/components/AlertNotificationComponent";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Mantenemos el splash screen visible mientras carga
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Carga tus fuentes aquí si las tienes
        // await Font.loadAsync({ ... });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <AppNavigator />
          <AlertNotificationComponent />
        </AlertProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}