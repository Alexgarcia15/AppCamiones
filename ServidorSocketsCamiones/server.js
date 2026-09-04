const net = require('net');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',
    password: 'Hector1557',
    port: 5432,
    max: 50,
    idleTimeoutMillis: 30000
});

// ==================== AUTENTICACION DE LA API ====================
async function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Falta el token de acceso' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const resultado = await pool.query(
            'SELECT owner_id, nombre FROM duenos WHERE LOWER(token) = LOWER($1) AND activo = true',
            [token]
        );
        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Token invalido' });
        }
        req.dueno = resultado.rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error de servidor' });
    }
}

app.get('/api/mi-perfil', verificarToken, (req, res) => {
    res.json({ ownerId: req.dueno.owner_id, nombre: req.dueno.nombre });
});

app.get('/api/mis-camiones', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM camiones WHERE owner_id = $1',
            [req.dueno.owner_id]
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo camiones' });
    }
});

// ==================== APAGADO REMOTO DEL CAMION ====================
// Guardamos aqui la conexion TCP activa de cada camion GT06, usando su IMEI como llave.
// Asi, cuando alguien pida apagar un camion desde la app, sabemos por cual conexion
// mandarle el comando (solo funciona si el camion esta conectado/con señal en ese momento).
const conexionesGT06 = new Map();

let serialComando = 1;
function proximoSerial() {
    serialComando = (serialComando + 1) % 0xffff;
    return serialComando;
}

// Construye el paquete binario GT06 para mandar un comando de texto al dispositivo
// (por ejemplo, para cortar el motor via el rele). Formato basado en el protocolo
// estandar GT06/Concox para el comando 0x80 (comando personalizado).
// NOTA: esto todavia no se ha probado con hardware real. Cuando llegue el GPS
// Concox GT06N, es probable que haya que ajustar detalles finos segun su manual.
function construirComandoGT06(comandoTexto, serial) {
    const comandoBuffer = Buffer.from(comandoTexto, 'ascii');
    const banderaServidor = Buffer.from([0x00, 0x00, 0x00, 0x01]);

    const contenido = Buffer.concat([
        Buffer.from([comandoBuffer.length]),
        comandoBuffer,
        banderaServidor,
    ]);

    const cuerpo = Buffer.concat([
        Buffer.from([0x80]),
        contenido,
        Buffer.from([(serial >> 8) & 0xff, serial & 0xff]),
    ]);

    const longitudPaquete = cuerpo.length + 2; // +2 por el CRC que va despues
    const crc = crc16Itu(Buffer.concat([Buffer.from([longitudPaquete]), cuerpo]));

    return Buffer.concat([
        Buffer.from([0x78, 0x78]),
        Buffer.from([longitudPaquete]),
        cuerpo,
        Buffer.from([(crc >> 8) & 0xff, crc & 0xff]),
        Buffer.from([0x0d, 0x0a]),
    ]);
}

app.post('/api/apagar-camion', verificarToken, async (req, res) => {
    const { imei } = req.body;
    if (!imei) {
        return res.status(400).json({ error: 'Falta el IMEI del camion' });
    }

    try {
        // Confirmamos que el camion realmente pertenece a este dueño (seguridad:
        // que nadie pueda apagar el camion de otro dueño mandando cualquier IMEI)
        const camionResultado = await pool.query(
            'SELECT owner_id, velocidad FROM camiones WHERE imei = $1',
            [imei]
        );

        if (camionResultado.rows.length === 0) {
            return res.status(404).json({ error: 'Camion no encontrado' });
        }

        if (camionResultado.rows[0].owner_id !== req.dueno.owner_id) {
            return res.status(403).json({ error: 'Este vehículo no te pertenece' });
        }

        const socketGPS = conexionesGT06.get(imei);
        if (!socketGPS) {
            return res.status(404).json({ error: 'El camion no esta conectado ahora mismo. Intenta cuando tenga señal.' });
        }

        const comando = construirComandoGT06('DYD,000000#', proximoSerial());
        socketGPS.write(comando);

        console.log(`🔴 Comando de apagado enviado al camion IMEI: ${imei} (dueño: ${req.dueno.owner_id})`);
        res.json({ ok: true, mensaje: 'Comando de apagado enviado al camion' });
    } catch (error) {
        console.log(`❌ Error enviando comando de apagado: ${error.message}`);
        res.status(500).json({ error: 'Error de servidor enviando el comando' });
    }
});

