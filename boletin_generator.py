"""
Módulo para generar boletines de siniestros en PDF e imagen.
Soporta 5 tipos de siniestros: Asalto, Extorsión, Fardero, Intruso, Sospechoso.
"""

import os
from pathlib import Path
from io import BytesIO
from datetime import datetime
from typing import Optional, Tuple
import xml.etree.ElementTree as ET

# Rutas base
BASE_BOLETIN_PATH = Path(__file__).parent / "Boletin"
SVG_TEMPLATES_PATH = BASE_BOLETIN_PATH
FOTOS_PATH = BASE_BOLETIN_PATH / "imagenesSiniestros"

# Mapeo de tipos de siniestro a archivos SVG
SINIESTRO_TIPOS_SVG = {
    "asalto": "Asalto.svg",
    "extorsion": "Extorsion.svg",
    "fardero": "Fardero.svg",
    "intruso": "Intruso.svg",
    "sospechoso": "Sospechoso.svg"
}


def crear_carpeta_siniestro(id_siniestro: int) -> Path:
    """Crear carpeta para fotos del siniestro si no existe."""
    ruta = FOTOS_PATH / str(id_siniestro)
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta


def guardar_foto_siniestro(file_path: str, id_siniestro: int, filename: str) -> str:
    """
    Guardar foto en la carpeta de siniestros.
    
    Args:
        file_path: Ruta temporal del archivo
        id_siniestro: ID del siniestro
        filename: Nombre del archivo original
    
    Returns:
        Ruta relativa de guardado
    """
    carpeta = crear_carpeta_siniestro(id_siniestro)
    
    # Renombrar archivo con ID del siniestro
    extension = Path(filename).suffix
    nuevo_nombre = f"{id_siniestro}{extension}"
    ruta_destino = carpeta / nuevo_nombre
    
    # Copiar archivo
    import shutil
    shutil.copy2(file_path, ruta_destino)
    
    # Retornar ruta relativa
    return f"Boletin/imagenesSiniestros/{id_siniestro}/{nuevo_nombre}"


def renderizar_svg_con_datos(
    tipo_siniestro: str,
    zona: str,
    id_centro: str,
    nombre_sucursal: str,
    fecha: str,
    hora: str,
    descripcion: str,
    ruta_foto: Optional[str] = None
) -> str:
    """
    Renderizar SVG reemplazando placeholders con datos del siniestro en coordenadas específicas.
    
    La plantilla SVG contiene elementos <text> con atributos id para ubicación exacta:
    - id="zona" (x=150, y=210)
    - id="idcentro" (x=150, y=245)
    - id="sucursal" (x=150, y=280)
    - id="fecha" (x=150, y=370)
    - id="hora" (x=150, y=405)
    - id="descripcion" (x=60, y=495)
    - Elemento <image> para foto embebida
    
    Los placeholders en el SVG:
    - {{ZONA}}, {{IDCENTRO}}, {{SUCURSAL}}, {{FECHA}}, {{HORA}}, {{DESCRIPCION}}
    - {{FOTO}} para data URI de imagen embebida
    - {{GENERATE_DATE}} para fecha de generación
    
    Args:
        tipo_siniestro: Tipo de siniestro (asalto, extorsion, etc.)
        zona: Nombre de la zona
        id_centro: ID del centro
        nombre_sucursal: Nombre de la sucursal
        fecha: Fecha del evento (YYYY-MM-DD)
        hora: Hora del evento (HH:MM:SS)
        descripcion: Descripción de los hechos
        ruta_foto: Ruta de la foto (opcional)
    
    Returns:
        SVG renderizado como string con datos incrustados en coordenadas específicas
    """
    # Obtener archivo SVG template
    tipo_key = tipo_siniestro.lower()
    if tipo_key not in SINIESTRO_TIPOS_SVG:
        raise ValueError(f"Tipo de siniestro no válido: {tipo_siniestro}")
    
    # Intentar primero con plantilla mejorada (_Template), si no existe usar original
    template_file = SVG_TEMPLATES_PATH / f"{tipo_key.capitalize()}_Template.svg"
    if not template_file.exists():
        template_file = SVG_TEMPLATES_PATH / SINIESTRO_TIPOS_SVG[tipo_key]
    
    if not template_file.exists():
        raise FileNotFoundError(f"Template SVG no encontrado: {template_file}")
    
    # Leer SVG original
    with open(template_file, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Escapar caracteres especiales en texto para XML
    zona_escaped = _escapar_xml(zona)
    id_centro_escaped = _escapar_xml(id_centro)
    nombre_sucursal_escaped = _escapar_xml(nombre_sucursal)
    fecha_escaped = _escapar_xml(fecha)
    hora_escaped = _escapar_xml(hora)
    descripcion_escaped = _escapar_xml(descripcion)
    
    # Reemplazar placeholders de texto
    svg_content = svg_content.replace("{{ZONA}}", zona_escaped)
    svg_content = svg_content.replace("{{IDCENTRO}}", id_centro_escaped)
    svg_content = svg_content.replace("{{SUCURSAL}}", nombre_sucursal_escaped)
    svg_content = svg_content.replace("{{FECHA}}", fecha_escaped)
    svg_content = svg_content.replace("{{HORA}}", hora_escaped)
    svg_content = svg_content.replace("{{DESCRIPCION}}", descripcion_escaped)
    
    # Reemplazar fecha de generación
    from datetime import datetime
    fecha_generacion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    svg_content = svg_content.replace("{{GENERATE_DATE}}", fecha_generacion)
    
    # Embeber imagen si existe
    if ruta_foto and os.path.exists(ruta_foto):
        svg_content = embeber_imagen_en_svg(svg_content, ruta_foto)
    else:
        # Si no hay foto, usar placeholder vacío
        svg_content = svg_content.replace('href="{{FOTO}}"', 'href="" style="display:none"')
    
    return svg_content


def _escapar_xml(texto: str) -> str:
    """
    Escapar caracteres especiales para XML/SVG.
    
    Args:
        texto: Texto a escapar
    
    Returns:
        Texto escapado
    """
    if not texto:
        return ""
    
    replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }
    
    resultado = texto
    for char, escaped in replacements.items():
        resultado = resultado.replace(char, escaped)
    
    return resultado


