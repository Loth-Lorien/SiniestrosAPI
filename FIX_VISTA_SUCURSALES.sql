-- Script para arreglar la vista vista_sucursales en Azure MySQL
-- El problema: La vista fue creada con DEFINER='root'@'localhost'
-- La solución: Recrearla con DEFINER='perilla'@'%' o sin DEFINER

-- 1. Eliminar la vista existente
DROP VIEW IF EXISTS `siniestros_scisp`.`vista_sucursales`;

-- 2. Recrear la vista con el DEFINER correcto para Azure MySQL
CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `perilla`@`%`
    SQL SECURITY DEFINER
VIEW `siniestros_scisp`.`vista_sucursales` AS
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
        ((((`siniestros_scisp`.`sucursales` `s`
        LEFT JOIN `siniestros_scisp`.`tiposucursal` `ts` ON ((`s`.`IdTipoSucursal` = `ts`.`IdTipoSucursal`)))
        LEFT JOIN `siniestros_scisp`.`zonas` `z` ON ((`s`.`IdZona` = `z`.`idZona`)))
        LEFT JOIN `siniestros_scisp`.`estados` `e` ON ((`s`.`IdEstado` = `e`.`IdEstado`)))
        LEFT JOIN `siniestros_scisp`.`municipios` `m` ON ((`s`.`IdMunicipio` = `m`.`idMunicipios`)))
    ORDER BY `s`.`Sucursales`;

-- Verificar que la vista se creó correctamente
SELECT COUNT(*) as total_sucursales FROM `siniestros_scisp`.`vista_sucursales`;
