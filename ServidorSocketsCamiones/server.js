const net = require('net'); 
const http = require('http').createServer();
const io = require('socket.io')(http, { cors: { origin: "*" } }); 
const { Pool } = require('pg'); // El conector de Postgres

// CONFIGURACIÓN DE TU BASE DE DATOS (FLEET_SISTEM)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',   // <--- Apuntando a tu base de datos real
    password: 'Hector1557',            // <--- Probando con la clave 1234 primero
    port: 5432,
    max: 50, 
    idleTimeoutMillis: 30000
});

// TRADUCTOR COBAN
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

// 1. RECEPTOR TCP (Puerto 5001)
const tcpServer = net.createServer((socket) => {
    socket.on('data', async (data) => {
        const tramaCruda = data.toString().trim();
        const datosCamion = procesarTramaCoban(tramaCruda);

        if (datosCamion) {
            console.log(`\n⚡ [PROCESADO] Camión IMEI: ${datosCamion.imei}`);
            
            // INTENTO DE GUARDADO EN TU BASE DE DATOS
            try {
                const query = `
                    INSERT INTO historial_ubicaciones (imei_camion, latitud, longitud, velocidad, fecha_reporte)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                const valores = [
                    datosCamion.imei, 
                    datosCamion.latitud, 
                    datosCamion.longitud, 
                    datosCamion.velocidad, 
                    datosCamion.fecha_reporte
                ];
                
                await pool.query(query, valores);
                console.log(`💾 [SQL] ¡NÍTIDO! Ubicación guardada en fleet_sistem.`);

            } catch (error) {
                console.log(`❌ Error de Base de Datos: ${error.message}`);
            }

            io.emit(`camion_${datosCamion.imei}`, datosCamion);
        }
    });

    socket.on('error', (err) => { });
});

tcpServer.listen(5001, () => {
    console.log('🚀 MOTOR TELEMÁTICO CONECTADO A SQL [Puerto 5001]');
});

// 2. DESPACHADOR WEBSOCKET (Puerto 3000)
io.on('connection', (appSocket) => { });

http.listen(3000, () => {
    console.log('🌐 CANAL DE WEBSOCKETS OPTIMIZADO [Puerto 3000]');
});