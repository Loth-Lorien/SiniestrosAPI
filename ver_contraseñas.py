"""
Script para mostrar las contraseñas de los usuarios
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
    
    print("\n📋 Usuarios con contraseñas:")
    print("-" * 80)
    cursor.execute("""
        SELECT 
            NombreUsuario,
            Contraseña,
            NivelUsuario,
            Estatus
        FROM usuarios
        WHERE Estatus = 1
        ORDER BY NombreUsuario
    """)
    
    for row in cursor.fetchall():
        hashed = "(hash bcrypt)" if row[1].startswith("$2") else row[1]
        print(f"   • Usuario: {row[0]:<15} | Contraseña: {hashed:<20} | Nivel: {row[2]}")
    
    cursor.close()
    conn.close()
    
except pymysql.Error as e:
    print(f"❌ Error de MySQL: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
