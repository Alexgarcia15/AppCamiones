import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';

// CONEXIÓN AL PUERTO 3000 DE TU SERVIDOR
const socket = io('http://192.168.100.151:3000'); 

export default function LiveMapScreen() {
    // Estado para guardar la posición del camión
    const [camion, setCamion] = useState<{ latitud: number; longitud: number; velocidad: number } | null>(null);

    useEffect(() => {
        // Escuchamos el IMEI específico que guardamos en la base de datos
        socket.on('camion_352812345678901', (datos) => {
            console.log("🚚 ¡Coordenada recibida en el celular!", datos);
            setCamion({
                latitud: datos.latitud,
                longitud: datos.longitud,
                velocidad: datos.velocidad
            });
        });

        return () => {
            socket.off('camion_352812345678901');
        };
    }, []);

    // Coordenadas iniciales por si el camión no ha reportado (Centro de RD / Haina)
    const regionInicial = {
        latitude: camion ? camion.latitud : 18.4178,
        longitude: camion ? camion.longitud : -70.0219,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View style={styles.container}>
            <MapView style={styles.map} initialRegion={regionInicial}>
                {camion && (
                    <Marker
                        coordinate={{ latitude: camion.latitud, longitude: camion.longitud }}
                        title="Mi Camión Mack"
                        description={`Velocidad: ${camion.velocidad} km/h`}
                    />
                )}
            </MapView>
            
            {/* Letrero flotante para ver la velocidad en vivo */}
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    {camion ? `Velocidad en vivo: ${camion.velocidad} km/h` : "Esperando señal del camión..."}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    infoBox: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    infoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});