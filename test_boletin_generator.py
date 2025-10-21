"""
Script de prueba para el módulo de generación de boletines
Verifica que todas las funciones funcionan correctamente
"""

import sys
from pathlib import Path

# Agregar ruta del proyecto
project_path = Path(__file__).parent
sys.path.insert(0, str(project_path))

def test_boletin_generator():
    """Pruebas básicas del módulo"""
    
    print("=" * 60)
    print("[PRUEBAS DEL MODULO BOLETIN_GENERATOR]")
    print("=" * 60)
    
    try:
        from boletin_generator import (
            renderizar_svg_con_datos,
            svg_a_pdf,
            svg_a_imagen_png,
            crear_carpeta_siniestro,
            SINIESTRO_TIPOS_SVG,
            SVG_TEMPLATES_PATH,
            FOTOS_PATH
        )
        print("[OK] Importaciones exitosas")
    except ImportError as e:
        print(f"[ERROR] Error importando modulo: {e}")
        return False
    
    # Test 1: Verificar rutas
    print("\n[Test 1] Verificar rutas de plantillas")
    print(f"  - SVG_TEMPLATES_PATH: {SVG_TEMPLATES_PATH}")
    print(f"  - FOTOS_PATH: {FOTOS_PATH}")
    
    if SVG_TEMPLATES_PATH.exists():
        print(f"  [OK] Ruta de plantillas existe")
    else:
        print(f"  [ERROR] Ruta de plantillas NO existe")
    
    # Test 2: Verificar plantillas SVG
    print("\n[Test 2] Verificar plantillas SVG disponibles")
    for tipo, filename in SINIESTRO_TIPOS_SVG.items():
        filepath = SVG_TEMPLATES_PATH / filename
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"  [OK] {tipo:15} -> {filename:20} ({size} bytes)")
        else:
            print(f"  [ERROR] {tipo:15} -> {filename:20} (NO ENCONTRADO)")
    
    # Test 3: Crear carpeta para siniestro
    print("\n[Test 3] Crear carpeta para siniestro")
    try:
        carpeta = crear_carpeta_siniestro(999)
        print(f"  [OK] Carpeta creada: {carpeta}")
    except Exception as e:
        print(f"  [ERROR] Error creando carpeta: {e}")
    
    # Test 4: Renderizar SVG
    print("\n[Test 4] Renderizar SVG con datos")
    try:
        svg = renderizar_svg_con_datos(
            tipo_siniestro="asalto",
            zona="Zona Centro",
            id_centro="A001",
            nombre_sucursal="Sucursal Principal",
            fecha="18/10/2025",
            hora="14:30",
            descripcion="Asalto a mano armada en sucursal principal",
            ruta_foto=None
        )
        if "Zona Centro" in svg and "A001" in svg:
            print(f"  [OK] SVG renderizado correctamente ({len(svg)} bytes)")
        else:
            print(f"  [AVISO] SVG no contiene los datos esperados")
    except Exception as e:
        print(f"  [ERROR] Error renderizando SVG: {e}")
        return False
    
    # Test 5: Convertir a PDF
    print("\n[Test 5] Convertir SVG a PDF")
    try:
        pdf_bytes = svg_a_pdf(svg, 999)
        if len(pdf_bytes) > 0:
            print(f"  [OK] PDF generado ({len(pdf_bytes)} bytes)")
        else:
            print(f"  [AVISO] PDF generado vacio")
    except Exception as e:
        print(f"  [ERROR] Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 6: Convertir a PNG
    print("\n[Test 6] Convertir SVG a PNG")
    try:
        png_bytes = svg_a_imagen_png(svg, 999)
        if len(png_bytes) > 0:
            print(f"  [OK] PNG generado ({len(png_bytes)} bytes)")
        else:
            print(f"  [AVISO] PNG generado vacio")
    except Exception as e:
        print(f"  [ERROR] Error generando PNG: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("[OK] PRUEBAS COMPLETADAS")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_boletin_generator()
    sys.exit(0 if success else 1)