// ==================== FUNCION COMPARTIDA: GUARDAR Y NOTIFICAR ====================
async function actualizarYNotificar(imei, latitud, longitud, velocidad) {
    try {
        const resultadoCamion = await pool.query(
            'UPDATE camiones SET latitud = $1, longitud = $2, velocidad = $3 WHERE imei = $4 RETURNING owner_id',
            [latitud, longitud, velocidad, imei]
        );

        await pool.query(
            `INSERT INTO historial_ubicaciones (imei_camion, latitud, longitud, velocidad, fecha_reporte)
             VALUES ($1, $2, $3, $4, $5)`,
            [imei, latitud, longitud, velocidad, new Date()]
        );

        if (resultadoCamion.rows.length > 0) {
            const ownerId = resultadoCamion.rows[0].owner_id;
            io.to(ownerId).emit(`camion_${imei}`, { imei, latitud, longitud, velocidad });
            console.log(`💾 Ubicación actualizada y enviada a la sala de "${ownerId}"`);
        } else {
            console.log(`⚠️ IMEI ${imei} no está registrado a ningún dueño`);
        }
    } catch (error) {
        console.log(`❌ Error de Base de Datos: ${error.message}`);
    }
}

// ==================== TRADUCTOR COBAN (protocolo de texto) ====================
function procesarTramaCoban(tramaCruda) {
    if (!tramaCruda || !tramaCruda.includes('imei:')) return null;
    const partes = tramaCruda.split(',');
    const imei = partes[1].replace('##,imei:', '').replace('imei:', '');
    if (partes[2] !== 'A') return null;
    const latitudRaw = partes[6];
    const direccionLat = partes[7];
    const longitudRaw = partes[8];
    const direccionLon = partes[9];
    let latitud = convertirADecimal(latitudRaw, direccionLat);
    let longitud = convertirADecimal(longitudRaw, direccionLon);
    const velocidad = parseFloat(partes[10]) * 1.852;
    return {
        imei: imei,
        latitud: latitud,
        longitud: longitud,
        velocidad: Math.round(velocidad),
        fecha_reporte: new Date()
    };
}

function convertirADecimal(coordenada, direccion) {
    if (!coordenada) return 0;
    const puntoIdx = coordenada.indexOf('.');
    const grados = parseFloat(coordenada.substring(0, puntoIdx - 2));
    const minutes = parseFloat(coordenada.substring(puntoIdx - 2));
    let decimal = grados + (minutes / 60);
    if (direccion === 'S' || direccion === 'W') decimal = decimal * -1;
    return parseFloat(decimal.toFixed(6));
}

