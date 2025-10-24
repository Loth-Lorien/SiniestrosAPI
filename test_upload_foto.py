"""
Script de prueba para verificar la subida de fotos
"""
import requests
import base64
from pathlib import Path

# Configuración
API_URL = "http://localhost:8000"
USERNAME = "admin"  # Cambiar por tu usuario
PASSWORD = "admin123"  # Cambiar por tu contraseña
ID_SINIESTRO = 1  # Cambiar por un ID de siniestro existente

def test_upload_foto():
    """Prueba la subida de una foto"""
    
    # Crear una imagen de prueba simple
    print("📸 Creando imagen de prueba...")
    test_image_path = Path("test_image.jpg")
    
    # Si no existe, crear una imagen simple
    if not test_image_path.exists():
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(test_image_path)
        print(f"✅ Imagen de prueba creada: {test_image_path}")
    
    # Preparar autenticación
    auth = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}"
    }
    
    # Abrir y enviar archivo
    print(f"\n📤 Subiendo foto para siniestro ID: {ID_SINIESTRO}")
    with open(test_image_path, 'rb') as f:
        files = {'file': ('test.jpg', f, 'image/jpeg')}
        
        url = f"{API_URL}/siniestros/{ID_SINIESTRO}/foto/subir"
        print(f"🌐 URL: {url}")
        
        response = requests.post(url, files=files, headers=headers)
    
    # Mostrar resultados
    print(f"\n📥 Status Code: {response.status_code}")
    print(f"📥 Response: {response.json()}")
    
    if response.status_code == 200:
        print("\n✅ ¡Foto subida exitosamente!")
        data = response.json()
        print(f"📂 Ruta guardada: {data.get('rutaFoto')}")
        print(f"📄 Nombre archivo: {data.get('nombreArchivo')}")
    else:
        print(f"\n❌ Error: {response.json()}")

if __name__ == "__main__":
    try:
        test_upload_foto()
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar al servidor. ¿Está corriendo?")
    except Exception as e:
        print(f"❌ Error: {e}")
