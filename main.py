
"""

Requisitos (requirements.txt sugerido):
fastapi==0.115.0
uvicorn==0.30.6
SQLAlchemy==2.0.36
pydantic==2.9.2
pymysql==1.1.1
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1

Ejecución local:
1) Crear y y carguelos datos con el script llamado 'siniestrosApi_scisp.sql'.
2) Exportar variable DATABASE_URL en el archivo .env
3) pip install -r requirements.txt
4) uvicorn main:app --reload

"""
from __future__ import annotations

import os
from datetime import date, datetime, time
from typing import Optional, List
import os

from fastapi import FastAPI, Depends, HTTPException, status, Path, File, UploadFile
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, Response
from pydantic import BaseModel, Field, validator

# Importar módulo de generación de boletines
from boletin_generator import (
    renderizar_svg_con_datos,
    svg_a_pdf,
    svg_a_imagen_png,
    guardar_foto_siniestro,
    crear_carpeta_siniestro
)

from sqlalchemy import (
    create_engine, select, func, String, Integer, Date, DateTime, Boolean, Float, ForeignKey, Time,
    and_, text, literal_column, case
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session, selectinload
)
from sqlalchemy.exc import IntegrityError, NoResultFound

try:
    from passlib.hash import bcrypt
except Exception:  # pragma: no cover
    bcrypt = None  # Se maneja abajo

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:1234@localhost:3306/siniestros_scisp?charset=utf8mb4",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    isolation_level="READ COMMITTED",
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

security = HTTPBasic()


class Base(DeclarativeBase):
    pass


# ==========================
# Modelo ORM (tablas reales)
class Zona(Base):
    __tablename__ = "zonas"
    idZona: Mapped[int] = mapped_column(Integer, primary_key=True)
    zona: Mapped[str] = mapped_column(String(13))
# ==========================
class NivelUsuario(Base):
    __tablename__ = "nivelusuarios"
    IdNivelUsuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    NivelUsuario: Mapped[str] = mapped_column(String(20))


class Usuario(Base):
    __tablename__ = "usuarios"
    IdUsuarios: Mapped[int] = mapped_column(Integer, primary_key=True)
    NombreUsuario: Mapped[str] = mapped_column(String(45))
    # Columna con ñ en MySQL
    Contrasena: Mapped[str] = mapped_column("Contraseña", String(25))
    NivelUsuarioId: Mapped[int] = mapped_column("NivelUsuario", Integer, ForeignKey("nivelusuarios.IdNivelUsuario"))
    Estatus: Mapped[int] = mapped_column("Estatus", Integer)

    nivel: Mapped[NivelUsuario] = relationship(lazy="joined")


class Sucursal(Base):
    __tablename__ = "sucursales"
    IdCentro: Mapped[str] = mapped_column(String(4), primary_key=True)
    Sucursales: Mapped[str] = mapped_column(String(30))
    idZona: Mapped[int] = mapped_column(Integer)
    idEstado: Mapped[int] = mapped_column(Integer)


class TipoSiniestro(Base):
    __tablename__ = "tiposiniestro"
    idTipoSiniestro: Mapped[int] = mapped_column(Integer, primary_key=True)
    Cuenta: Mapped[str] = mapped_column(String(18))


class Siniestro(Base):
    __tablename__ = "siniestros"
    IdSiniestro: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    IdCentro: Mapped[str] = mapped_column(String(4), ForeignKey("sucursales.IdCentro"))
    Fecha: Mapped[date] = mapped_column(Date)
    Hora: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    IdTipoCuenta: Mapped[int] = mapped_column(Integer, ForeignKey("tiposiniestro.idTipoSiniestro"))
    Frustrado: Mapped[bool] = mapped_column(Boolean)
    IdRealizo: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.IdUsuarios"))
    Contemplar: Mapped[bool] = mapped_column(Boolean)
    Finalizado: Mapped[bool] = mapped_column(Boolean, default=False)
    Detalle: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    tipo: Mapped[TipoSiniestro] = relationship(lazy="joined")
    centro: Mapped[Sucursal] = relationship(lazy="joined")
    realizo: Mapped[Usuario] = relationship(lazy="joined")
    detalles: Mapped[List["SiniestroDetalle"]] = relationship(back_populates="siniestro", cascade="all, delete-orphan")
    implicados: Mapped[List["Implicado"]] = relationship(back_populates="siniestro", cascade="all, delete-orphan")
    boletin: Mapped[Optional["Boletin"]] = relationship(cascade="all, delete-orphan", uselist=False)


class TipoPerdida(Base):
    __tablename__ = "TipoPerdida"
    idTipoPerdida: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    TipoPerdida: Mapped[str] = mapped_column(String(45))


class SiniestroDetalle(Base):
    __tablename__ = "SiniestrosDetalles"
    idSiniestrosDetelles: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    IdSiniestros: Mapped[int] = mapped_column(Integer, ForeignKey("siniestros.IdSiniestro"))
    IdTipoPerdida: Mapped[int] = mapped_column(Integer, ForeignKey("TipoPerdida.idTipoPerdida"))
    Monto: Mapped[float] = mapped_column(Float)
    Recuperado: Mapped[int] = mapped_column(Integer)  # tinyint
    Detalles: Mapped[Optional[str]] = mapped_column(String(255))

    siniestro: Mapped[Siniestro] = relationship(back_populates="detalles")
    tipo_perdida: Mapped[TipoPerdida] = relationship(lazy="joined")


class Sexo(Base):
    __tablename__ = "Sexo"
    idSexo: Mapped[str] = mapped_column(String(1), primary_key=True)
    Sexo: Mapped[str] = mapped_column(String(6))


class RangoEdad(Base):
    __tablename__ = "RangoEdad"
    idRangoEdad: Mapped[int] = mapped_column(Integer, primary_key=True)
    RangoEdad: Mapped[str] = mapped_column(String(45))


class Implicado(Base):
    __tablename__ = "Implicados"
    idImplicados: Mapped[int] = mapped_column(Integer, primary_key=True)
    IdSiniestros: Mapped[int] = mapped_column(Integer, ForeignKey("siniestros.IdSiniestro"))
    IdSexo: Mapped[str] = mapped_column(String(1), ForeignKey("Sexo.idSexo"))
    IdRangoEdad: Mapped[int] = mapped_column(Integer, ForeignKey("RangoEdad.idRangoEdad"))
    Detalle: Mapped[Optional[str]] = mapped_column(String(255))

    siniestro: Mapped["Siniestro"] = relationship(back_populates="implicados")
    sexo: Mapped[Sexo] = relationship(lazy="joined")
    rango: Mapped[RangoEdad] = relationship(lazy="joined")


class Boletin(Base):
    __tablename__ = "Boletin"
    idBoletin: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    IdSiniestro: Mapped[int] = mapped_column(Integer, ForeignKey("siniestros.IdSiniestro"))
    Boletin: Mapped[Optional[str]] = mapped_column(String(455), nullable=True)
    RutaFoto: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    siniestro: Mapped[Siniestro] = relationship(lazy="joined")


# ====================
# Esquemas Pydantic
# ====================

class DetallePerdida(BaseModel):
    idTipoPerdida: int
    monto: float = Field(ge=0)
    recuperado: bool
    detalle: Optional[str] = None

class DetalleImplicado(BaseModel):
    idSexo: str
    idRangoEdad: int
    detalle: Optional[str] = None

class DetalleBoletin(BaseModel):
    boletin: Optional[str] = None
    rutaFoto: Optional[str] = None

# Modelos para actualización (incluyen IDs para UPDATE)
class DetallePerdidaUpdate(BaseModel):
    idDetalle: Optional[int] = None  # Si no se envía, es una nueva pérdida
    idTipoPerdida: int
    monto: float = Field(ge=0)
    recuperado: bool
    detalle: Optional[str] = None

class DetalleImplicadoUpdate(BaseModel):
    idImplicado: Optional[int] = None  # Si no se envía, es un nuevo implicado
    idSexo: str
    idRangoEdad: int
    detalle: Optional[str] = None

class CrearSiniestro(BaseModel):
    idCentro: str
    fecha: date
    hora: Optional[time] = None
    idTipoCuenta: int
    frustrado: bool
    finalizado: bool = False
    detalle: Optional[str] = None
    idRealizo: int
    perdidas: List[DetallePerdida] = Field(min_items=1, description="Lista de pérdidas asociadas al siniestro")
    implicados: List[DetalleImplicado] = Field(min_items=1, description="Lista de implicados en el siniestro")
    
    # Información del boletín (opcional)
    boletin: Optional[DetalleBoletin] = None
    
    # Campos de compatibilidad (opcional, para mantener API anterior)
    detalleSiniestro: Optional[str] = None
    idTipoPerdida: Optional[int] = None
    monto: Optional[float] = Field(default=None, ge=0)
    recuperado: Optional[bool] = None
    idsexoImplicado: Optional[str] = None
    idRangoEdad: Optional[int] = None
    detalleImplicado: Optional[str] = None


class ActualizarSiniestro(BaseModel):
    # Campos básicos del siniestro
    idCentro: Optional[str] = None
    fecha: Optional[date] = None
    hora: Optional[time] = None
    idTipoCuenta: Optional[int] = None
    frustrado: Optional[bool] = None
    finalizado: Optional[bool] = None
    detalle: Optional[str] = None
    idRealizo: Optional[int] = None
    contemplar: Optional[bool] = None
    
    # Nuevas estructuras para múltiples pérdidas e implicados (con soporte para UPDATE)
    perdidas: Optional[List[DetallePerdidaUpdate]] = None
    implicados: Optional[List[DetalleImplicadoUpdate]] = None
    
    # Información del boletín (opcional)
    boletin: Optional[DetalleBoletin] = None
    
    # Operaciones de gestión (para añadir/eliminar elementos específicos)
    eliminar_perdidas: Optional[List[int]] = Field(default=None, description="IDs de detalles de pérdida a eliminar")
    eliminar_implicados: Optional[List[int]] = Field(default=None, description="IDs de implicados a eliminar")
    
    # Campos de compatibilidad (para mantener API anterior)
    detalleSiniestro: Optional[str] = None
    idTipoPerdida: Optional[int] = None
    monto: Optional[float] = Field(default=None, ge=0)
    recuperado: Optional[bool] = None
    idsexoImplicado: Optional[str] = None
    idRangoEdad: Optional[int] = None
    detalleImplicado: Optional[str] = None


class DetallePerdidaRespuesta(BaseModel):
    idDetalle: int  # ID del detalle de pérdida
    idTipoPerdida: int
    tipoPerdida: str
    monto: float
    recuperado: bool
    detalle: Optional[str] = None

class DetalleImplicadoRespuesta(BaseModel):
    idImplicado: int
    idSexo: str  # ID del sexo
    idRangoEdad: int  # ID del rango de edad
    sexo: str
    rangoEdad: str
    detalle: Optional[str] = None

class RespuestaSiniestrosItem(BaseModel):
    idSiniestro: int
    idCentro: str  # ID de la sucursal
    idTipoCuenta: int  # ID del tipo de siniestro
    fecha: date
    hora: Optional[time] = None
    frustrado: bool
    finalizado: bool
    detalle: Optional[str] = None
    montoEstimado: float
    realizo: str
    centro: str
    tipoSiniestro: str
    perdidas: List[DetallePerdidaRespuesta] = []
    implicados: List[DetalleImplicadoRespuesta] = []
    
    # Campos de compatibilidad (para mantener estructura anterior)
    implicado: Optional[str] = None
    tipoPerdida: Optional[str] = None
    monto: Optional[float] = None
    recuperado: Optional[bool] = None


class RespuestaSimple(BaseModel):
    estatus: bool
    mensaje: str


class RespuestaConsultaSiniestro(RespuestaSimple):
    siniestro: Optional[RespuestaSiniestrosItem] = None


class RespuestaListaSiniestro(RespuestaSimple):
    siniestros: List[RespuestaSiniestrosItem] = []


# ========================
# Modelos para Estadísticas
# ========================

class EstadisticasGenerales(BaseModel):
    total_siniestros: int
    siniestros_frustrados: int
    siniestros_consumados: int
    porcentaje_frustrados: float
    monto_total_perdidas: float
    monto_total_recuperado: float
    porcentaje_recuperacion: float

class EstadisticasPorTipo(BaseModel):
    tipo_siniestro: str
    cantidad: int
    monto_total: float
    porcentaje_del_total: float

class EstadisticasPorSucursal(BaseModel):
    sucursal: str
    zona: str
    cantidad_siniestros: int
    monto_total: float
    ultimo_siniestro: Optional[date] = None

class EstadisticasPorZona(BaseModel):
    zona: str
    cantidad_siniestros: int
    monto_total_perdidas: float
    tipo_siniestro_frecuente: str
    tipo_perdida_frecuente: str
    sucursales_en_zona: int
    porcentaje_del_total: float

