const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'fleet_system', password: 'Hector1557', port: 5432 });
async function ponerUbicacionesDemo() {
    await pool.query("UPDATE camiones SET latitud = 18.4861, longitud = -69.9312, velocidad = 45 WHERE ficha = 'D001'");
    await pool.query("UPDATE camiones SET latitud = 18.4700, longitud = -69.9100, velocidad = 20 WHERE ficha = 'D002'");
    console.log('Ubicaciones puestas');
    await pool.end();
}
ponerUbicacionesDemo();