// ==================== TRADUCTOR GT06 (protocolo binario del Concox) ====================
const TABLA_CRC = [
    0x0000,0x1189,0x2312,0x329b,0x4624,0x57ad,0x6536,0x74bf,
    0x8c48,0x9dc1,0xaf5a,0xbed3,0xca6c,0xdbe5,0xe97e,0xf8f7,
    0x1081,0x0108,0x3393,0x221a,0x56a5,0x472c,0x75b7,0x643e,
    0x9cc9,0x8d40,0xbfdb,0xae52,0xdaed,0xcb64,0xf9ff,0xe876,
    0x2102,0x308b,0x0210,0x1399,0x6726,0x76af,0x4434,0x55bd,
    0xad4a,0xbcc3,0x8e58,0x9fd1,0xeb6e,0xfae7,0xc87c,0xd9f5,
    0x3183,0x200a,0x1291,0x0318,0x77a7,0x662e,0x54b5,0x453c,
    0xbdcb,0xac42,0x9ed9,0x8f50,0xfbef,0xea66,0xd8fd,0xc974,
    0x4204,0x538d,0x6116,0x709f,0x0420,0x15a9,0x2732,0x36bb,
    0xce4c,0xdfc5,0xed5e,0xfcd7,0x8868,0x99e1,0xab7a,0xbaf3,
    0x5285,0x430c,0x7197,0x601e,0x14a1,0x0528,0x37b3,0x263a,
    0xdecd,0xcf44,0xfddf,0xec56,0x98e9,0x8960,0xbbfb,0xaa72,
    0x6306,0x728f,0x4014,0x519d,0x2522,0x34ab,0x0630,0x17b9,
    0xef4e,0xfec7,0xcc5c,0xddd5,0xa96a,0xb8e3,0x8a78,0x9bf1,
    0x7387,0x620e,0x5095,0x411c,0x35a3,0x242a,0x16b1,0x0738,
    0xffcf,0xee46,0xdcdd,0xcd54,0xb9eb,0xa862,0x9af9,0x8b70,
    0x8408,0x9581,0xa71a,0xb693,0xc22c,0xd3a5,0xe13e,0xf0b7,
    0x0840,0x19c9,0x2b52,0x3adb,0x4e64,0x5fed,0x6d76,0x7cff,
    0x9489,0x8500,0xb79b,0xa612,0xd2ad,0xc324,0xf1bf,0xe036,
    0x18c1,0x0948,0x3bd3,0x2a5a,0x5ee5,0x4f6c,0x7df7,0x6c7e,
    0xa50a,0xb483,0x8618,0x9791,0xe32e,0xf2a7,0xc03c,0xd1b5,
    0x2942,0x38cb,0x0a50,0x1bd9,0x6f66,0x7eef,0x4c74,0x5dfd,
    0xb58b,0xa402,0x9699,0x8710,0xf3af,0xe226,0xd0bd,0xc134,
    0x39c3,0x284a,0x1ad1,0x0b58,0x7fe7,0x6e6e,0x5cf5,0x4d7c,
    0xc60c,0xd785,0xe51e,0xf497,0x8028,0x91a1,0xa33a,0xb2b3,
    0x4a44,0x5bcd,0x6956,0x78df,0x0c60,0x1de9,0x2f72,0x3efb,
    0xd68d,0xc704,0xf59f,0xe416,0x90a9,0x8120,0xb3bb,0xa232,
    0x5ac5,0x4b4c,0x79d7,0x685e,0x1ce1,0x0d68,0x3ff3,0x2e7a,
    0xe70e,0xf687,0xc41c,0xd595,0xa12a,0xb0a3,0x8238,0x93b1,
    0x6b46,0x7acf,0x4854,0x59dd,0x2d62,0x3ceb,0x0e70,0x1ff9,
    0xf78f,0xe606,0xd49d,0xc514,0xb1ab,0xa022,0x92b9,0x8330,
    0x7bc7,0x6a4e,0x58d5,0x495c,0x3de3,0x2c6a,0x1ef1,0x0f78
];

function crc16Itu(buffer) {
    let fcs = 0xffff;
    for (let i = 0; i < buffer.length; i++) {
        fcs = (fcs >> 8) ^ TABLA_CRC[(fcs ^ buffer[i]) & 0xff];
    }
    return (~fcs) & 0xffff;
}

function construirRespuestaGT06(protocolo, serial) {
    const cuerpo = Buffer.from([0x05, protocolo, (serial >> 8) & 0xff, serial & 0xff]);
    const crc = crc16Itu(cuerpo);
    return Buffer.concat([
        Buffer.from([0x78, 0x78]),
        cuerpo,
        Buffer.from([(crc >> 8) & 0xff, crc & 0xff]),
        Buffer.from([0x0d, 0x0a])
    ]);
}

