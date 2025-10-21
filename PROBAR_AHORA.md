# PROBAR BOLETÍN CON PLANTILLAS SVG

## Estado Actual
✅ Backend: Corriendo en http://localhost:8000
✅ Dependencias instaladas: svglib, reportlab, cairosvg
✅ Plantillas SVG: Creadas (5 tipos)
✅ Código: Corregido (zona.zona, svg_a_pdf mejorada)
✅ Tests: Pasados (SVG y PDF funcionan correctamente)

---

## Pasos para Probar

### 1. Abre el navegador
```
http://localhost:3000
```

### 2. Crea un Siniestro de Prueba
- Ve a: **Siniestros > Crear**
- Completa los campos:
  - **Tipo**: Asalto (o cualquiera de los 5 tipos)
  - **Sucursal**: Selecciona cualquiera
  - **Zona**: Se asigna automáticamente
  - **Descripción**: Escribe algo descriptivo
  - **Fecha y Hora**: Usa valores reales o de prueba

### 3. Sube una Foto
- En el formulario, carga una imagen JPG o PNG
- Puede ser una foto pequeña o un placeholder

### 4. Genera el Boletín
- Después de crear el siniestro, haz clic en: **"Generar Boletín"**
- El PDF se descargará automáticamente

### 5. Abre el PDF Descargado
Verifica que contiene:
- ✅ **Encabezado**: "BOLETÍN DE ASALTO" (con color distintivo)
- ✅ **Zona**: El nombre que asignaste
- ✅ **ID Centro**: El ID de la sucursal
- ✅ **Sucursal**: El nombre correcto
- ✅ **Fecha**: En formato DD/MM/YYYY
- ✅ **Hora**: En formato HH:MM
- ✅ **Descripción**: En el recuadro con fondo blanco
- ✅ **Foto**: En la zona designada (680×180px)
- ✅ **Pie de página**: Fecha de generación

---

## Verificación Visual

### Ubicaciones Esperadas (Coordenadas SVG)
```
Zona:              x=150, y=210
ID Centro:         x=150, y=245
Sucursal:          x=150, y=280
Fecha:             x=150, y=370
Hora:              x=150, y=405
Descripción:       x=60,  y=495 (en recuadro)
Foto:              x=60,  y=710 (680×180px)
```

### Colores por Tipo (en el Encabezado)
- **Asalto**: Rojo (#d32f2f)
- **Extorsión**: Naranja (#f57c00)
- **Fardero**: Verde (#388e3c)
- **Intruso**: Púrpura (#7b1fa2)
- **Sospechoso**: Rojo-Naranja (#e64a19)

---

## Si algo no funciona

### Problema: PDF vacío o con solo texto
- ✅ Ya está resuelto (svglib instalado, svg_a_pdf mejorada)

### Problema: Foto no aparece
- ✅ Verifica que la foto se subió correctamente
- ✅ En el formulario debe haber un campo para subir imagen

### Problema: Error en el backend
- Revisa: `SIGUIENTE_PASO.md` (sección Troubleshooting)

### Problema: Error "zona.zona" 
- ✅ Ya está corregido en main.py línea 2147

---

## Próximos Pasos Después de Verificación

1. **Prueba los 5 tipos**: Crea un siniestro para cada tipo (Asalto, Extorsión, Fardero, Intruso, Sospechoso)
2. **Verifica colores**: Cada PDF debe tener su color distintivo en el encabezado
3. **Prueba con imágenes grandes/pequeñas**: Verifica escalado de fotos
4. **Texto largo**: Prueba con descripciones muy largas

---

## Resumen de Cambios Realizados

**main.py (Línea 2147)**
```python
# ANTES: zona_nombre = zona.Zona if zona else "Sin zona"
# AHORA: zona_nombre = zona.zona if zona else "Sin zona"
```

**boletin_generator.py**
```python
# ✅ svg_a_pdf() - Ahora usa svglib correctamente
# ✅ svg_a_imagen_png() - Usa cairosvg para mejor calidad
# ✅ Ambas funciones sin fallback de texto
```

**Dependencias Instaladas**
```
svglib          - Para convertir SVG a PDF
reportlab       - Motor PDF
cairosvg        - Para convertir SVG a PNG
```

---

**Último actualizado**: 20 de octubre de 2025  
**Estado**: ✅ Listo para probar