def embeber_imagen_en_svg(svg_content: str, ruta_imagen: str) -> str:
    """
    Embeber imagen Base64 en el SVG en la ubicación correcta.
    
    Busca en el SVG un elemento <image> con href="{{FOTO}}" y lo reemplaza 
    con una imagen embebida en Base64. Mantiene los atributos x, y, width, height.
    
    Args:
        svg_content: Contenido SVG con placeholder {{FOTO}}
        ruta_imagen: Ruta del archivo de imagen
    
    Returns:
        SVG con imagen embebida
    """
    import base64
    
    if not os.path.exists(ruta_imagen):
        return svg_content
    
    try:
        # Leer imagen y convertir a Base64
        with open(ruta_imagen, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Determinar tipo MIME
        extension = os.path.splitext(ruta_imagen)[1].lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp'
        }
        mime_type = mime_types.get(extension, 'image/jpeg')
        
        # Crear data URI
        data_uri = f"data:{mime_type};base64,{image_data}"
        
        # Reemplazar placeholder en href
        svg_content = svg_content.replace('href="{{FOTO}}"', f'href="{data_uri}"')
        
        # Asegurar que la imagen esté visible (en caso de que tenga display:none)
        svg_content = svg_content.replace('style="display:none"', '')
        
    except Exception as e:
        print(f"Error embebiendo imagen: {e}")
        # Si hay error, dejar el placeholder sin imagen
        svg_content = svg_content.replace('href="{{FOTO}}"', 'href="" style="display:none"')
    
    return svg_content


def svg_a_pdf(svg_content: str, id_siniestro: int) -> bytes:
    """
    Convertir SVG a PDF usando ReportLab + svglib.
    
    Args:
        svg_content: Contenido SVG renderizado
        id_siniestro: ID del siniestro (para nombre de archivo)
    
    Returns:
        Bytes del PDF
    """
    import tempfile
    
    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPDF
        
        # Guardar SVG temporal
        with tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False, encoding='utf-8') as tmp:
            tmp.write(svg_content)
            tmp_path = tmp.name
        
        try:
            # Convertir SVG a RLG (ReportLab Graphics)
            drawing = svg2rlg(tmp_path)
            if not drawing:
                raise ValueError("No se pudo parsear el SVG")
            
            # Convertir a PDF
            pdf_buffer = BytesIO()
            renderPDF.drawToFile(drawing, pdf_buffer, fmt='PDF')
            pdf_bytes = pdf_buffer.getvalue()
            
            if not pdf_bytes:
                raise ValueError("PDF generado vacío")
            
            return pdf_bytes
        
        finally:
            os.unlink(tmp_path)
    
    except Exception as e:
        print(f"❌ Error convirtiendo SVG a PDF: {e}")
        import traceback
        traceback.print_exc()
        raise


def svg_a_imagen_png(svg_content: str, id_siniestro: int, ancho: int = 800, alto: int = 1000) -> bytes:
    """
    Convertir SVG a imagen PNG usando cairosvg (mejor calidad).
    
    Args:
        svg_content: Contenido SVG renderizado
        id_siniestro: ID del siniestro
        ancho: Ancho en píxeles (por defecto 800)
        alto: Alto en píxeles (por defecto 1000)
    
    Returns:
        Bytes de la imagen PNG
    """
    import tempfile
    
    try:
        import cairosvg
        
        # Guardar SVG temporal
        with tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False, encoding='utf-8') as tmp:
            tmp.write(svg_content)
            tmp_path = tmp.name
        
        try:
            png_buffer = BytesIO()
            # Convertir SVG a PNG con escala
            cairosvg.svg2png(url=tmp_path, write_to=png_buffer, output_width=ancho, output_height=alto)
            return png_buffer.getvalue()
        
        finally:
            os.unlink(tmp_path)
    
    except Exception as e:
        print(f"❌ Error convirtiendo SVG a PNG: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    # Test
    svg = renderizar_svg_con_datos(
        tipo_siniestro="asalto",
        zona="Zona 1",
        id_centro="A001",
        nombre_sucursal="Sucursal Principal",
        fecha="2025-10-18",
        hora="14:30:00",
        descripcion="Evento de asalto en la sucursal"
    )
    print("SVG generado correctamente")
