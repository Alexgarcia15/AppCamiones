const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',
    password: 'Hector1557',
    port: 5432
});

async function verToken(ownerId) {
    try {
        const resultado = await pool.query(
            'SELECT owner_id, nombre, token, length(token) as largo, activo FROM duenos WHERE owner_id = $1',
            [ownerId]
        );
        if (resultado.rows.length === 0) {
            console.log('No se encontró ningún dueño con owner_id: ' + ownerId);
        } else {
            console.log(resultado.rows);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

const ownerIdArgumento = process.argv[2];
if (!ownerIdArgumento) {
    console.log('Uso: node verToken.js owner_id');
    process.exit(1);
}

verToken(ownerIdArgumento);