class EstadisticasPorMes(BaseModel):
    año: int
    mes: int
    mes_nombre: str
    cantidad_siniestros: int
    monto_total: float
    monto_recuperado: float

class EstadisticasPorTipoPerdida(BaseModel):
    tipo_perdida: str
    cantidad: int
    monto_total: float
    monto_recuperado: float
    porcentaje_recuperacion: float

class DashboardCompleto(BaseModel):
    estadisticas_generales: EstadisticasGenerales
    por_tipo_siniestro: List[EstadisticasPorTipo]
    por_sucursal: List[EstadisticasPorSucursal]
    por_mes: List[EstadisticasPorMes]
    por_tipo_perdida: List[EstadisticasPorTipoPerdida]
    sucursales_mas_afectadas: List[EstadisticasPorSucursal]
    tendencia_mensual: List[EstadisticasPorMes]


# ========================
# Utilidades / Seguridad
# ========================
ROLE_ADMIN = "ADMIN"
ROLE_COORD = "COORD"
ROLE_OPER = "OPER"


def Matches_Contraseña(plain: str, stored: str) -> bool:
    if stored.startswith("$2") and bcrypt is not None:
        try:
            return bcrypt.verify(plain, stored)
        except Exception:
            return False
    return plain == stored


from typing import Generator

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPBasicCredentials = Depends(security), db: Session = Depends(get_db)) -> Usuario:
    username = credentials.username
    password = credentials.password
    try:
        user = db.execute(select(Usuario).where(Usuario.NombreUsuario == username)).scalar_one()
    except NoResultFound:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if user.Estatus != 1:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inactivo")

    if not Matches_Contraseña(password, user.Contrasena):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    return user


def get_role(user: Usuario) -> str:
    # Primero por Id, luego por texto descriptivo
    lvl = getattr(user.nivel, "IdNivelUsuario", None)
    name = (getattr(user.nivel, "NivelUsuario", "") or "").lower()
    if lvl == 1 or "admin" in name:
        return ROLE_ADMIN
    if lvl == 2 or "coordin" in name:
        return ROLE_COORD
    return ROLE_OPER


def require_role(user: Usuario, allowed: List[str]):
    role = get_role(user)
    if role not in allowed:
        raise HTTPException(status_code=403, detail="No tiene permisos para esta acción")


# ========================
# FastAPI app & middlewares
# ========================

app = FastAPI(title="Microservicio Siniestros")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoint para la ruta raíz '/'
@app.get("/")
def root():
    return {"mensaje": "bienvenido a la ApiRestSiniestros"}
# ========================
# Endpoints Usuarios
# ========================
# Endpoints públicos de sucursales
@app.get("/tiposiniestro", response_model=list)
def listar_tipos_siniestro(db: Session = Depends(get_db)):
    tipos = db.execute(select(TipoSiniestro)).scalars().all()
    return [
        {
            "idTipoSiniestro": t.idTipoSiniestro,
            "Cuenta": t.Cuenta
        }
        for t in tipos
    ]

@app.get("/tiposperdida", response_model=list)
def listar_tipos_perdida(db: Session = Depends(get_db)):
    tipos = db.execute(select(TipoPerdida)).scalars().all()
    return [
        {
            "idTipoPerdida": t.idTipoPerdida,
            "TipoPerdida": t.TipoPerdida
        }
        for t in tipos
    ]

@app.get("/sexos", response_model=list)
def listar_sexos(db: Session = Depends(get_db)):
    sexos = db.execute(select(Sexo)).scalars().all()
    return [
        {
            "idSexo": s.idSexo,
            "Sexo": s.Sexo
        }
        for s in sexos
    ]

@app.get("/rangosedad", response_model=list)
def listar_rangos_edad(db: Session = Depends(get_db)):
    rangos = db.execute(select(RangoEdad)).scalars().all()
    return [
        {
            "idRangoEdad": r.idRangoEdad,
            "RangoEdad": r.RangoEdad
        }
        for r in rangos
    ]
@app.get("/sucursales", response_model=list)
def listar_sucursales(db: Session = Depends(get_db)):
    sucursales = db.execute(select(Sucursal)).scalars().all()
    return [
        {
            "IdCentro": s.IdCentro,
            "Sucursales": s.Sucursales,
            "idZona": s.idZona,
            "idEstado": s.idEstado
        }
        for s in sucursales
    ]
@app.get("/zonas")
def listar_zonas(db: Session = Depends(get_db)):
    zonas = db.execute(select(Zona)).scalars().all()
    return [{"idZona": z.idZona, "zona": z.zona} for z in zonas]
# ========================
from fastapi import Query

@app.get("/sucursales/zona")
def sucursales_por_zona(zona: str = Query(..., description="Zona a consultar"), db: Session = Depends(get_db)):
    sucursales = db.execute(select(Sucursal).where(Sucursal.idZona == int(zona))).scalars().all()
    return [{"IdCentro": s.IdCentro, "Sucursales": s.Sucursales, "idZona": s.idZona} for s in sucursales]

@app.get("/sucursales/estado")
def sucursales_por_estado(estado: str = Query(..., description="Estado a consultar"), db: Session = Depends(get_db)):
    sucursales = db.execute(select(Sucursal).where(Sucursal.idEstado == estado)).scalars().all()
    return [{"IdCentro": s.IdCentro, "Sucursales": s.Sucursales, "idEstado": s.idEstado} for s in sucursales]
# ========================
from fastapi.responses import JSONResponse

class SalidaUsuario(BaseModel):
    IdUsuarios: int
    NombreUsuario: str
    NivelUsuarioId: int
    Estatus: int

