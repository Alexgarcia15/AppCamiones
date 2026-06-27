import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';

// CONEXIÓN AL PUERTO 3000 DE TU SERVIDOR
const socket = io('http://192.168.100.151:3000');

export default function LiveMapScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();

    const imei = route?.params?.imei || '352812345678901';
    const nombreCamion = route?.params?.nombreCamion || 'Camión General';

    const [camion, setCamion] = useState<{ latitud: number; longitud: number; velocidad: number }>({
        latitud: 18.4861,
        longitud: -69.9312,
        velocidad: 0,
    });
    const [tieneSenal, setTieneSenal] = useState(false);

    useEffect(() => {
        const eventoSocket = `camion_${imei}`;
        console.log(`📡 Escuchando en vivo el canal de socket: ${eventoSocket}`);

        socket.on(eventoSocket, (datos) => {
            if (datos && datos.latitud && datos.longitud) {
                console.log(`🚚 ¡Coordenada recibida para ${nombreCamion}!`, datos);
                setCamion({
                    latitud: Number(datos.latitud),
                    longitud: Number(datos.longitud),
                    velocidad: datos.velocidad || 0,
                });
                setTieneSenal(true);
            }
        });

        return () => {
            socket.off(eventoSocket);
        };
    }, [imei, nombreCamion]);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: camion.latitud,
                    longitude: camion.longitud,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                region={{
                    latitude: camion.latitud,
                    longitude: camion.longitud,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={{ latitude: camion.latitud, longitude: camion.longitud }}
                    title={nombreCamion}
                    description={`Velocidad: ${camion.velocidad} km/h`}
                />
            </MapView>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>⬅ Volver al Listado</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <Text style={styles.truckName}>{nombreCamion}</Text>
                <Text style={styles.infoText}>
                    {tieneSenal ? `Velocidad: ${camion.velocidad} km/h` : "Esperando señal GPS..."}
                </Text>
                <Text style={styles.imeiText}>IMEI: {imei}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    map: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#475569',
    },
    backButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    infoBox: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0b54f3',
    },
    truckName: {
        color: '#9cbbfe',
        fontWeight: '900',
        fontSize: 18,
        marginBottom: 4,
    },
    infoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 4,
    },
    imeiText: {
        color: '#64748b',
        fontSize: 12,
    },
});