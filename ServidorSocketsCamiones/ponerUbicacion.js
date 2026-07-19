const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',
    password: 'Hector1557',
    port: 5432
});

async function ponerUbicaciones() {
    await pool.query("UPDATE camiones SET latitud = 18.5001, longitud = -69.9500, velocidad = 60 WHERE ficha = 'B111111'");
    await pool.query("UPDATE camiones SET latitud = 18.4700, longitud = -69.9100, velocidad = 35 WHERE ficha = 'B222222'");
    await pool.query("UPDATE camiones SET latitud = 18.4550, longitud = -69.9700, velocidad = 0 WHERE ficha = 'B333333'");
    console.log('Ubicaciones puestas para los 3 camiones nuevos');
    await pool.end();
}

ponerUbicaciones();