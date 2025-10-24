"""
Script de prueba para verificar la generación de PDFs de boletines
"""

import requests

# Configuración
BASE_URL = "http://localhost:8000"
# Cambia estas credenciales por las de un usuario válido
USERNAME = "admin"
PASSWORD = "admin123"

def test_generar_pdf_boletin(id_siniestro: int):
    """
    Prueba la generación de PDF para un siniestro específico
    """
    print(f"\n{'='*60}")
    print(f"🧪 Probando generación de PDF para siniestro ID: {id_siniestro}")
    print(f"{'='*60}\n")
    
    # Autenticación básica
    auth = (USERNAME, PASSWORD)
    
    try:
        # Hacer request al endpoint
        print(f"📡 Llamando a: GET {BASE_URL}/siniestros/{id_siniestro}/boletin/pdf")
        response = requests.get(
            f"{BASE_URL}/siniestros/{id_siniestro}/boletin/pdf",
            auth=auth,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📦 Content-Type: {response.headers.get('Content-Type')}")
        print(f"📏 Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Guardar PDF
            filename = f"test_boletin_{id_siniestro}.pdf"
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"\n✅ ¡PDF generado exitosamente!")
            print(f"📄 Archivo guardado: {filename}")
            print(f"💾 Tamaño: {len(response.content) / 1024:.2f} KB")
            
            return True
        else:
            print(f"\n❌ Error al generar PDF")
            print(f"📝 Respuesta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: No se pudo conectar al servidor")
        print("🔍 Verifica que el servidor FastAPI esté corriendo en http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔬 TEST DE GENERACIÓN DE PDF DE BOLETINES")
    print("="*60)
    
    # IDs de siniestros para probar (basados en la estructura de carpetas)
    # Cambia estos IDs por los que existan en tu base de datos
    test_ids = [15, 23, 34, 35, 36]
    
    print(f"\n📋 IDs a probar: {test_ids}")
    print(f"👤 Usuario: {USERNAME}")
    print(f"🌐 Servidor: {BASE_URL}")
    
    resultados = []
    for id_siniestro in test_ids:
        success = test_generar_pdf_boletin(id_siniestro)
        resultados.append((id_siniestro, success))
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE PRUEBAS")
    print("="*60)
    
    exitosos = sum(1 for _, success in resultados if success)
    fallidos = len(resultados) - exitosos
    
    print(f"\n✅ Exitosos: {exitosos}/{len(resultados)}")
    print(f"❌ Fallidos: {fallidos}/{len(resultados)}")
    
    if fallidos > 0:
        print("\n❌ Siniestros que fallaron:")
        for id_sin, success in resultados:
            if not success:
                print(f"  - Siniestro ID: {id_sin}")
    
    print("\n" + "="*60)