function procesarPaqueteGT06(buffer) {
    if (buffer.length < 12 || buffer[0] !== 0x78 || buffer[1] !== 0x78) return null;

    const protocolo = buffer[3];
    const serial = buffer.readUInt16BE(buffer.length - 6);

    if (protocolo === 0x01) {
        const imeiBytes = buffer.slice(4, 12);
        let imei = '';
        for (const byte of imeiBytes) {
            imei += byte.toString(16).padStart(2, '0');
        }
        imei = imei.replace(/^0/, '');
        return { tipo: 'login', imei, respuesta: construirRespuestaGT06(0x01, serial) };
    }

    if (protocolo === 0x12) {
        const contenido = buffer.slice(4, buffer.length - 6);
        const latitudRaw = contenido.readUInt32BE(7);
        const longitudRaw = contenido.readUInt32BE(11);
        const velocidad = contenido[15];
        const cursoEstado = contenido.readUInt16BE(16);

        let latitud = latitudRaw / 30000 / 60;
        let longitud = longitudRaw / 30000 / 60;

        const esNorte = (cursoEstado & 0x0400) !== 0;
        const esOeste = (cursoEstado & 0x0800) !== 0;

        if (!esNorte) latitud = -latitud;
        if (esOeste) longitud = -longitud;

        return {
            tipo: 'ubicacion',
            latitud: parseFloat(latitud.toFixed(6)),
            longitud: parseFloat(longitud.toFixed(6)),
            velocidad,
        };
    }

    if (protocolo === 0x13) {
        return { tipo: 'heartbeat', respuesta: construirRespuestaGT06(0x13, serial) };
    }

    return { tipo: 'desconocido' };
}

// ==================== SOCKET.IO: SALAS PRIVADAS POR DUEÑO ====================
io.on('connection', (socket) => {
    socket.on('autenticar', async (token) => {
        try {
            const resultado = await pool.query(
                'SELECT owner_id FROM duenos WHERE token = $1 AND activo = true',
                [token]
            );
            if (resultado.rows.length > 0) {
                const ownerId = resultado.rows[0].owner_id;
                socket.join(ownerId);
                socket.emit('autenticado', { ok: true });
                console.log(`🔑 Dueño "${ownerId}" conectado a su sala privada`);
            } else {
                socket.emit('autenticado', { ok: false });
            }
        } catch (e) {
            socket.emit('autenticado', { ok: false });
        }
    });
});

// ==================== RECEPTOR 1: PROTOCOLO COBAN (Puerto 5001) ====================
const tcpServerCoban = net.createServer((socket) => {
    socket.on('data', async (data) => {
        const tramaCruda = data.toString().trim();
        const datosCamion = procesarTramaCoban(tramaCruda);
        if (datosCamion) {
            console.log(`\n⚡ [COBAN] Camión IMEI: ${datosCamion.imei}`);
            await actualizarYNotificar(datosCamion.imei, datosCamion.latitud, datosCamion.longitud, datosCamion.velocidad);
        }
    });
    socket.on('error', () => {});
});

tcpServerCoban.listen(5001, () => {
    console.log('🚀 RECEPTOR COBAN LISTO [Puerto 5001]');
});

// ==================== RECEPTOR 2: PROTOCOLO GT06 / CONCOX (Puerto 5002) ====================
const tcpServerGT06 = net.createServer((socket) => {
    let imeiDeEstaConexion = null;

    socket.on('data', async (data) => {
        try {
            const paquete = procesarPaqueteGT06(data);
            if (!paquete) return;

            if (paquete.tipo === 'login') {
                imeiDeEstaConexion = paquete.imei;
                console.log(`\n🔐 [GT06] Login recibido, IMEI: ${paquete.imei}`);
                socket.write(paquete.respuesta);
                // Guardamos esta conexion para poder mandarle comandos despues (ej. apagado)
                conexionesGT06.set(paquete.imei, socket);
            } else if (paquete.tipo === 'ubicacion' && imeiDeEstaConexion) {
                console.log(`⚡ [GT06] Ubicación de IMEI: ${imeiDeEstaConexion}`);
                await actualizarYNotificar(imeiDeEstaConexion, paquete.latitud, paquete.longitud, paquete.velocidad);
            } else if (paquete.tipo === 'heartbeat') {
                socket.write(paquete.respuesta);
            }
        } catch (error) {
            console.log(`❌ Error procesando paquete GT06: ${error.message}`);
        }
    });

    socket.on('close', () => {
        // Si esta conexion se cierra, la quitamos de la lista de conexiones activas
        if (imeiDeEstaConexion && conexionesGT06.get(imeiDeEstaConexion) === socket) {
            conexionesGT06.delete(imeiDeEstaConexion);
        }
    });

    socket.on('error', () => {});
});

tcpServerGT06.listen(5002, () => {
    console.log('🛰️  RECEPTOR GT06 (CONCOX) LISTO [Puerto 5002]');
});

server.listen(3000, () => {
    console.log('🌐 API + WEBSOCKETS SEGUROS [Puerto 3000]');
});