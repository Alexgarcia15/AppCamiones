const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fleet_system',
    password: 'Hector1557',
    port: 5432
});

async function agregarCamion(ownerId, imei, ficha, marca, modelo, ano) {
    try {
        const duenoExiste = await pool.query('SELECT nombre FROM duenos WHERE owner_id = $1', [ownerId]);
        if (duenoExiste.rows.length === 0) {
            console.log('❌ No existe ningún dueño con Owner ID: ' + ownerId);
            console.log('   Revisa que lo hayas escrito igual a como salió en agregarDueno.js');
            await pool.end();
            return;
        }

        await pool.query(
            `INSERT INTO camiones (owner_id, imei, ficha, marca, modelo, ano, estado)
             VALUES ($1, $2, $3, $4, $5, $6, 'activo')`,
            [ownerId, imei, ficha, marca, modelo, ano]
        );

        console.log('\n✅ Camión agregado exitosamente:');
        console.log('   Dueño: ' + duenoExiste.rows[0].nombre + ' (' + ownerId + ')');
        console.log('   Ficha: ' + ficha);
        console.log('   Marca/Modelo: ' + marca + ' ' + modelo + ' ' + ano);
        console.log('   IMEI: ' + imei + '\n');
    } catch (error) {
        console.log('❌ Error: ' + error.message);
    }
    await pool.end();
}

const [ownerId, imei, ficha, marca, modelo, ano] = process.argv.slice(2);

if (!ownerId || !imei || !ficha || !marca || !modelo || !ano) {
    console.log('❌ Faltan datos. Uso correcto:');
    console.log('node agregarCamion.js OWNER_ID IMEI FICHA MARCA MODELO ANO');
    console.log('Ejemplo:');
    console.log('node agregarCamion.js cliente_prueba 123456789012345 "A123456" Freightliner Cascadia 2020');
    process.exit(1);
}

agregarCamion(ownerId, imei, ficha, marca, modelo, ano);