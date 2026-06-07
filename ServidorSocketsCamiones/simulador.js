const net = require('net');

// Nos conectamos al servidor de sockets que tienes corriendo
const client = net.createConnection({ port: 5001 }, () => {
    console.log('📡 Simulador: Conectado al servidor TCP...');
    
    // Trama de datos idéntica a la que manda un Coban TK403
    const coordenadaFalsa = "##,imei:352812345678901,A,260526,214500,F,1826.1234,N,07001.5678,W,0.00,0";
    
    console.log('🚚 Simulador: Mandando ubicación del camión...');
    client.write(coordenadaFalsa);
    
    // Cerramos la conexión después de enviar
    client.end();
});

client.on('end', () => {
    console.log('🏁 Simulador: Datos enviados y desconectado.');
});

client.on('error', (err) => {
    console.log(`❌ Error en el simulador: ${err.message}`);
});