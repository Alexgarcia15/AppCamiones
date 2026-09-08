-- Etapa A: infraestructura compartida de alertas + push notifications.
-- Ejecutar una sola vez en la base de datos de produccion:
--   PGPASSWORD='Hector1557' psql -h localhost -U postgres -d fleet_system -f migracion_alertas.sql

-- Geocerca circular por camion (Etapa C - desvio de ruta). Nullable: si un
-- camion no tiene geocerca configurada, simplemente no se evalua desvio para el.
ALTER TABLE camiones
    ADD COLUMN IF NOT EXISTS geocerca_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geocerca_lon DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geocerca_radio_m INTEGER;

-- Historial de alertas (velocidad, ruta, encendido, apagado, ...).
CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR NOT NULL,
    imei VARCHAR NOT NULL,
    tipo VARCHAR NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    leida BOOLEAN NOT NULL DEFAULT false
);

-- Push tokens de Expo por dueno (un dueno puede tener mas de un celular).
CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR NOT NULL,
    token VARCHAR NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, token)
);
