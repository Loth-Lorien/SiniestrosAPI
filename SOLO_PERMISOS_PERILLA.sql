-- ============================================================================
-- Script alternativo: Solo otorgar permisos al usuario perilla
-- ============================================================================
-- Si no quieres modificar la vista, este script otorga permisos directos
-- al usuario 'perilla' para todas las tablas necesarias
-- ============================================================================

USE siniestros_scisp;

-- Otorgar permisos SELECT en todas las tablas base que usa la vista
GRANT SELECT ON `siniestros_scisp`.`sucursales` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`tiposucursal` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`zonas` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`estados` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`municipios` TO 'perilla'@'%';

-- Otorgar permiso para ejecutar la vista (aunque use DEFINER)
GRANT SELECT, SHOW VIEW ON `siniestros_scisp`.`vista_sucursales` TO 'perilla'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar permisos otorgados
SHOW GRANTS FOR 'perilla'@'%';

-- ============================================================================
-- NOTA: Si este script no funciona, usa RECREAR_VISTA_SUCURSALES.sql
-- ============================================================================
