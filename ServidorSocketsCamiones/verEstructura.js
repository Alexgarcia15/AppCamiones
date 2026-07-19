const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',
    password: 'Hector1557',
    port: 5432
});

async function verEstructura() {
    const tablas = ['duenos', 'camiones'];
    for (const tabla of tablas) {
        console.log(`\n📋 Columnas de "${tabla}":`);
        const resultado = await pool.query(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
            [tabla]
        );
        resultado.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
    }
    await pool.end();
}

verEstructura();