@app.get("/usuarios", response_model=List[SalidaUsuario])
def listar_usuarios(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    usuarios = db.execute(select(Usuario)).scalars().all()
    return [SalidaUsuario(
        IdUsuarios=u.IdUsuarios,
        NombreUsuario=u.NombreUsuario,
        NivelUsuarioId=u.NivelUsuarioId,
        Estatus=u.Estatus
    ) for u in usuarios]

@app.get("/usuarios/{idUsuario}", response_model=SalidaUsuario)
def consultar_usuario(idUsuario: int, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    u = db.execute(select(Usuario).where(Usuario.IdUsuarios == idUsuario)).scalar_one_or_none()
    if not u:
        raise HTTPException(404, detail="Usuario no encontrado")
    return SalidaUsuario(
        IdUsuarios=u.IdUsuarios,
        NombreUsuario=u.NombreUsuario,
        NivelUsuarioId=u.NivelUsuarioId,
        Estatus=u.Estatus
    )


@app.get("/inicio")
def inicio():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "Conexión exitosa"
    except Exception as e:
        db_status = f"Error de conexión: {str(e)}"
    return {"status": "ok", "db": db_status}


# ========================
# Helpers de negocio
# ========================

def validate_foreign_keys(db: Session, payload: CrearSiniestro | ActualizarSiniestro):
    # idCentro
    if getattr(payload, "idCentro", None) is not None:
        if db.execute(select(Sucursal).where(Sucursal.IdCentro == payload.idCentro)).first() is None:
            raise HTTPException(400, detail="IdCentro no existe")

    # idRealizo
    if getattr(payload, "idRealizo", None) is not None:
        if db.execute(select(Usuario).where(Usuario.IdUsuarios == payload.idRealizo)).first() is None:
            raise HTTPException(400, detail="idRealizo no existe")

    # idTipoCuenta
    if getattr(payload, "idTipoCuenta", None) is not None:
        if db.execute(select(TipoSiniestro).where(TipoSiniestro.idTipoSiniestro == payload.idTipoCuenta)).first() is None:
            raise HTTPException(400, detail="idTipoCuenta no existe")

    # idTipoPerdida
    if getattr(payload, "idTipoPerdida", None) is not None:
        if db.execute(select(TipoPerdida).where(TipoPerdida.idTipoPerdida == payload.idTipoPerdida)).first() is None:
            raise HTTPException(400, detail="idTipoPerdida no existe")

    # idsexoImplicado
    if getattr(payload, "idsexoImplicado", None) is not None:
        if db.execute(select(Sexo).where(Sexo.idSexo == payload.idsexoImplicado)).first() is None:
            raise HTTPException(400, detail="idsexoImplicado no existe")

    # idRangoEdad
    if getattr(payload, "idRangoEdad", None) is not None:
        if db.execute(select(RangoEdad).where(RangoEdad.idRangoEdad == payload.idRangoEdad)).first() is None:
            raise HTTPException(400, detail="idRangoEdad no existe")


def summarize_implicados(s: Siniestro) -> Optional[str]:
    if not s.implicados:
        return None
    parts = []
    for imp in s.implicados:
        sex = getattr(imp.sexo, "Sexo", None)
        rng = getattr(imp.rango, "RangoEdad", None)
        if sex and rng:
            parts.append(f"{sex} {rng}")
        elif sex:
            parts.append(sex)
        elif rng:
            parts.append(rng)
        elif imp.Detalle:
            parts.append(imp.Detalle)
    return ", ".join(parts) if parts else None


def first_or_none(values: List[Optional[str]]) -> Optional[str]:
    for v in values:
        if v:
            return v
    return None


def to_out_item(s: Siniestro) -> RespuestaSiniestrosItem:
    # Calcular monto estimado solo con pérdidas NO recuperadas
    monto_estimado = sum(d.Monto for d in (s.detalles or []) if not d.Recuperado) if s.detalles else 0.0
    
    # Crear lista de todas las pérdidas
    perdidas = []
    if s.detalles:
        for det in s.detalles:
            perdidas.append(DetallePerdidaRespuesta(
                idDetalle=det.idSiniestrosDetelles,  # Agregamos el ID del detalle
                idTipoPerdida=det.IdTipoPerdida,
                tipoPerdida=det.tipo_perdida.TipoPerdida if det.tipo_perdida else f"Tipo {det.IdTipoPerdida}",
                monto=det.Monto,
                recuperado=bool(det.Recuperado),
                detalle=det.Detalles
            ))
    
    # Crear lista de todos los implicados
    implicados = []
    if s.implicados:
        for imp in s.implicados:
            implicados.append(DetalleImplicadoRespuesta(
                idImplicado=imp.idImplicados,
                idSexo=imp.IdSexo,  # Agregamos el ID del sexo
                idRangoEdad=imp.IdRangoEdad,  # Agregamos el ID del rango de edad
                sexo=imp.sexo.Sexo if imp.sexo else f"Sexo {imp.IdSexo}",
                rangoEdad=imp.rango.RangoEdad if imp.rango else f"Rango {imp.IdRangoEdad}",
                detalle=imp.Detalle
            ))
    
    # Para compatibilidad con versión anterior, usar el primer detalle
    first_det = s.detalles[0] if s.detalles else None
    tipo_perdida = first_det.tipo_perdida.TipoPerdida if first_det and first_det.tipo_perdida else None
    detalle = first_det.Detalles if first_det else None
    
    return RespuestaSiniestrosItem(
        idSiniestro=s.IdSiniestro,
        idCentro=s.IdCentro,  # Agregamos el ID de la sucursal
        idTipoCuenta=s.IdTipoCuenta,  # Agregamos el ID del tipo de siniestro
        fecha=s.Fecha,
        hora=s.Hora,
        frustrado=bool(s.Frustrado),
        finalizado=bool(s.Finalizado),
        detalle=s.Detalle,
        montoEstimado=monto_estimado,
        realizo=s.realizo.NombreUsuario if s.realizo else str(s.IdRealizo),
        centro=s.centro.Sucursales if s.centro else s.IdCentro,
        tipoSiniestro=s.tipo.Cuenta if s.tipo else str(s.IdTipoCuenta),
        perdidas=perdidas,
        implicados=implicados,
        # Campos de compatibilidad
        implicado=summarize_implicados(s),
        tipoPerdida=tipo_perdida,
        monto=first_det.Monto if first_det else None,
        recuperado=bool(first_det.Recuperado) if first_det else None,
    )


# ========================
# Endpoints Siniestros
# ========================
@app.post("/siniestros", response_model=RespuestaSimple)
def crear_siniestro(payload: CrearSiniestro, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    # Validaciones
    validate_foreign_keys(db, payload)

    try:
        require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])  # Todos pueden crear

        # 1. Insertar siniestro
        s = Siniestro(
            IdCentro=payload.idCentro,
            Fecha=payload.fecha,
            Hora=payload.hora,
            IdTipoCuenta=payload.idTipoCuenta,
            Frustrado=payload.frustrado,
            Finalizado=payload.finalizado,
            Detalle=payload.detalle if payload.detalle and payload.detalle.strip() else None,
            IdRealizo=payload.idRealizo,
            Contemplar=True,
        )
        db.add(s)
        db.flush()  # para obtener IdSiniestro

        # 2. Insertar múltiples detalles de pérdida
        if payload.perdidas:  # Nueva estructura con múltiples pérdidas
            for perdida in payload.perdidas:
                # Validar que existe el tipo de pérdida
                if db.execute(select(TipoPerdida).where(TipoPerdida.idTipoPerdida == perdida.idTipoPerdida)).first() is None:
                    raise HTTPException(400, detail=f"idTipoPerdida {perdida.idTipoPerdida} no existe")
                
                det = SiniestroDetalle(
                    IdSiniestros=s.IdSiniestro,
                    IdTipoPerdida=perdida.idTipoPerdida,
                    Monto=perdida.monto,
                    Recuperado=int(perdida.recuperado),
                    Detalles=perdida.detalle,
                )
                db.add(det)
        else:  # Compatibilidad con estructura anterior (un solo detalle)
            if not all([payload.idTipoPerdida, payload.monto is not None, payload.recuperado is not None]):
                raise HTTPException(400, detail="Se requiere al menos una pérdida o los campos individuales")
            
            det = SiniestroDetalle(
                IdSiniestros=s.IdSiniestro,
                IdTipoPerdida=payload.idTipoPerdida,
                Monto=payload.monto,
                Recuperado=int(payload.recuperado),
                Detalles=payload.detalleSiniestro,
            )
            db.add(det)
        
        db.flush()

        # 3. Insertar múltiples implicados
        if payload.implicados:  # Nueva estructura con múltiples implicados
            for implicado_data in payload.implicados:
                # Validar que existe el sexo
                if db.execute(select(Sexo).where(Sexo.idSexo == implicado_data.idSexo)).first() is None:
                    raise HTTPException(400, detail=f"idSexo {implicado_data.idSexo} no existe")
                
                # Validar que existe el rango de edad
                if db.execute(select(RangoEdad).where(RangoEdad.idRangoEdad == implicado_data.idRangoEdad)).first() is None:
                    raise HTTPException(400, detail=f"idRangoEdad {implicado_data.idRangoEdad} no existe")
                
                next_id = db.execute(select(func.coalesce(func.max(Implicado.idImplicados), 0) + 1)).scalar_one()
                imp = Implicado(
                    idImplicados=next_id,
                    IdSiniestros=s.IdSiniestro,
                    IdSexo=implicado_data.idSexo,
                    IdRangoEdad=implicado_data.idRangoEdad,
                    Detalle=implicado_data.detalle,
                )
                db.add(imp)
                db.flush()
        else:  # Compatibilidad con estructura anterior (un solo implicado)
            if not all([payload.idsexoImplicado, payload.idRangoEdad]):
                raise HTTPException(400, detail="Se requiere al menos un implicado o los campos individuales")
            
            next_id = db.execute(select(func.coalesce(func.max(Implicado.idImplicados), 0) + 1)).scalar_one()
            imp = Implicado(
                idImplicados=next_id,
                IdSiniestros=s.IdSiniestro,
                IdSexo=payload.idsexoImplicado,
                IdRangoEdad=payload.idRangoEdad,
                Detalle=payload.detalleImplicado,
            )
            db.add(imp)
            db.flush()

        # 4. Crear boletín si se proporciona información
        if payload.boletin and (payload.boletin.boletin or payload.boletin.rutaFoto):
            boletin = Boletin(
                IdSiniestro=s.IdSiniestro,
                Boletin=payload.boletin.boletin,
                RutaFoto=payload.boletin.rutaFoto
            )
            db.add(boletin)
            db.flush()

        db.commit()
        total_perdidas = len(payload.perdidas) if payload.perdidas else 1
        total_implicados = len(payload.implicados) if payload.implicados else 1
        boletin_creado = " con boletín" if payload.boletin and (payload.boletin.boletin or payload.boletin.rutaFoto) else ""
        return {"estatus": True, "mensaje": f"Siniestro creado con Id {s.IdSiniestro}, {total_perdidas} pérdida(s) y {total_implicados} implicado(s) registrado(s){boletin_creado}"}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(400, detail=f"Error de integridad: {str(e.orig)}")


@app.put("/siniestros/{idSiniestro}", response_model=RespuestaSimple)
def editar_siniestro(
    idSiniestro: int = Path(..., ge=1),
    payload: ActualizarSiniestro = ..., 
    db: Session = Depends(get_db), 
    user: Usuario = Depends(get_current_user),
):
    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")

    role = get_role(user)
    if role == ROLE_OPER:
        raise HTTPException(403, detail="Operador no puede modificar siniestros")

    # Validaciones de FK según campos presentes
    validate_foreign_keys(db, payload)

    try:
        # 1. Actualizar campos básicos del siniestro
        def set_if(value, setter):
            if value is not None:
                setter(value)

        set_if(payload.idCentro, lambda v: setattr(s, "IdCentro", v))
        set_if(payload.fecha, lambda v: setattr(s, "Fecha", v))
        set_if(payload.hora, lambda v: setattr(s, "Hora", v))
        set_if(payload.idTipoCuenta, lambda v: setattr(s, "IdTipoCuenta", v))
        set_if(payload.frustrado, lambda v: setattr(s, "Frustrado", v))
        set_if(payload.finalizado, lambda v: setattr(s, "Finalizado", v))
        set_if(payload.detalle, lambda v: setattr(s, "Detalle", v if v and v.strip() else None))
        set_if(payload.idRealizo, lambda v: setattr(s, "IdRealizo", v))

        # Contemplar: solo admin
        if payload.contemplar is not None:
            if role == ROLE_ADMIN:
                s.Contemplar = payload.contemplar

        # 2. Gestión inteligente de pérdidas (UPDATE o INSERT según corresponda)
        if payload.perdidas:
            print(f"📊 Procesando {len(payload.perdidas)} pérdidas")
            
            # Obtener pérdidas existentes del siniestro
            perdidas_existentes = {p.idSiniestrosDetelles: p for p in s.detalles or []}
            perdidas_procesadas = set()
            
            for perdida_data in payload.perdidas:
                # Validar que existe el tipo de pérdida
                if db.execute(select(TipoPerdida).where(TipoPerdida.idTipoPerdida == perdida_data.idTipoPerdida)).first() is None:
                    raise HTTPException(400, detail=f"idTipoPerdida {perdida_data.idTipoPerdida} no existe")
                
                if perdida_data.idDetalle and perdida_data.idDetalle in perdidas_existentes:
                    # ACTUALIZAR pérdida existente
                    detalle_existente = perdidas_existentes[perdida_data.idDetalle]
                    detalle_existente.IdTipoPerdida = perdida_data.idTipoPerdida
                    detalle_existente.Monto = perdida_data.monto
                    detalle_existente.Recuperado = int(perdida_data.recuperado)
                    detalle_existente.Detalles = perdida_data.detalle
                    perdidas_procesadas.add(perdida_data.idDetalle)
                    print(f"🔄 Actualizada pérdida ID: {perdida_data.idDetalle}")
                else:
                    # CREAR nueva pérdida
                    nueva_perdida = SiniestroDetalle(
                        IdSiniestros=s.IdSiniestro,
                        IdTipoPerdida=perdida_data.idTipoPerdida,
                        Monto=perdida_data.monto,
                        Recuperado=int(perdida_data.recuperado),
                        Detalles=perdida_data.detalle,
                    )
                    db.add(nueva_perdida)
                    print(f"➕ Creada nueva pérdida")
            
            # Eliminar pérdidas que no están en la actualización
            for id_perdida, perdida_existente in perdidas_existentes.items():
                if id_perdida not in perdidas_procesadas:
                    db.delete(perdida_existente)
                    print(f"🗑️ Eliminada pérdida ID: {id_perdida}")

        # 3. Gestión inteligente de implicados (UPDATE o INSERT según corresponda)  
        if payload.implicados:
            print(f"👥 Procesando {len(payload.implicados)} implicados")
            
            # Obtener implicados existentes del siniestro
            implicados_existentes = {i.idImplicados: i for i in s.implicados or []}
            implicados_procesados = set()
            
            for implicado_data in payload.implicados:
                # Validar que existe el sexo
                if db.execute(select(Sexo).where(Sexo.idSexo == implicado_data.idSexo)).first() is None:
                    raise HTTPException(400, detail=f"idSexo {implicado_data.idSexo} no existe")
                
                # Validar que existe el rango de edad
                if db.execute(select(RangoEdad).where(RangoEdad.idRangoEdad == implicado_data.idRangoEdad)).first() is None:
                    raise HTTPException(400, detail=f"idRangoEdad {implicado_data.idRangoEdad} no existe")
                
                if implicado_data.idImplicado and implicado_data.idImplicado in implicados_existentes:
                    # ACTUALIZAR implicado existente
                    implicado_existente = implicados_existentes[implicado_data.idImplicado]
                    implicado_existente.IdSexo = implicado_data.idSexo
                    implicado_existente.IdRangoEdad = implicado_data.idRangoEdad
                    implicado_existente.Detalle = implicado_data.detalle
                    implicados_procesados.add(implicado_data.idImplicado)
                    print(f"� Actualizado implicado ID: {implicado_data.idImplicado}")
                else:
                    # CREAR nuevo implicado
                    next_id = db.execute(select(func.coalesce(func.max(Implicado.idImplicados), 0) + 1)).scalar_one()
                    nuevo_implicado = Implicado(
                        idImplicados=next_id,
                        IdSiniestros=s.IdSiniestro,
                        IdSexo=implicado_data.idSexo,
                        IdRangoEdad=implicado_data.idRangoEdad,
                        Detalle=implicado_data.detalle,
                    )
                    db.add(nuevo_implicado)
                    print(f"➕ Creado nuevo implicado ID: {next_id}")
            
            # Eliminar implicados que no están en la actualización
            for id_implicado, implicado_existente in implicados_existentes.items():
                if id_implicado not in implicados_procesados:
                    db.delete(implicado_existente)
                    print(f"🗑️ Eliminado implicado ID: {id_implicado}")

        # 4. Eliminar elementos especificados explícitamente (compatibilidad con API anterior)
        if payload.eliminar_perdidas:
            for detalle_id in payload.eliminar_perdidas:
                detalle = db.execute(select(SiniestroDetalle).where(
                    and_(SiniestroDetalle.IdSiniestros == s.IdSiniestro, 
                         SiniestroDetalle.idSiniestrosDetelles == detalle_id)
                )).scalar_one_or_none()
                if detalle:
                    db.delete(detalle)
                    print(f"🗑️ Eliminada pérdida específica ID: {detalle_id}")

        if payload.eliminar_implicados:
            for implicado_id in payload.eliminar_implicados:
                implicado = db.execute(select(Implicado).where(
                    and_(Implicado.IdSiniestros == s.IdSiniestro, 
                         Implicado.idImplicados == implicado_id)
                )).scalar_one_or_none()
                if implicado:
                    db.delete(implicado)
                    print(f"🗑️ Eliminado implicado específico ID: {implicado_id}")

        # 6. Compatibilidad con estructura anterior (actualizar primer detalle/implicado)
        if any(x is not None for x in [payload.idTipoPerdida, payload.monto, payload.recuperado, payload.detalleSiniestro]):
            first_det = s.detalles[0] if s.detalles else None
            if first_det:
                if payload.idTipoPerdida is not None:
                    first_det.IdTipoPerdida = payload.idTipoPerdida
                if payload.monto is not None:
                    first_det.Monto = payload.monto
                if payload.recuperado is not None:
                    first_det.Recuperado = int(payload.recuperado)
                if payload.detalleSiniestro is not None:
                    first_det.Detalles = payload.detalleSiniestro
            elif all(x is not None for x in [payload.idTipoPerdida, payload.monto, payload.recuperado]):
                # Crear detalle si no existe
                det = SiniestroDetalle(
                    IdSiniestros=s.IdSiniestro,
                    IdTipoPerdida=payload.idTipoPerdida,
                    Monto=payload.monto,
                    Recuperado=int(payload.recuperado),
                    Detalles=payload.detalleSiniestro,
                )
                db.add(det)

        if any(x is not None for x in [payload.idsexoImplicado, payload.idRangoEdad, payload.detalleImplicado]):
            first_imp = s.implicados[0] if s.implicados else None
            if first_imp:
                if payload.idsexoImplicado is not None:
                    first_imp.IdSexo = payload.idsexoImplicado
                if payload.idRangoEdad is not None:
                    first_imp.IdRangoEdad = payload.idRangoEdad
                if payload.detalleImplicado is not None:
                    first_imp.Detalle = payload.detalleImplicado
            elif all(x is not None for x in [payload.idsexoImplicado, payload.idRangoEdad]):
                # Crear implicado si no existe
                next_id = db.execute(select(func.coalesce(func.max(Implicado.idImplicados), 0) + 1)).scalar_one()
                imp = Implicado(
                    idImplicados=next_id,
                    IdSiniestros=s.IdSiniestro,
                    IdSexo=payload.idsexoImplicado,
                    IdRangoEdad=payload.idRangoEdad,
                    Detalle=payload.detalleImplicado,
                )
                db.add(imp)

        db.commit()
        
        # Contar elementos actualizados
        total_perdidas = len(s.detalles) if s.detalles else 0
        total_implicados = len(s.implicados) if s.implicados else 0
        
        return {"estatus": True, "mensaje": f"Siniestro {idSiniestro} actualizado. {total_perdidas} pérdida(s), {total_implicados} implicado(s)"}
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(400, detail=f"Error de integridad: {str(e.orig)}")


@app.get("/siniestros", dependencies=[Depends(get_current_user)])
def listar_siniestros(db: Session = Depends(get_db)):
    """
    Listar todos los siniestros con información completa
    """
    try:
        # Consulta para obtener siniestros con relaciones
        siniestros = db.query(Siniestro).options(
            selectinload(Siniestro.tipo),
            selectinload(Siniestro.centro),
            selectinload(Siniestro.realizo),
            selectinload(Siniestro.detalles),
            selectinload(Siniestro.implicados)
        ).all()
        
        # Formatear datos
        siniestros_data = []
        for s in siniestros:
            # Calcular monto total de pérdidas (solo las NO recuperadas)
            monto_total = sum(detalle.Monto for detalle in s.detalles if not detalle.Recuperado)
            # Calcular monto recuperado (solo las recuperadas)
            monto_recuperado = sum(detalle.Monto for detalle in s.detalles if detalle.Recuperado)
            
            siniestros_data.append({
                "IdSiniestro": s.IdSiniestro,
                "IdCentro": s.IdCentro,
                "Fecha": s.Fecha.strftime('%Y-%m-%d'),
                "Hora": s.Hora.strftime('%H:%M:%S') if s.Hora else None,
                "TipoSiniestro": s.tipo.Cuenta if s.tipo else "N/A",
                "IdTipoCuenta": s.IdTipoCuenta,
                "Frustrado": s.Frustrado,
                "Finalizado": s.Finalizado,
                "Detalle": s.Detalle,
                "Contemplar": s.Contemplar,
                "Sucursal": s.centro.Sucursales if s.centro else "N/A",
                "Usuario": s.realizo.NombreUsuario if s.realizo else "N/A",
                "MontoTotal": monto_total,
                "MontoRecuperado": monto_recuperado,
                "CantidadDetalles": len(s.detalles),
                "CantidadImplicados": len(s.implicados)
            })
        
        return {
            "success": True,
            "data": siniestros_data,
            "total": len(siniestros_data)
        }
        
    except Exception as e:
        print(f"Error en listar_siniestros: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener siniestros: {str(e)}"
        )

@app.get("/siniestros/{idSiniestro}", response_model=RespuestaConsultaSiniestro)
def consultar_siniestro_por_id(
    idSiniestro: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    # Permisos: Admin, Coord, Operador, Gerente (si existiera). Aquí admitimos cualquiera autenticado
    s = db.get(Siniestro, idSiniestro)
    if not s:
        return {"estatus": False, "mensaje": "No encontrado", "siniestro": None}
    # precarga relaciones
    _ = s.detalles, s.implicados
    out = to_out_item(s)
    return {"estatus": True, "mensaje": "OK", "siniestro": out}


@app.get("/siniestros/tipo/{idTipoSiniestro}", response_model=RespuestaListaSiniestro)
def consultar_siniestros_por_tipo(
    idTipoSiniestro: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    q = db.execute(select(Siniestro).where(Siniestro.IdTipoCuenta == idTipoSiniestro)).scalars().all()
    items = []
    for s in q:
        _ = s.detalles, s.implicados
        items.append(to_out_item(s))
    return {"estatus": True, "mensaje": f"{len(items)} registro(s)", "siniestros": items}


@app.get("/siniestros/fecha/{fecha}", response_model=RespuestaListaSiniestro)
def consultar_siniestros_por_fecha(
    fecha: date,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    q = db.execute(select(Siniestro).where(Siniestro.Fecha == fecha)).scalars().all()
    items = []
    for s in q:
        _ = s.detalles, s.implicados
        items.append(to_out_item(s))
    return {"estatus": True, "mensaje": f"{len(items)} registro(s)", "siniestros": items}


@app.delete("/siniestros/{idSiniestro}", response_model=RespuestaSimple)
def eliminar_siniestro(
    idSiniestro: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    # Permisos: Administradores y Coordinadores
    require_role(user, [ROLE_ADMIN, ROLE_COORD])
    
    print(f"🗑️ Admin {user.NombreUsuario} eliminando siniestro {idSiniestro}")

    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")

    # Contar elementos a eliminar
    num_perdidas = len(s.detalles or [])
    num_implicados = len(s.implicados or [])
    
    print(f"📊 Eliminando {num_perdidas} pérdidas y {num_implicados} implicados")

    # Borrar hijos manualmente por restricciones NO ACTION
    for det in list(s.detalles or []):
        db.delete(det)
    for imp in list(s.implicados or []):
        db.delete(imp)
    db.flush()

    db.delete(s)
    db.commit()
    
    print(f"✅ Siniestro {idSiniestro} eliminado completamente")
    return {"estatus": True, "mensaje": f"Siniestro {idSiniestro} eliminado exitosamente junto con {num_perdidas} pérdidas y {num_implicados} implicados"}


# ========================
# Endpoints para gestión específica de pérdidas e implicados
# ========================

@app.post("/siniestros/{idSiniestro}/perdidas", response_model=RespuestaSimple)
def agregar_perdida(
    idSiniestro: int = Path(..., ge=1),
    perdida: DetallePerdida = ...,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    require_role(user, [ROLE_ADMIN, ROLE_COORD])  # Solo admin y coord pueden agregar
    
    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")
    
    # Validar que existe el tipo de pérdida
    if db.execute(select(TipoPerdida).where(TipoPerdida.idTipoPerdida == perdida.idTipoPerdida)).first() is None:
        raise HTTPException(400, detail=f"idTipoPerdida {perdida.idTipoPerdida} no existe")
    
    det = SiniestroDetalle(
        IdSiniestros=s.IdSiniestro,
        IdTipoPerdida=perdida.idTipoPerdida,
        Monto=perdida.monto,
        Recuperado=int(perdida.recuperado),
        Detalles=perdida.detalle,
    )
    db.add(det)
    db.commit()
    
    return {"estatus": True, "mensaje": f"Pérdida agregada al siniestro {idSiniestro}"}


@app.post("/siniestros/{idSiniestro}/implicados", response_model=RespuestaSimple)
def agregar_implicado(
    idSiniestro: int = Path(..., ge=1),
    implicado: DetalleImplicado = ...,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    require_role(user, [ROLE_ADMIN, ROLE_COORD])  # Solo admin y coord pueden agregar
    
    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")
    
    # Validaciones
    if db.execute(select(Sexo).where(Sexo.idSexo == implicado.idSexo)).first() is None:
        raise HTTPException(400, detail=f"idSexo {implicado.idSexo} no existe")
    
    if db.execute(select(RangoEdad).where(RangoEdad.idRangoEdad == implicado.idRangoEdad)).first() is None:
        raise HTTPException(400, detail=f"idRangoEdad {implicado.idRangoEdad} no existe")
    
    next_id = db.execute(select(func.coalesce(func.max(Implicado.idImplicados), 0) + 1)).scalar_one()
    imp = Implicado(
        idImplicados=next_id,
        IdSiniestros=s.IdSiniestro,
        IdSexo=implicado.idSexo,
        IdRangoEdad=implicado.idRangoEdad,
        Detalle=implicado.detalle,
    )
    db.add(imp)
    db.commit()
    
    return {"estatus": True, "mensaje": f"Implicado agregado al siniestro {idSiniestro}"}


@app.delete("/siniestros/{idSiniestro}/perdidas/{idDetalle}", response_model=RespuestaSimple)
def eliminar_perdida(
    idSiniestro: int = Path(..., ge=1),
    idDetalle: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    require_role(user, [ROLE_ADMIN, ROLE_COORD])
    
    detalle = db.execute(select(SiniestroDetalle).where(
        and_(SiniestroDetalle.IdSiniestros == idSiniestro, 
             SiniestroDetalle.idSiniestrosDetelles == idDetalle)
    )).scalar_one_or_none()
    
    if not detalle:
        raise HTTPException(404, detail="Pérdida no encontrada")
    
    db.delete(detalle)
    db.commit()
    
    return {"estatus": True, "mensaje": f"Pérdida eliminada del siniestro {idSiniestro}"}


@app.delete("/siniestros/{idSiniestro}/implicados/{idImplicado}", response_model=RespuestaSimple)
def eliminar_implicado(
    idSiniestro: int = Path(..., ge=1),
    idImplicado: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    require_role(user, [ROLE_ADMIN, ROLE_COORD])
    
    implicado = db.execute(select(Implicado).where(
        and_(Implicado.IdSiniestros == idSiniestro, 
             Implicado.idImplicados == idImplicado)
    )).scalar_one_or_none()
    
    if not implicado:
        raise HTTPException(404, detail="Implicado no encontrado")
    
    db.delete(implicado)
    db.commit()
    
    return {"estatus": True, "mensaje": f"Implicado eliminado del siniestro {idSiniestro}"}


# ========================
# Endpoints de Boletines
# ========================

@app.post("/siniestros/{idSiniestro}/boletin", response_model=RespuestaSimple)
def crear_boletin(
    idSiniestro: int = Path(..., ge=1),
    boletin: str = "",
    rutaFoto: str = "",
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Crear o actualizar boletín para un siniestro"""
    require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])
    
    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")
    
    # Verificar si ya existe un boletín
    boletin_existente = db.execute(select(Boletin).where(Boletin.IdSiniestro == idSiniestro)).scalar_one_or_none()
    
    if boletin_existente:
        # Actualizar boletín existente
        boletin_existente.Boletin = boletin if boletin else boletin_existente.Boletin
        boletin_existente.RutaFoto = rutaFoto if rutaFoto else boletin_existente.RutaFoto
        mensaje = f"Boletín actualizado para siniestro {idSiniestro}"
    else:
        # Crear nuevo boletín
        nuevo_boletin = Boletin(
            IdSiniestro=idSiniestro,
            Boletin=boletin,
            RutaFoto=rutaFoto
        )
        db.add(nuevo_boletin)
        mensaje = f"Boletín creado para siniestro {idSiniestro}"
    
    db.commit()
    return {"estatus": True, "mensaje": mensaje}


@app.get("/siniestros/{idSiniestro}/boletin")
def obtener_boletin(
    idSiniestro: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Obtener boletín de un siniestro"""
    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")
    
    boletin = db.execute(select(Boletin).where(Boletin.IdSiniestro == idSiniestro)).scalar_one_or_none()
    
    if not boletin:
        return {"estatus": False, "mensaje": "No hay boletín para este siniestro", "boletin": None}
    
    return {
        "estatus": True,
        "mensaje": "Boletín encontrado",
        "boletin": {
            "idBoletin": boletin.idBoletin,
            "idSiniestro": boletin.IdSiniestro,
            "boletin": boletin.Boletin,
            "rutaFoto": boletin.RutaFoto
        }
    }


# Endpoint antiguo comentado - usar /siniestros/{idSiniestro}/foto/subir en su lugar
# @app.post("/upload-foto/{idSiniestro}")
# async def subir_foto_siniestro(
#     idSiniestro: int = Path(..., ge=1),
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     user: Usuario = Depends(get_current_user),
# ):
#     """Subir foto para un siniestro"""
#     require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])
#     
#     # Verificar que el siniestro existe
#     s = db.get(Siniestro, idSiniestro)
#     if not s:
#         raise HTTPException(404, detail="Siniestro no encontrado")
#     
#     # Crear directorio si no existe
#     upload_dir = f"uploads/siniestros/{idSiniestro}"
#     os.makedirs(upload_dir, exist_ok=True)
#     
#     # Generar nombre único para el archivo
#     file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
#     filename = f"foto_siniestro_{idSiniestro}.{file_extension}"
#     file_path = os.path.join(upload_dir, filename)
#     
#     # Guardar archivo
#     try:
#         with open(file_path, "wb") as buffer:
#             content = await file.read()
#             buffer.write(content)
#     except Exception as e:
#         raise HTTPException(500, detail=f"Error al guardar archivo: {str(e)}")
#     
#     # Actualizar o crear boletín con la ruta de la foto
#     boletin_existente = db.execute(select(Boletin).where(Boletin.IdSiniestro == idSiniestro)).scalar_one_or_none()
#     
#     if boletin_existente:
#         boletin_existente.RutaFoto = file_path
#     else:
#         nuevo_boletin = Boletin(
#             IdSiniestro=idSiniestro,
#             RutaFoto=file_path
#         )
#         db.add(nuevo_boletin)
#     
#     db.commit()
#     
#     return {
#         "estatus": True,
#         "mensaje": "Foto subida exitosamente",
#         "rutaFoto": file_path,
#         "nombreArchivo": filename
#     }


# ========================
# Endpoints de Estadísticas y Reportes
# ========================

@app.get("/estadisticas/generales", response_model=EstadisticasGenerales)
def estadisticas_generales(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Obtener estadísticas generales de siniestros"""
    
    # Construir query base
    query = select(Siniestro)
    if fecha_inicio and fecha_fin:
        query = query.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
    elif fecha_inicio:
        query = query.where(Siniestro.Fecha >= fecha_inicio)
    elif fecha_fin:
        query = query.where(Siniestro.Fecha <= fecha_fin)
    
    siniestros = db.execute(query).scalars().all()
    
    # Calcular estadísticas
    total_siniestros = len(siniestros)
    siniestros_frustrados = sum(1 for s in siniestros if s.Frustrado)
    siniestros_consumados = total_siniestros - siniestros_frustrados
    
    # Calcular montos
    monto_total_perdidas = 0.0
    monto_total_recuperado = 0.0
    
    for s in siniestros:
        for detalle in s.detalles or []:
            if detalle.Recuperado:
                # Si está marcado como recuperado, suma al monto recuperado
                monto_total_recuperado += detalle.Monto
            else:
                # Si NO está recuperado, suma al monto de pérdidas reales
                monto_total_perdidas += detalle.Monto
    
    # Calcular porcentajes
    porcentaje_frustrados = (siniestros_frustrados / total_siniestros * 100) if total_siniestros > 0 else 0
    porcentaje_recuperacion = (monto_total_recuperado / monto_total_perdidas * 100) if monto_total_perdidas > 0 else 0
    
    return EstadisticasGenerales(
        total_siniestros=total_siniestros,
        siniestros_frustrados=siniestros_frustrados,
        siniestros_consumados=siniestros_consumados,
        porcentaje_frustrados=round(porcentaje_frustrados, 2),
        monto_total_perdidas=round(monto_total_perdidas, 2),
        monto_total_recuperado=round(monto_total_recuperado, 2),
        porcentaje_recuperacion=round(porcentaje_recuperacion, 2)
    )


@app.get("/estadisticas/por-tipo", response_model=List[EstadisticasPorTipo])
def estadisticas_por_tipo(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Estadísticas agrupadas por tipo de siniestro"""
    
    # Query corregida: contar siniestros únicos y solo pérdidas NO recuperadas
    query = select(
        TipoSiniestro.Cuenta,
        func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad'),
        func.coalesce(func.sum(case((SiniestroDetalle.Recuperado == False, SiniestroDetalle.Monto), else_=0)), 0).label('monto_total')
    ).select_from(
        Siniestro.__table__.join(TipoSiniestro.__table__, Siniestro.IdTipoCuenta == TipoSiniestro.idTipoSiniestro)
        .outerjoin(SiniestroDetalle.__table__, Siniestro.IdSiniestro == SiniestroDetalle.IdSiniestros)
    ).group_by(TipoSiniestro.idTipoSiniestro, TipoSiniestro.Cuenta)
    
    if fecha_inicio and fecha_fin:
        query = query.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
    elif fecha_inicio:
        query = query.where(Siniestro.Fecha >= fecha_inicio)
    elif fecha_fin:
        query = query.where(Siniestro.Fecha <= fecha_fin)
    
    resultados = db.execute(query).all()
    
    # Calcular total para porcentajes
    total_siniestros = sum(r.cantidad for r in resultados)
    
    estadisticas = []
    for r in resultados:
        porcentaje = (r.cantidad / total_siniestros * 100) if total_siniestros > 0 else 0
        estadisticas.append(EstadisticasPorTipo(
            tipo_siniestro=r.Cuenta,
            cantidad=r.cantidad,
            monto_total=float(r.monto_total),
            porcentaje_del_total=round(porcentaje, 2)
        ))
    
    return sorted(estadisticas, key=lambda x: x.cantidad, reverse=True)


@app.get("/estadisticas/por-sucursal", response_model=List[EstadisticasPorSucursal])
def estadisticas_por_sucursal(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    limite: int = 20,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Estadísticas agrupadas por sucursal"""
    
    # Query corregida: contar siniestros únicos, no detalles
    query = select(
        Sucursal.Sucursales,
        Zona.zona,
        func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad_siniestros'),
        func.coalesce(func.sum(SiniestroDetalle.Monto), 0).label('monto_total'),
        func.max(Siniestro.Fecha).label('ultimo_siniestro')
    ).select_from(
        Siniestro.__table__
        .join(Sucursal.__table__, Siniestro.IdCentro == Sucursal.IdCentro)
        .join(Zona.__table__, Sucursal.idZona == Zona.idZona)
        .outerjoin(SiniestroDetalle.__table__, Siniestro.IdSiniestro == SiniestroDetalle.IdSiniestros)
    ).group_by(Sucursal.IdCentro, Sucursal.Sucursales, Zona.zona)
    
    if fecha_inicio and fecha_fin:
        query = query.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
    elif fecha_inicio:
        query = query.where(Siniestro.Fecha >= fecha_inicio)
    elif fecha_fin:
        query = query.where(Siniestro.Fecha <= fecha_fin)
    
    query = query.order_by(func.count(func.distinct(Siniestro.IdSiniestro)).desc()).limit(limite)
    
    resultados = db.execute(query).all()
    
    estadisticas = []
    for r in resultados:
        estadisticas.append(EstadisticasPorSucursal(
            sucursal=r.Sucursales,
            zona=r.zona,
            cantidad_siniestros=r.cantidad_siniestros,
            monto_total=float(r.monto_total),
            ultimo_siniestro=r.ultimo_siniestro
        ))
    
    return estadisticas


@app.get("/estadisticas/por-zona", response_model=List[EstadisticasPorZona])
def estadisticas_por_zona(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Estadísticas completas agrupadas por zona geográfica"""
    
    # Query principal para obtener estadísticas básicas por zona
    query_base = select(
        Zona.zona,
        func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad_siniestros'),
        func.coalesce(func.sum(
            case((SiniestroDetalle.Recuperado == False, SiniestroDetalle.Monto), else_=0)
        ), 0).label('monto_total_perdidas'),
        func.count(func.distinct(Sucursal.IdCentro)).label('sucursales_en_zona')
    ).select_from(
        Zona.__table__
        .join(Sucursal.__table__, Zona.idZona == Sucursal.idZona)
        .outerjoin(Siniestro.__table__, Sucursal.IdCentro == Siniestro.IdCentro)
        .outerjoin(SiniestroDetalle.__table__, Siniestro.IdSiniestro == SiniestroDetalle.IdSiniestros)
    ).group_by(Zona.idZona, Zona.zona)
    
    # Aplicar filtros de fecha
    if fecha_inicio and fecha_fin:
        query_base = query_base.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
    elif fecha_inicio:
        query_base = query_base.where(Siniestro.Fecha >= fecha_inicio)
    elif fecha_fin:
        query_base = query_base.where(Siniestro.Fecha <= fecha_fin)
    
    resultados_base = db.execute(query_base).all()
    
    # Calcular total de siniestros para porcentajes
    total_siniestros = sum(r.cantidad_siniestros for r in resultados_base)
    
    estadisticas = []
    
    for r in resultados_base:
        # Obtener tipo de siniestro más frecuente en la zona
        query_tipo_siniestro = select(
            TipoSiniestro.Cuenta,
            func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad')
        ).select_from(
            Siniestro.__table__
            .join(Sucursal.__table__, Siniestro.IdCentro == Sucursal.IdCentro)
            .join(Zona.__table__, Sucursal.idZona == Zona.idZona)
            .join(TipoSiniestro.__table__, Siniestro.IdTipoCuenta == TipoSiniestro.idTipoSiniestro)
        ).where(Zona.zona == r.zona).group_by(TipoSiniestro.idTipoSiniestro, TipoSiniestro.Cuenta).order_by(func.count(func.distinct(Siniestro.IdSiniestro)).desc()).limit(1)
        
        # Aplicar mismos filtros de fecha
        if fecha_inicio and fecha_fin:
            query_tipo_siniestro = query_tipo_siniestro.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
        elif fecha_inicio:
            query_tipo_siniestro = query_tipo_siniestro.where(Siniestro.Fecha >= fecha_inicio)
        elif fecha_fin:
            query_tipo_siniestro = query_tipo_siniestro.where(Siniestro.Fecha <= fecha_fin)
            
        tipo_siniestro_resultado = db.execute(query_tipo_siniestro).first()
        tipo_siniestro_frecuente = tipo_siniestro_resultado.Cuenta if tipo_siniestro_resultado else "N/A"
        
        # Obtener tipo de pérdida más frecuente en la zona
        query_tipo_perdida = select(
            TipoPerdida.TipoPerdida,
            func.count(SiniestroDetalle.idSiniestrosDetelles).label('cantidad')
        ).select_from(
            SiniestroDetalle.__table__
            .join(Siniestro.__table__, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro)
            .join(Sucursal.__table__, Siniestro.IdCentro == Sucursal.IdCentro)
            .join(Zona.__table__, Sucursal.idZona == Zona.idZona)
            .join(TipoPerdida.__table__, SiniestroDetalle.IdTipoPerdida == TipoPerdida.idTipoPerdida)
        ).where(Zona.zona == r.zona).group_by(TipoPerdida.idTipoPerdida, TipoPerdida.TipoPerdida).order_by(func.count(SiniestroDetalle.idSiniestrosDetelles).desc()).limit(1)
        
        # Aplicar mismos filtros de fecha
        if fecha_inicio and fecha_fin:
            query_tipo_perdida = query_tipo_perdida.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
        elif fecha_inicio:
            query_tipo_perdida = query_tipo_perdida.where(Siniestro.Fecha >= fecha_inicio)
        elif fecha_fin:
            query_tipo_perdida = query_tipo_perdida.where(Siniestro.Fecha <= fecha_fin)
            
        tipo_perdida_resultado = db.execute(query_tipo_perdida).first()
        tipo_perdida_frecuente = tipo_perdida_resultado.TipoPerdida if tipo_perdida_resultado else "N/A"
        
        # Calcular porcentaje del total
        porcentaje = (r.cantidad_siniestros / total_siniestros * 100) if total_siniestros > 0 else 0
        
        estadisticas.append(EstadisticasPorZona(
            zona=r.zona,
            cantidad_siniestros=r.cantidad_siniestros,
            monto_total_perdidas=float(r.monto_total_perdidas),
            tipo_siniestro_frecuente=tipo_siniestro_frecuente,
            tipo_perdida_frecuente=tipo_perdida_frecuente,
            sucursales_en_zona=r.sucursales_en_zona,
            porcentaje_del_total=round(porcentaje, 2)
        ))
    
    return sorted(estadisticas, key=lambda x: x.cantidad_siniestros, reverse=True)


@app.get("/estadisticas/por-mes", response_model=List[EstadisticasPorMes])
def estadisticas_por_mes(
    año: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Estadísticas mensuales para gráficos de tendencias"""
    
    # Si no se especifica año, usar el año actual
    if año is None:
        from datetime import datetime
        año = datetime.now().year
    
    # Query corregida para obtener datos por mes
    query = select(
        func.year(Siniestro.Fecha).label('año'),
        func.month(Siniestro.Fecha).label('mes'),
        func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad_siniestros'),
        func.coalesce(func.sum(SiniestroDetalle.Monto), 0).label('monto_total'),
        func.coalesce(
            func.sum(case((SiniestroDetalle.Recuperado == 1, SiniestroDetalle.Monto * 0.6), else_=0)), 0
        ).label('monto_recuperado')
    ).select_from(
        Siniestro.__table__
        .outerjoin(SiniestroDetalle.__table__, Siniestro.IdSiniestro == SiniestroDetalle.IdSiniestros)
    ).where(
        func.year(Siniestro.Fecha) == año
    ).group_by(
        func.year(Siniestro.Fecha), func.month(Siniestro.Fecha)
    ).order_by(
        func.month(Siniestro.Fecha)
    )
    
    resultados = db.execute(query).all()
    
    # Nombres de meses
    nombres_meses = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    
    estadisticas = []
    for r in resultados:
        estadisticas.append(EstadisticasPorMes(
            año=r.año,
            mes=r.mes,
            mes_nombre=nombres_meses[r.mes],
            cantidad_siniestros=r.cantidad_siniestros,
            monto_total=float(r.monto_total),
            monto_recuperado=float(r.monto_recuperado)
        ))
    
    return estadisticas


@app.get("/estadisticas/por-tipo-perdida", response_model=List[EstadisticasPorTipoPerdida])
def estadisticas_por_tipo_perdida(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Estadísticas por tipo de pérdida"""
    
    query = select(
        TipoPerdida.TipoPerdida,
        func.count(SiniestroDetalle.idSiniestrosDetelles).label('cantidad'),
        func.sum(SiniestroDetalle.Monto).label('monto_total'),
        func.sum(
            case((SiniestroDetalle.Recuperado == 1, SiniestroDetalle.Monto * 0.6), else_=0)
        ).label('monto_recuperado')
    ).select_from(
        SiniestroDetalle.__table__
        .join(TipoPerdida.__table__, SiniestroDetalle.IdTipoPerdida == TipoPerdida.idTipoPerdida)
        .join(Siniestro.__table__, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro)
    ).group_by(TipoPerdida.idTipoPerdida, TipoPerdida.TipoPerdida)
    
    if fecha_inicio and fecha_fin:
        query = query.where(and_(Siniestro.Fecha >= fecha_inicio, Siniestro.Fecha <= fecha_fin))
    elif fecha_inicio:
        query = query.where(Siniestro.Fecha >= fecha_inicio)
    elif fecha_fin:
        query = query.where(Siniestro.Fecha <= fecha_fin)
    
    query = query.order_by(func.sum(SiniestroDetalle.Monto).desc())
    
    resultados = db.execute(query).all()
    
    estadisticas = []
    for r in resultados:
        monto_total = float(r.monto_total) if r.monto_total else 0
        monto_recuperado = float(r.monto_recuperado) if r.monto_recuperado else 0
        porcentaje_recuperacion = (monto_recuperado / monto_total * 100) if monto_total > 0 else 0
        
        estadisticas.append(EstadisticasPorTipoPerdida(
            tipo_perdida=r.TipoPerdida,
            cantidad=r.cantidad,
            monto_total=monto_total,
            monto_recuperado=monto_recuperado,
            porcentaje_recuperacion=round(porcentaje_recuperacion, 2)
        ))
    
    return estadisticas


@app.get("/dashboard", response_model=DashboardCompleto)
def dashboard_completo(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Dashboard completo con todas las estadísticas"""
    
    # Obtener todas las estadísticas
    stats_generales = estadisticas_generales(fecha_inicio, fecha_fin, db, user)
    stats_por_tipo = estadisticas_por_tipo(fecha_inicio, fecha_fin, db, user)
    stats_por_sucursal = estadisticas_por_sucursal(fecha_inicio, fecha_fin, 10, db, user)
    stats_por_mes = estadisticas_por_mes(None, db, user)  # Año actual
    stats_por_tipo_perdida = estadisticas_por_tipo_perdida(fecha_inicio, fecha_fin, db, user)
    
    # Top 5 sucursales más afectadas
    sucursales_mas_afectadas = stats_por_sucursal[:5]
    
    # Últimos 6 meses para tendencia
    tendencia_mensual = stats_por_mes[-6:] if len(stats_por_mes) >= 6 else stats_por_mes
    
    return DashboardCompleto(
        estadisticas_generales=stats_generales,
        por_tipo_siniestro=stats_por_tipo,
        por_sucursal=stats_por_sucursal,
        por_mes=stats_por_mes,
        por_tipo_perdida=stats_por_tipo_perdida,
        sucursales_mas_afectadas=sucursales_mas_afectadas,
        tendencia_mensual=tendencia_mensual
    )


@app.get("/estadisticas/kpis")
def indicadores_clave(
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Indicadores clave de rendimiento (KPIs) para directivos"""
    
    from datetime import datetime, timedelta
    
    # Fechas para comparaciones
    hoy = datetime.now().date()
    hace_30_dias = hoy - timedelta(days=30)
    hace_7_dias = hoy - timedelta(days=7)
    inicio_año = date(hoy.year, 1, 1)
    
    # KPIs básicos
    stats_mes = estadisticas_generales(hace_30_dias, hoy, db, user)
    stats_semana = estadisticas_generales(hace_7_dias, hoy, db, user)
    stats_año = estadisticas_generales(inicio_año, hoy, db, user)
    
    # Sucursal más problemática del mes
    sucursales_mes = estadisticas_por_sucursal(hace_30_dias, hoy, 1, db, user)
    sucursal_problema = sucursales_mes[0] if sucursales_mes else None
    
    # Tipo de siniestro más común
    tipos_mes = estadisticas_por_tipo(hace_30_dias, hoy, db, user)
    tipo_mas_frecuente = tipos_mes[0] if tipos_mes else None
    
    return {
        "fecha_reporte": hoy,
        "resumen_ejecutivo": {
            "siniestros_mes": stats_mes.total_siniestros,
            "siniestros_semana": stats_semana.total_siniestros,
            "monto_perdido_mes": stats_mes.monto_total_perdidas,
            "porcentaje_recuperacion_mes": stats_mes.porcentaje_recuperacion,
            "tendencia_vs_mes_anterior": "📈 +15%" if stats_mes.total_siniestros > 10 else "📉 -5%"  # Ejemplo
        },
        "alertas": {
            "sucursal_mas_afectada": {
                "nombre": sucursal_problema.sucursal if sucursal_problema else "N/A",
                "siniestros": sucursal_problema.cantidad_siniestros if sucursal_problema else 0,
                "monto": sucursal_problema.monto_total if sucursal_problema else 0
            },
            "tipo_mas_frecuente": {
                "tipo": tipo_mas_frecuente.tipo_siniestro if tipo_mas_frecuente else "N/A",
                "cantidad": tipo_mas_frecuente.cantidad if tipo_mas_frecuente else 0,
                "porcentaje": tipo_mas_frecuente.porcentaje_del_total if tipo_mas_frecuente else 0
            }
        },
        "comparativas": {
            "año_actual": {
                "total_siniestros": stats_año.total_siniestros,
                "monto_total": stats_año.monto_total_perdidas,
                "recuperacion": stats_año.porcentaje_recuperacion
            },
            "ultimo_mes": {
                "total_siniestros": stats_mes.total_siniestros,
                "monto_total": stats_mes.monto_total_perdidas,
                "recuperacion": stats_mes.porcentaje_recuperacion
            }
        }
    }

# ========================
# Endpoint Vista de Sucursales
# ========================
@app.get("/vista_sucursales", dependencies=[Depends(get_current_user)])
async def vista_sucursales(db: Session = Depends(get_db)):
    """
    Vista de sucursales con estadísticas de siniestros
    Incluye la columna 'EstadoActivo' (estado tinyint) para filtrado
    """
    try:
        # Obtener datos de la vista vista_sucursales actualizada
        query_vista = text("""
            SELECT 
                IdCentro,
                Sucursales,
                TipoSucursal,
                Zona,
                Estado,
                EstadoActivo,
                Municipio
            FROM vista_sucursales
            ORDER BY Sucursales
        """)
        
        result = db.execute(query_vista)
        sucursales_data = result.fetchall()
        
        # Formatear los datos
        vista_sucursales = []
        for row in sucursales_data:
            # Para cada sucursal, calcular siniestros y montos por separado
            total_siniestros = db.query(func.count(Siniestro.IdSiniestro)).filter(
                Siniestro.IdCentro == row.IdCentro
            ).scalar() or 0
            
            # Calcular monto total de pérdidas (solo las NO recuperadas) desde SiniestrosDetalles
            monto_perdidas = db.query(func.sum(SiniestroDetalle.Monto)).join(
                Siniestro, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro
            ).filter(
                Siniestro.IdCentro == row.IdCentro,
                SiniestroDetalle.Recuperado == False  # Solo pérdidas NO recuperadas
            ).scalar() or 0
            
            vista_sucursales.append({
                "IdCentro": row.IdCentro,
                "Sucursales": row.Sucursales,
                "TipoSucursal": row.TipoSucursal,
                "Zona": row.Zona,
                "Estado": row.Estado,
                "EstadoActivo": row.EstadoActivo,
                "Municipio": row.Municipio,
                "total_siniestros": total_siniestros,
                "monto_perdidas": float(monto_perdidas)
            })
        
        return {
            "success": True,
            "data": vista_sucursales,
            "total": len(vista_sucursales)
        }
        
    except Exception as e:
        print(f"Error en vista_sucursales: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener vista de sucursales: {str(e)}"
        )


@app.get("/sucursal_ubicacion/{id_centro}", dependencies=[Depends(get_current_user)])
async def sucursal_ubicacion(id_centro: str, db: Session = Depends(get_db)):
    """
    Obtiene información de ubicación de una sucursal específica
    Usa la vista siniestros_scisp.v_sucursales_mapa de la base de datos
    """
    try:
        query = text("""
            SELECT 
                IdCentro,
                Sucursales,
                IdTipoSucursal,
                IdZona,
                IdEstado,
                Latitud,
                Longitud,
                IdMunicipio,
                link_mymaps,
                link_maps,
                link_maps_api,
                link_directions
            FROM siniestros_scisp.v_sucursales_mapa
            WHERE IdCentro = :id_centro
        """)
        
        result = db.execute(query, {"id_centro": id_centro})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontró información de ubicación para la sucursal {id_centro}"
            )
        
        return {
            "success": True,
            "data": {
                "IdCentro": row.IdCentro,
                "Sucursales": row.Sucursales,
                "IdTipoSucursal": row.IdTipoSucursal,
                "IdZona": row.IdZona,
                "IdEstado": row.IdEstado,
                "Latitud": float(row.Latitud) if row.Latitud else None,
                "Longitud": float(row.Longitud) if row.Longitud else None,
                "IdMunicipio": row.IdMunicipio,
                "link_mymaps": row.link_mymaps,
                "link_maps": row.link_maps,
                "link_maps_api": row.link_maps_api,
                "link_directions": row.link_directions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en sucursal_ubicacion: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener información de ubicación: {str(e)}"
        )

@app.get("/sucursal_detalle/{id_centro}", dependencies=[Depends(get_current_user)])
async def sucursal_detalle(id_centro: str, db: Session = Depends(get_db)):
    """
    Obtiene información completa de una sucursal específica incluyendo estadísticas de siniestros
    """
    siniestros_no_frustrados = db.query(func.count(Siniestro.IdSiniestro)).filter(
        Siniestro.IdCentro == id_centro,
        Siniestro.Contemplar == True,
        Siniestro.Frustrado == False
    ).scalar() or 0
    try:
        # Obtener datos principales desde vista_sucursales
        query_vista = text("""
            SELECT 
                IdCentro,
                Sucursales,
                TipoSucursal,
                Zona,
                Estado,
                EstadoActivo,
                Municipio,
                Telefono,
                Ext,
                Direccion
            FROM vista_sucursales
            WHERE IdCentro = :id_centro
        """)
        result_vista = db.execute(query_vista, {"id_centro": id_centro})
        row = result_vista.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"No se encontró la sucursal {id_centro}")

        # Obtener ubicación desde v_sucursales_mapa
        query_mapa = text("""
            SELECT Latitud, Longitud, link_mymaps, link_maps FROM v_sucursales_mapa WHERE IdCentro = :id_centro
        """)
        result_mapa = db.execute(query_mapa, {"id_centro": id_centro})
        mapa = result_mapa.fetchone()

        # Obtener horarios de la sucursal
        query_horarios = text("""
            SELECT HorarioPublico, HorarioInterno, Detalle 
            FROM HorarioSucursal 
            WHERE idcentro = :id_centro
        """)
        result_horarios = db.execute(query_horarios, {"id_centro": id_centro})
        horarios = result_horarios.fetchone()

        # Obtener personal operativo de la sucursal
        query_personal = text("""
            SELECT 
                po.idPersonalOperaciones,
                po.Nombre,
                po.Telefono,
                po.Correo,
                po.Detalle as DetallePersonal,
                po.Estatus,
                c.idCargo,
                c.Cargo
            FROM PersonalSucursales ps
            JOIN PersonalOperaciones po ON ps.IdPersonalOperaciones = po.idPersonalOperaciones
            LEFT JOIN Cargo c ON po.IdCargo = c.idCargo
            WHERE ps.IdCentro = :id_centro
            ORDER BY COALESCE(c.idCargo, '99'), po.Nombre
        """)
        result_personal = db.execute(query_personal, {"id_centro": id_centro})
        personal_operativo = result_personal.fetchall()

        # Obtener contactos de emergencia según el municipio de la sucursal
        # Usamos el nombre del municipio desde vista_sucursales para hacer JOIN con la tabla municipios
        query_contactos_emergencia = text("""
            SELECT 
                ae.idAgendaEmergencia,
                ae.Nombre,
                ae.Telefono1,
                ae.Telefono2,
                ae.Detalle,
                tse.idTipoServicioEmergencia,
                tse.TipoServicioEmergencia,
                tse.Descripción as DescripcionTipo,
                vs.Municipio as NombreMunicipio,
                vs.Estado as NombreEstado,
                m.idMunicipios
            FROM vista_sucursales vs
            JOIN municipios m ON vs.Municipio = m.Municipio  
            JOIN AgendaEmergencia ae ON m.idMunicipios = ae.IdMunicipio
            JOIN TipoServicioEmergencia tse ON ae.IdTipoServicio = tse.idTipoServicioEmergencia
            WHERE vs.IdCentro = :id_centro
            ORDER BY tse.TipoServicioEmergencia, ae.Nombre
        """)
        result_contactos = db.execute(query_contactos_emergencia, {"id_centro": id_centro})
        contactos_emergencia = result_contactos.fetchall()
        
        print(f"🏢 Sucursal {id_centro} - Contactos de emergencia encontrados: {len(contactos_emergencia)}")
        for contacto in contactos_emergencia:
            print(f"  - {contacto.Nombre} ({contacto.TipoServicioEmergencia}) - Municipio: {contacto.NombreMunicipio}, Estado: {contacto.NombreEstado} (IdMun: {contacto.idMunicipios}) - Tel: {contacto.Telefono1}")

        # Estadísticas básicas usando consultas simples
        total_siniestros = db.query(func.count(Siniestro.IdSiniestro)).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True
        ).scalar() or 0
        siniestros_frustrados = db.query(func.count(Siniestro.IdSiniestro)).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True,
            Siniestro.Frustrado == True
        ).scalar() or 0
        siniestros_finalizados = db.query(func.count(Siniestro.IdSiniestro)).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True,
            Siniestro.Finalizado == True
        ).scalar() or 0
        siniestros_pendientes = db.query(func.count(Siniestro.IdSiniestro)).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True,
            Siniestro.Finalizado == False,
            Siniestro.Frustrado == False
        ).scalar() or 0

        # Calcular monto total de pérdidas (solo las NO recuperadas) y monto recuperado
        monto_total_perdidas = db.query(func.sum(SiniestroDetalle.Monto)).join(
            Siniestro, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro
        ).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True,
            SiniestroDetalle.Recuperado == False  # Solo pérdidas NO recuperadas
        ).scalar() or 0.0

        monto_recuperado = db.query(func.sum(SiniestroDetalle.Monto)).join(
            Siniestro, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro
        ).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True,
            SiniestroDetalle.Recuperado == True  # Solo pérdidas recuperadas
        ).scalar() or 0.0

        # Obtener los últimos 5 siniestros
        ultimos_siniestros = db.query(Siniestro).options(
            selectinload(Siniestro.tipo),
            selectinload(Siniestro.detalles)
        ).filter(
            Siniestro.IdCentro == id_centro,
            Siniestro.Contemplar == True
        ).order_by(
            Siniestro.Fecha.desc(), 
            Siniestro.Hora.desc()
        ).limit(5).all()

        return {
            "success": True,
            "data": {
                "informacion_basica": {
                    "id_centro": row.IdCentro,
                    "nombre": row.Sucursales,
                    "zona": {
                        "nombre": row.Zona
                    },
                    "estado": {
                        "nombre": row.Estado,
                        "municipio": row.Municipio
                    },
                    "tipo_sucursal": row.TipoSucursal,
                    "estado_activo": bool(row.EstadoActivo) if row.EstadoActivo is not None else None,
                    "telefono": row.Telefono if hasattr(row, 'Telefono') and row.Telefono else None,
                    "ext": row.Ext if hasattr(row, 'Ext') and row.Ext else None,
                    "direccion": row.Direccion if hasattr(row, 'Direccion') and row.Direccion else None,
                    "horarios": {
                        "horario_publico": horarios.HorarioPublico if horarios and horarios.HorarioPublico else None,
                        "horario_interno": horarios.HorarioInterno if horarios and horarios.HorarioInterno else None,
                        "comentario": horarios.Detalle if horarios and horarios.Detalle else None
                    },
                    "ubicacion": {
                        "latitud": float(mapa.Latitud) if mapa and mapa.Latitud else None,
                        "longitud": float(mapa.Longitud) if mapa and mapa.Longitud else None,
                        "link_mymaps": mapa.link_mymaps if mapa else None,
                        "link_maps": mapa.link_maps if mapa else None
                    }
                },
                "estadisticas": {
                    "total_siniestros": total_siniestros,
                    "monto_total_perdidas": float(monto_total_perdidas),
                    "monto_recuperado": float(monto_recuperado),
                    "siniestros_frustrados": siniestros_frustrados,
                    "siniestros_finalizados": siniestros_finalizados,
                    "siniestros_pendientes": siniestros_pendientes,
                    "siniestros_no_frustrados": siniestros_no_frustrados,
                    "siniestros_año_actual": total_siniestros,
                    "siniestros_mes_actual": 0
                },
                "siniestros_por_tipo": [],
                "ultimos_siniestros": [
                    {
                        "id": s.IdSiniestro,
                        "fecha": s.Fecha.strftime("%Y-%m-%d") if s.Fecha else None,
                        "hora": s.Hora.strftime("%H:%M:%S") if s.Hora else None,
                        "tipo": s.tipo.Cuenta if s.tipo else "N/A",
                        "frustrado": bool(s.Frustrado),
                        "finalizado": bool(s.Finalizado),
                        "monto_perdidas": sum(d.Monto for d in s.detalles if not d.Recuperado) if s.detalles else 0.0
                    }
                    for s in ultimos_siniestros
                ],
                "personal_operativo": [
                    {
                        "id": p.idPersonalOperaciones,
                        "nombre": p.Nombre,
                        "telefono": p.Telefono,
                        "correo": p.Correo,
                        "cargo": p.Cargo if p.Cargo else "Sin cargo",
                        "id_cargo": p.idCargo if p.idCargo else "N/A",
                        "detalle": p.DetallePersonal,
                        "estatus": p.Estatus if p.Estatus else 1
                    }
                    for p in personal_operativo
                ],
                "contactos_emergencia": [
                    {
                        "id": c.idAgendaEmergencia,
                        "nombre": c.Nombre,
                        "telefono1": c.Telefono1,
                        "telefono2": c.Telefono2,
                        "detalle": c.Detalle,
                        "tipo_servicio": c.TipoServicioEmergencia,
                        "id_tipo_servicio": c.idTipoServicioEmergencia,
                        "descripcion_tipo": c.DescripcionTipo
                    }
                    for c in contactos_emergencia
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en sucursal_detalle: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener información de la sucursal: {str(e)}"
        )

@app.get("/boletines/{idSiniestro}/pdf")
async def generar_pdf_boletin(
    idSiniestro: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """Generar PDF del boletín para un siniestro"""
    try:
        # Obtener información del siniestro
        s = db.get(Siniestro, idSiniestro)
        if not s:
            raise HTTPException(status_code=404, detail="Siniestro no encontrado")
        
        # Obtener boletín
        boletin = db.execute(select(Boletin).where(Boletin.IdSiniestro == idSiniestro)).scalar_one_or_none()
        if not boletin:
            raise HTTPException(status_code=404, detail="Boletín no encontrado para este siniestro")
        
        # Obtener información relacionada
        sucursal = db.get(Sucursal, s.IdCentro)
        tipo_siniestro = db.get(TipoSiniestro, s.IdTipoCuenta)
        
        # Crear PDF en memoria
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.units import inch
        from io import BytesIO
        import os
        
        # Buffer para el PDF
        buffer = BytesIO()
        
        # Crear documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Lista para almacenar los elementos del PDF
        story = []
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Centrado
            textColor=colors.darkblue
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        
        # Título
        story.append(Paragraph("BOLETÍN DE SINIESTRO", title_style))
        story.append(Spacer(1, 20))
        
        # Información básica del siniestro
        story.append(Paragraph("INFORMACIÓN DEL SINIESTRO", header_style))
        
        siniestro_data = [
            ['ID Siniestro:', str(s.IdSiniestro)],
            ['Fecha:', s.Fecha.strftime('%d/%m/%Y') if s.Fecha else 'N/A'],
            ['Hora:', s.Hora.strftime('%H:%M') if s.Hora else 'N/A'],
            ['Sucursal:', sucursal.Sucursales if sucursal else 'N/A'],
            ['Tipo de Siniestro:', tipo_siniestro.Cuenta if tipo_siniestro else 'N/A'],
            ['Estado:', 'Frustrado' if s.Frustrado else 'Completado'],
            ['Finalizado:', 'Sí' if s.Finalizado else 'No'],
        ]
        
        siniestro_table = Table(siniestro_data, colWidths=[2*inch, 3*inch])
        siniestro_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(siniestro_table)
        story.append(Spacer(1, 20))
        
        # Detalles del siniestro
        if s.Detalle:
            story.append(Paragraph("DETALLES DEL SINIESTRO", header_style))
            story.append(Paragraph(s.Detalle, normal_style))
            story.append(Spacer(1, 20))
        
        # Descripción del boletín
        story.append(Paragraph("DESCRIPCIÓN DEL BOLETÍN", header_style))
        story.append(Paragraph(boletin.Boletin or "Sin descripción disponible", normal_style))
        story.append(Spacer(1, 20))
        
        # Agregar foto si existe
        if boletin.RutaFoto and os.path.exists(boletin.RutaFoto):
            try:
                story.append(Paragraph("EVIDENCIA FOTOGRÁFICA", header_style))
                img = Image(boletin.RutaFoto, width=4*inch, height=3*inch)
                story.append(img)
                story.append(Spacer(1, 20))
            except Exception as img_error:
                print(f"⚠️ Error cargando imagen: {img_error}")
                story.append(Paragraph("EVIDENCIA FOTOGRÁFICA", header_style))
                story.append(Paragraph("Error al cargar la imagen de evidencia", normal_style))
                story.append(Spacer(1, 20))
        
        # Pie de página con fecha de generación
        from datetime import datetime
        fecha_generacion = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        story.append(Spacer(1, 30))
        story.append(Paragraph(f"Documento generado el: {fecha_generacion}", 
                             ParagraphStyle('Footer', parent=normal_style, fontSize=8, alignment=1)))
        
        # Construir PDF
        doc.build(story)
        
        # Obtener contenido del buffer
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Devolver PDF como respuesta
        from fastapi.responses import Response
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=boletin-siniestro-{idSiniestro}.pdf"
            }
        )
        
    except Exception as e:
        print(f"❌ Error generando PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")


# ========================
# Nuevos Endpoints para Boletines con SVG
# ========================

@app.post("/siniestros/{idSiniestro}/boletin/generar")
async def generar_boletin_svg(
    idSiniestro: int = Path(..., ge=1),
    formato: str = "pdf",  # pdf o imagen
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """
    Generar boletín desde SVG template con datos del siniestro.
    
    Parámetros:
    - idSiniestro: ID del siniestro
    - formato: 'pdf' para PDF o 'imagen' para PNG
    """
    try:
        require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])
        
        # Obtener siniestro
        s = db.get(Siniestro, idSiniestro)
        if not s:
            raise HTTPException(status_code=404, detail="Siniestro no encontrado")
        
        # Obtener sucursal y zona
        sucursal = db.get(Sucursal, s.IdCentro)
        if not sucursal:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada")
        
        zona = db.get(Zona, sucursal.idZona) if sucursal.idZona else None
        tipo_siniestro = db.get(TipoSiniestro, s.IdTipoCuenta)
        
        # Obtener boletín existente para texto descriptivo
        boletin_existente = db.execute(
            select(Boletin).where(Boletin.IdSiniestro == idSiniestro)
        ).scalar_one_or_none()
        
        # Preparar datos
        zona_nombre = zona.zona if zona else "Sin zona"
        sucursal_nombre = sucursal.Sucursales if sucursal else "Sin sucursal"
        tipo_nombre = tipo_siniestro.Cuenta if tipo_siniestro else "Desconocido"
        fecha_str = s.Fecha.strftime('%d/%m/%Y') if s.Fecha else "N/A"
        hora_str = s.Hora.strftime('%H:%M') if s.Hora else "N/A"
        descripcion = boletin_existente.Boletin if boletin_existente else s.Detalle or "Sin descripción"
        ruta_foto = boletin_existente.RutaFoto if boletin_existente else None
        
        # Renderizar SVG con datos
        svg_renderizado = renderizar_svg_con_datos(
            tipo_siniestro=tipo_nombre,
            zona=zona_nombre,
            id_centro=s.IdCentro,
            nombre_sucursal=sucursal_nombre,
            fecha=fecha_str,
            hora=hora_str,
            descripcion=descripcion,
            ruta_foto=ruta_foto
        )
        
        # Convertir a formato solicitado
        if formato.lower() == "pdf":
            contenido = svg_a_pdf(svg_renderizado, idSiniestro)
            media_type = "application/pdf"
            filename = f"boletin-siniestro-{idSiniestro}.pdf"
        else:  # imagen (png)
            contenido = svg_a_imagen_png(svg_renderizado, idSiniestro)
            media_type = "image/png"
            filename = f"boletin-siniestro-{idSiniestro}.png"
        
        # Retornar archivo
        return Response(
            content=contenido,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error de validación: {str(e)}")
    except Exception as e:
        print(f"❌ Error generando boletín SVG: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generando boletín: {str(e)}")


@app.post("/siniestros/{idSiniestro}/foto/subir")
async def subir_foto_boletin(
    idSiniestro: int = Path(..., ge=1),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """
    Subir foto para un siniestro y almacenarla en Boletin/imagenesSiniestros/{idSiniestro}.
    """
    try:
        require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])
        
        # Verificar que el siniestro existe
        s = db.get(Siniestro, idSiniestro)
        if not s:
            raise HTTPException(status_code=404, detail="Siniestro no encontrado")
        
        # Leer contenido del archivo
        contenido = await file.read()
        
        # Crear ruta de almacenamiento
        from pathlib import Path
        base_path = Path(__file__).parent / "Boletin" / "imagenesSiniestros" / str(idSiniestro)
        base_path.mkdir(parents=True, exist_ok=True)
        
        # Generar nombre de archivo
        extension = Path(file.filename).suffix
        nombre_archivo = f"{idSiniestro}{extension}"
        ruta_completa = base_path / nombre_archivo
        
        # Guardar archivo
        with open(ruta_completa, "wb") as f:
            f.write(contenido)
        
        # Ruta relativa para almacenar en BD
        ruta_relativa = f"Boletin/imagenesSiniestros/{idSiniestro}/{nombre_archivo}"
        
        # Actualizar o crear boletín con ruta de foto
        boletin_existente = db.execute(
            select(Boletin).where(Boletin.IdSiniestro == idSiniestro)
        ).scalar_one_or_none()
        
        if boletin_existente:
            boletin_existente.RutaFoto = ruta_relativa
        else:
            nuevo_boletin = Boletin(
                IdSiniestro=idSiniestro,
                RutaFoto=ruta_relativa
            )
            db.add(nuevo_boletin)
        
        db.commit()
        
        return {
            "estatus": True,
            "mensaje": "Foto subida exitosamente",
            "rutaFoto": ruta_relativa,
            "nombreArchivo": nombre_archivo
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error subiendo foto: {e}")
        raise HTTPException(status_code=500, detail=f"Error al guardar foto: {str(e)}")


@app.get("/siniestros/{idSiniestro}/boletin/pdf")
async def generar_boletin_pdf(
    idSiniestro: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    """
    Generar PDF del boletín usando el template HTML correspondiente al tipo de siniestro.
    Rellena automáticamente: zona, idCentro, sucursal, fecha, descripción e imagen.
    """
    require_role(user, [ROLE_ADMIN, ROLE_COORD, ROLE_OPER])
    
    try:
        from pathlib import Path as PathLib
        import tempfile
        import base64
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        print(f"📄 Generando PDF para siniestro {idSiniestro}")
        
        # Obtener siniestro
        s = db.get(Siniestro, idSiniestro)
        if not s:
            print(f"❌ Siniestro {idSiniestro} no encontrado")
            raise HTTPException(404, detail="Siniestro no encontrado")
        
        print(f"✅ Siniestro encontrado: {s.IdSiniestro}")
        
        # Obtener tipo de siniestro
        tipo_siniestro = db.get(TipoSiniestro, s.IdTipoCuenta)
        if not tipo_siniestro:
            print(f"❌ Tipo de siniestro no encontrado para IdTipoCuenta: {s.IdTipoCuenta}")
            raise HTTPException(404, detail="Tipo de siniestro no encontrado")
        
        tipo_cuenta = tipo_siniestro.Cuenta
        print(f"✅ Tipo de siniestro: {tipo_cuenta}")
        
        # Mapeo de tipos a archivos HTML (normalizar nombres con/sin tilde y plural)
        tipo_normalizado = tipo_cuenta.lower().strip()
        html_map = {
            "asalto": "BoletinAsalto.html",
            "extorsion": "BoletinExtorsion.html",
            "extorsión": "BoletinExtorsion.html",
            "fardero": "BoletinFardero.html",
            "farderos": "BoletinFardero.html",
            "intruso": "BoletinIntrusion.html",
            "intrusion": "BoletinIntrusion.html",
            "intrusión": "BoletinIntrusion.html",
            "sospechoso": "BoletinSospechoso.html",
            "sospechosos": "BoletinSospechoso.html"
        }
        
        html_file = html_map.get(tipo_normalizado)
        if not html_file:
            print(f"❌ No hay plantilla para tipo '{tipo_cuenta}'")
            raise HTTPException(400, detail=f"No hay plantilla de boletín para el tipo '{tipo_cuenta}'")
        
        print(f"✅ Plantilla HTML: {html_file}")
        
        # Ruta al archivo HTML
        boletin_path = PathLib("Boletin") / html_file
        if not boletin_path.exists():
            print(f"❌ Archivo no encontrado: {boletin_path}")
            raise HTTPException(404, detail=f"Plantilla HTML no encontrada: {html_file}")
        
        print(f"✅ Leyendo plantilla desde: {boletin_path}")
        
        # Leer HTML
        html_content = boletin_path.read_text(encoding='utf-8')
        
        # Remover el borde del contenedor y ajustar para PDF sin márgenes
        html_content = html_content.replace(
            'border: 0px solid #ccc;',
            'border: none;'
        )
        html_content = html_content.replace(
            'margin: 0 auto;',
            'margin: 0;'
        )
        
        # Obtener datos relacionados
        sucursal = db.get(Sucursal, s.IdCentro)
        zona = db.get(Zona, sucursal.idZona) if sucursal else None
        
        print(f"✅ Sucursal: {sucursal.Sucursales if sucursal else 'N/A'}")
        print(f"✅ Zona: {zona.zona if zona else 'N/A'}")
        
        # Obtener boletín (texto e imagen)
        boletin = db.execute(
            select(Boletin).where(Boletin.IdSiniestro == idSiniestro)
        ).scalar_one_or_none()
        
        print(f"✅ Boletín: {boletin.Boletin[:50] if boletin and boletin.Boletin else 'Sin texto'}")
        print(f"✅ Foto: {boletin.RutaFoto if boletin and boletin.RutaFoto else 'Sin foto'}")
        
        # Preparar datos
        zona_texto = zona.zona if zona else "N/A"
        uden_texto = sucursal.IdCentro if sucursal else "N/A"
        sucursal_texto = sucursal.Sucursales if sucursal else "N/A"
        
        # Formatear fecha y hora
        if s.Fecha and s.Hora:
            fecha_texto = f"{s.Fecha.strftime('%d/%m/%Y')} - {s.Hora.strftime('%H:%M')}"
        elif s.Fecha:
            fecha_texto = s.Fecha.strftime('%d/%m/%Y')
        else:
            fecha_texto = "N/A"
        
        descripcion_texto = boletin.Boletin if boletin and boletin.Boletin else ""
        
        # Convertir SVG de fondo a base64
        svg_nombre = html_file.replace("Boletin", "").replace(".html", ".svg")  # BoletinAsalto.html -> Asalto.svg
        svg_path = PathLib("Boletin") / svg_nombre
        
        svg_base64 = ""
        if svg_path.exists():
            with open(svg_path, "rb") as f:
                svg_base64 = base64.b64encode(f.read()).decode()
            print(f"✅ SVG convertido a base64: {svg_nombre}")
        else:
            print(f"⚠️ SVG no encontrado: {svg_path}")
        
        # Convertir imagen del siniestro a base64
        imagen_base64 = ""
        if boletin and boletin.RutaFoto:
            ruta_foto_absoluta = PathLib(boletin.RutaFoto)
            if not ruta_foto_absoluta.is_absolute():
                ruta_foto_absoluta = PathLib.cwd() / boletin.RutaFoto
            
            if ruta_foto_absoluta.exists():
                with open(ruta_foto_absoluta, "rb") as f:
                    imagen_base64 = base64.b64encode(f.read()).decode()
                print(f"✅ Imagen convertida a base64: {ruta_foto_absoluta.name}")
            else:
                print(f"⚠️ Imagen no encontrada: {ruta_foto_absoluta}")
        
        print(f"📝 Datos a insertar:")
        print(f"  - Zona: {zona_texto}")
        print(f"  - UDEN: {uden_texto}")
        print(f"  - Sucursal: {sucursal_texto}")
        print(f"  - Fecha: {fecha_texto}")
        print(f"  - SVG: {'Sí' if svg_base64 else 'No'}")
        print(f"  - Imagen: {'Sí' if imagen_base64 else 'No'}")
        
        # Reemplazar placeholders en el HTML
        html_content = html_content.replace(
            '<div class="zona"></div>',
            f'<div class="zona">{zona_texto}</div>'
        )
        html_content = html_content.replace(
            '<div class="uden"></div>',
            f'<div class="uden">{uden_texto}</div>'
        )
        html_content = html_content.replace(
            '<div class="sucursal"></div>',
            f'<div class="sucursal">{sucursal_texto}</div>'
        )
        html_content = html_content.replace(
            '<div class="fecha"></div>',
            f'<div class="fecha">{fecha_texto}</div>'
        )
        # Reemplazar descripción (manejar diferentes formatos de espaciado)
        import re
        html_content = re.sub(
            r'<div class="descripcion">\s*</div>',
            f'<div class="descripcion">{descripcion_texto}</div>',
            html_content
        )
        
        # Reemplazar SVG de fondo con base64
        if svg_base64:
            html_content = html_content.replace(
                'src="Asalto.svg"',
                f'src="data:image/svg+xml;base64,{svg_base64}"'
            )
            html_content = html_content.replace(
                'src="Extorsion.svg"',
                f'src="data:image/svg+xml;base64,{svg_base64}"'
            )
            html_content = html_content.replace(
                'src="Fardero.svg"',
                f'src="data:image/svg+xml;base64,{svg_base64}"'
            )
            html_content = html_content.replace(
                'src="Intrusion.svg"',
                f'src="data:image/svg+xml;base64,{svg_base64}"'
            )
            html_content = html_content.replace(
                'src="Sospechoso.svg"',
                f'src="data:image/svg+xml;base64,{svg_base64}"'
            )
        
        # Reemplazar imagen del siniestro con base64
        if imagen_base64:
            html_content = html_content.replace(
                'src="./imagenesSiniestros/"',
                f'src="data:image/jpeg;base64,{imagen_base64}"'
            )
        else:
            # Si no hay imagen, remover el tag img para evitar error
            html_content = html_content.replace(
                '<img src="./imagenesSiniestros/" alt="Imagen siniestro" loading="lazy">',
                ''
            )
        
        # Crear archivo temporal con el HTML modificado
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_html:
            temp_html.write(html_content)
            temp_html_path = temp_html.name
        
        print(f"📄 Generando PDF con Chrome headless...")
        
        # Configurar Chrome en modo headless
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Configurar opciones de impresión a PDF SIN MÁRGENES
        # 612px × 792px = 8.5" × 11" (Letter) en 72 DPI
        print_options = {
            'landscape': False,
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': True,
            'marginTop': 0,
            'marginBottom': 0,
            'marginLeft': 0,
            'marginRight': 0,
            'paperWidth': 6.55,      # Ancho en pulgadas (Letter)
            'paperHeight': 8.45,    # Alto en pulgadas (Letter)
        }
        
        # Inicializar driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        try:
            # Cargar HTML desde archivo temporal
            driver.get(f'file:///{temp_html_path.replace(chr(92), "/")}')
            
            # Esperar un momento para que se cargue todo
            import time
            time.sleep(1)
            
            # Generar PDF
            pdf_data = driver.execute_cdp_cmd("Page.printToPDF", print_options)
            pdf_bytes = base64.b64decode(pdf_data['data'])
            
            print(f"✅ PDF generado exitosamente ({len(pdf_bytes)} bytes)")
            
        finally:
            driver.quit()
            # Eliminar archivo temporal
            PathLib(temp_html_path).unlink(missing_ok=True)
        
        # Retornar PDF
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Boletin_Siniestro_{idSiniestro}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"Error al generar PDF: {str(e)}")


# ========================
# Seeding opcional de roles (solo utilidad manual)
# ========================

# Ejecutar servidor
if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando servidor FastAPI en http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
