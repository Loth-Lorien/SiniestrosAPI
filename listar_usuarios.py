"""
Script para listar usuarios disponibles en la aplicación
"""
import pymysql

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
    
    print("\n📋 Usuarios en la tabla usuarios:")
    print("-" * 80)
    cursor.execute("""
        SELECT 
            IdUsuarios,
            NombreUsuario,
            NivelUsuario,
            Estatus
        FROM usuarios
        ORDER BY NombreUsuario
    """)
    
    for row in cursor.fetchall():
        status = "✅ Activo" if row[3] == 1 else "❌ Inactivo"
        print(f"   • Usuario: {row[1]:<20} | Nivel: {row[2]} | {status}")
    
    cursor.close()
    conn.close()
    
except pymysql.Error as e:
    print(f"❌ Error de MySQL: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
