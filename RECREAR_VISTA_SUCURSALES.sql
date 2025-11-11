-- ============================================================================
-- Script para recrear la vista_sucursales con los permisos correctos
-- ============================================================================
-- IMPORTANTE: Debes ejecutar este script con el usuario ADMINUSER porque:
--   1. Solo un administrador puede crear vistas
--   2. Solo un administrador puede otorgar permisos (GRANT)
--
-- DESPUÉS de ejecutar este script, CUALQUIER USUARIO podrá consultar la vista:
--   - El usuario 'perilla' podrá hacer SELECT en la vista
--   - Cualquier otro usuario con permisos en las tablas base también podrá
--
-- ¿Cómo funciona?
--   - SQL SECURITY INVOKER: La vista usa los permisos del usuario que consulta
--   - GRANT SELECT: Le da permisos explícitos a 'perilla' en todas las tablas
-- ============================================================================

USE siniestros_scisp;

-- 1. Eliminar la vista existente
DROP VIEW IF EXISTS `vista_sucursales`;

-- 2. Recrear la vista con SQL SECURITY INVOKER
-- DEFINER = adminuser@%  ➡️ Solo dice quién creó la vista (adminuser)
-- SQL SECURITY INVOKER   ➡️ La vista usa permisos del usuario que consulta (perilla, tú, cualquiera)
--
-- Esto significa:
--   - Cuando 'perilla' consulta la vista, usa los permisos de 'perilla'
--   - Cuando TÚ consultas la vista, usa TUS permisos
--   - Cualquiera con acceso a las tablas puede consultar la vista
CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `adminuser`@`%`
    SQL SECURITY INVOKER  -- ⬅️ CAMBIO IMPORTANTE: usa permisos del usuario que consulta
VIEW `vista_sucursales` AS
    SELECT 
        `s`.`IdCentro` AS `IdCentro`,
        `s`.`Sucursales` AS `Sucursales`,
        `ts`.`TipoSucursal` AS `TipoSucursal`,
        `z`.`Zona` AS `Zona`,
        `e`.`Estado` AS `Estado`,
        `s`.`estado` AS `EstadoActivo`,
        COALESCE(`m`.`Municipio`, 'N/A') AS `Municipio`,
        COALESCE(NULLIF(TRIM(`s`.`Telefono`), ''), 'N/A') AS `Telefono`,
        COALESCE(NULLIF(TRIM(`s`.`ext`), ''), 'N/A') AS `Ext`,
        COALESCE(NULLIF(TRIM(`s`.`Direccion`), ''), 'N/A') AS `Direccion`
    FROM
        ((((`sucursales` `s`
        LEFT JOIN `tiposucursal` `ts` ON ((`s`.`IdTipoSucursal` = `ts`.`IdTipoSucursal`)))
        LEFT JOIN `zonas` `z` ON ((`s`.`IdZona` = `z`.`idZona`)))
        LEFT JOIN `estados` `e` ON ((`s`.`IdEstado` = `e`.`IdEstado`)))
        LEFT JOIN `municipios` `m` ON ((`s`.`IdMunicipio` = `m`.`idMunicipios`)))
    ORDER BY `s`.`Sucursales`;

-- 3. Otorgar permisos SELECT en las tablas base al usuario 'perilla'
-- Estos comandos permiten que 'perilla' pueda leer las tablas que usa la vista
-- NOTA: Solo adminuser puede ejecutar estos GRANT
--
-- ¿Por qué es necesario?
--   - La vista usa SQL SECURITY INVOKER
--   - Entonces 'perilla' necesita permisos en las tablas base (sucursales, zonas, etc.)
--   - Estos GRANT le dan esos permisos
GRANT SELECT ON `siniestros_scisp`.`sucursales` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`tiposucursal` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`zonas` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`estados` TO 'perilla'@'%';
GRANT SELECT ON `siniestros_scisp`.`municipios` TO 'perilla'@'%';
FLUSH PRIVILEGES;

-- 4. Verificar que la vista funciona
SELECT COUNT(*) AS total_sucursales FROM vista_sucursales;
SELECT * FROM vista_sucursales LIMIT 5;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ✅ La vista se recrea exitosamente
-- ✅ El usuario 'perilla' puede consultar la vista
-- ✅ La API puede obtener las sucursales sin error
-- ============================================================================
