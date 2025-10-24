-- ============================================
-- Script para crear la tabla BOLETIN
-- Base de datos: siniestros_scisp
-- ============================================

USE siniestros_scisp;

-- Crear tabla boletin si no existe
CREATE TABLE IF NOT EXISTS `boletin` (
  `idBoletin` INT NOT NULL AUTO_INCREMENT,
  `IdSiniestro` INT NOT NULL,
  `Boletin` VARCHAR(455) NULL DEFAULT NULL,
  `RutaFoto` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`idBoletin`),
  UNIQUE INDEX `IdSiniestro_UNIQUE` (`IdSiniestro` ASC),
  CONSTRAINT `fk_boletin_siniestro`
    FOREIGN KEY (`IdSiniestro`)
    REFERENCES `siniestros` (`IdSiniestro`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla boletin creada exitosamente' AS Mensaje;

-- Mostrar estructura de la tabla
DESCRIBE boletin;
