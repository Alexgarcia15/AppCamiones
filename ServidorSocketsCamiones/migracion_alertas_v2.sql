-- Etapa D: bloqueo de reencendido remoto, deteccion de ignicion y retencion
-- de historial de alertas. Ejecutar una sola vez en produccion:
--   PGPASSWORD='Hector1557' psql -h localhost -U postgres -d fleet_system -f migracion_alertas_v2.sql

-- Bloqueo de reencendido: true mientras el dueno apago el vehiculo desde la
-- app y no lo ha vuelto a activar. Mientras este en true, el servidor
-- reenvia el comando de corte de motor si detecta un intento de encendido
-- por llave o una reconexion del GPS.
ALTER TABLE camiones
    ADD COLUMN IF NOT EXISTS bloqueado_remoto BOOLEAN NOT NULL DEFAULT false;

-- Ultimo estado de ignicion conocido por hardware (bit ACC del paquete GT06
-- 0x13). Null hasta que se reciba el primer paquete de estado del camion.
ALTER TABLE camiones
    ADD COLUMN IF NOT EXISTS motor_encendido BOOLEAN;

-- Indice para que el borrado periodico por retencion (2 meses) sea barato
-- incluso con la tabla creciendo.
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas (fecha);
