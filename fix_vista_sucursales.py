"""
Script para arreglar la vista vista_sucursales en Azure MySQL
Cambia el DEFINER de 'root'@'localhost' a 'perilla'@'%'
"""
import pymysql
import sys

# Configuración de conexión
config = {
    'host': 'scisp.mysql.database.azure.com',
    'user': 'perilla',
    'password': '1016110530Np.',
    'database': 'siniestros_scisp',
    'ssl': {'ssl_mode': 'REQUIRED'}
}

try:
    print("🔌 Conectando a Azure MySQL...")
    conn = pymysql.connect(**config)
    cursor = conn.cursor()
    
    print("🗑️  Eliminando vista existente...")
    cursor.execute("DROP VIEW IF EXISTS `siniestros_scisp`.`vista_sucursales`")
    
    print("🔨 Creando vista con DEFINER correcto...")
    create_view_sql = """
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
        ORDER BY `s`.`Sucursales`
    """
    
    cursor.execute(create_view_sql)
    conn.commit()
    
    print("✅ Vista recreada correctamente!")
    
    print("\n🔍 Verificando vista...")
    cursor.execute("SELECT COUNT(*) FROM `siniestros_scisp`.`vista_sucursales`")
    count = cursor.fetchone()[0]
    print(f"✅ Total de sucursales en la vista: {count}")
    
    print("\n📋 Primeras 5 sucursales:")
    cursor.execute("SELECT IdCentro, Sucursales, Estado FROM `siniestros_scisp`.`vista_sucursales` LIMIT 5")
    for row in cursor.fetchall():
        print(f"   • {row[0]} - {row[1]} ({row[2]})")
    
    cursor.close()
    conn.close()
    
    print("\n✅ ¡Vista arreglada exitosamente!")
    print("Ahora tu API debería poder consultar la vista sin problemas.")
    
except pymysql.Error as e:
    print(f"❌ Error de MySQL: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
