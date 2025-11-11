-- ============================================================================
-- SCRIPT PARA EJECUTAR CON USUARIO: perilla (administrador)
-- ============================================================================
-- Este script recrea la vista_sucursales para que CUALQUIER usuario pueda verla
-- ============================================================================

USE siniestros_scisp;

-- 1. Eliminar la vista antigua (que tenía DEFINER = root@localhost)
DROP VIEW IF EXISTS `vista_sucursales`;

-- 2. Recrear la vista con la configuración correcta:
--    • DEFINER = perilla@% (el administrador)
--    • SQL SECURITY INVOKER (cada usuario usa sus propios permisos)
CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `perilla`@`%`
    SQL SECURITY INVOKER
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

-- 3. Verificar que funciona
SELECT COUNT(*) AS total_sucursales FROM vista_sucursales;
SELECT * FROM vista_sucursales LIMIT 5;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ✅ Vista recreada exitosamente
-- ✅ Cualquier usuario con permisos SELECT en las tablas puede consultar la vista
-- ✅ Tu API puede obtener sucursales sin error "Access denied"
-- ============================================================================
