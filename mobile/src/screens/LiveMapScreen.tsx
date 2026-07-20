import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { useAuth, API_BASE_URL } from '../context/AuthContext';

const socket = io(API_BASE_URL);

export default function LiveMapScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { user } = useAuth();

    const camionParam = route?.params?.camion;
    const imei = camionParam?.imei || '352812345678901';
    const nombreCamion = camionParam ? `${camionParam.ficha} - ${camionParam.marca}` : 'Camión General';

    const [camion, setCamion] = useState<{ latitud: number; longitud: number; velocidad: number }>({
        latitud: camionParam?.latitud || 18.4861,
        longitud: camionParam?.longitud || -69.9312,
        velocidad: camionParam?.velocidad || 0,
    });

    const [tieneSenal, setTieneSenal] = useState(false);
    const [autenticado, setAutenticado] = useState(false);
    const [apagando, setApagando] = useState(false);

    useEffect(() => {
        if (!user?.token) return;

        // Nos autenticamos con nuestro token para entrar a nuestra sala privada
        socket.emit('autenticar', user.token);

        socket.on('autenticado', (respuesta) => {
            setAutenticado(respuesta.ok);
            console.log(respuesta.ok ? '🔑 Autenticado en el servidor' : '❌ Token rechazado');
        });

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
            socket.off('autenticado');
        };
    }, [imei, nombreCamion, user?.token]);

    const camionDetenido = camion.velocidad === 0;

    const confirmarApagado = () => {
        Alert.alert(
            'Apagar camión',
            `¿Seguro que quieres apagar el motor de ${nombreCamion}? El camión no podrá volver a encender hasta que lo actives de nuevo desde la app.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, apagar', style: 'destructive', onPress: ejecutarApagado },
            ]
        );
    };

    const ejecutarApagado = async () => {
        if (!user?.token) return;
        setApagando(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/apagar-camion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ imei }),
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert('Comando enviado', 'La orden de apagado fue enviada al camión.');
            } else {
                Alert.alert('No se pudo apagar', data.error || 'Intenta de nuevo en unos segundos.');
            }
        } catch (error) {
            Alert.alert('Error de conexión', 'No se pudo contactar al servidor.');
        }
        setApagando(false);
    };

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

            <TouchableOpacity
                style={[styles.apagarButton, (!camionDetenido || apagando) && styles.apagarButtonDisabled]}
                onPress={confirmarApagado}
                disabled={!camionDetenido || apagando}
            >
                <Text style={styles.apagarButtonText}>
                    {apagando ? 'ENVIANDO...' : 'APAGAR'}
                </Text>
            </TouchableOpacity>
            {!camionDetenido && (
                <Text style={styles.avisoText}>Solo se puede apagar con el camión detenido</Text>
            )}

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
    apagarButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#ef4444',
    },
    apagarButtonDisabled: {
        borderColor: '#475569',
        opacity: 0.6,
    },
    apagarButtonText: {
        color: '#ef4444',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    avisoText: {
        position: 'absolute',
        top: 92,
        right: 20,
        maxWidth: 160,
        color: '#94a3b8',
        fontSize: 10,
        textAlign: 'right',
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
