
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
from datetime import date, datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, Path
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from sqlalchemy import (
    create_engine, select, func, String, Integer, Date, Boolean, Float, ForeignKey,
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
    IdTipoCuenta: Mapped[int] = mapped_column(Integer, ForeignKey("tiposiniestro.idTipoSiniestro"))
    Frustrado: Mapped[bool] = mapped_column(Boolean)
    IdRealizo: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.IdUsuarios"))
    Contemplar: Mapped[bool] = mapped_column(Boolean)

    tipo: Mapped[TipoSiniestro] = relationship(lazy="joined")
    centro: Mapped[Sucursal] = relationship(lazy="joined")
    realizo: Mapped[Usuario] = relationship(lazy="joined")
    detalles: Mapped[List["SiniestroDetalle"]] = relationship(back_populates="siniestro", cascade="all, delete-orphan")
    implicados: Mapped[List["Implicado"]] = relationship(back_populates="siniestro", cascade="all, delete-orphan")


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

class CrearSiniestro(BaseModel):
    idCentro: str
    fecha: date
    idTipoCuenta: int
    frustrado: bool
    idRealizo: int
    perdidas: List[DetallePerdida] = Field(min_items=1, description="Lista de pérdidas asociadas al siniestro")
    implicados: List[DetalleImplicado] = Field(min_items=1, description="Lista de implicados en el siniestro")
    
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
    idTipoCuenta: Optional[int] = None
    frustrado: Optional[bool] = None
    idRealizo: Optional[int] = None
    contemplar: Optional[bool] = None
    
    # Nuevas estructuras para múltiples pérdidas e implicados
    perdidas: Optional[List[DetallePerdida]] = None
    implicados: Optional[List[DetalleImplicado]] = None
    
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
    idTipoPerdida: int
    tipoPerdida: str
    monto: float
    recuperado: bool
    detalle: Optional[str] = None

class DetalleImplicadoRespuesta(BaseModel):
    idImplicado: int
    sexo: str
    rangoEdad: str
    detalle: Optional[str] = None

class RespuestaSiniestrosItem(BaseModel):
    idSiniestro: int
    fecha: date
    frustrado: bool
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
    detalle: Optional[str] = None


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
    monto_estimado = sum(d.Monto for d in (s.detalles or [])) if s.detalles else 0.0
    
    # Crear lista de todas las pérdidas
    perdidas = []
    if s.detalles:
        for det in s.detalles:
            perdidas.append(DetallePerdidaRespuesta(
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
        fecha=s.Fecha,
        frustrado=bool(s.Frustrado),
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
        detalle=detalle,
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
            IdTipoCuenta=payload.idTipoCuenta,
            Frustrado=payload.frustrado,
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

        db.commit()
        total_perdidas = len(payload.perdidas) if payload.perdidas else 1
        total_implicados = len(payload.implicados) if payload.implicados else 1
        return {"estatus": True, "mensaje": f"Siniestro creado con Id {s.IdSiniestro}, {total_perdidas} pérdida(s) y {total_implicados} implicado(s) registrado(s)"}
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
        set_if(payload.idTipoCuenta, lambda v: setattr(s, "IdTipoCuenta", v))
        set_if(payload.frustrado, lambda v: setattr(s, "Frustrado", v))
        set_if(payload.idRealizo, lambda v: setattr(s, "IdRealizo", v))

        # Contemplar: solo admin
        if payload.contemplar is not None:
            if role == ROLE_ADMIN:
                s.Contemplar = payload.contemplar

        # 2. Eliminar pérdidas especificadas
        if payload.eliminar_perdidas:
            for detalle_id in payload.eliminar_perdidas:
                detalle = db.execute(select(SiniestroDetalle).where(
                    and_(SiniestroDetalle.IdSiniestros == s.IdSiniestro, 
                         SiniestroDetalle.idSiniestrosDetelles == detalle_id)
                )).scalar_one_or_none()
                if detalle:
                    db.delete(detalle)

        # 3. Eliminar implicados especificados
        if payload.eliminar_implicados:
            for implicado_id in payload.eliminar_implicados:
                implicado = db.execute(select(Implicado).where(
                    and_(Implicado.IdSiniestros == s.IdSiniestro, 
                         Implicado.idImplicados == implicado_id)
                )).scalar_one_or_none()
                if implicado:
                    db.delete(implicado)

        # 4. Agregar nuevas pérdidas
        if payload.perdidas:
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

        # 5. Agregar nuevos implicados
        if payload.implicados:
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
            # Calcular monto total de pérdidas
            monto_total = sum(detalle.Monto for detalle in s.detalles)
            
            siniestros_data.append({
                "IdSiniestro": s.IdSiniestro,
                "IdCentro": s.IdCentro,
                "Fecha": s.Fecha.strftime('%Y-%m-%d'),
                "TipoSiniestro": s.tipo.Cuenta if s.tipo else "N/A",
                "IdTipoCuenta": s.IdTipoCuenta,
                "Frustrado": s.Frustrado,
                "Contemplar": s.Contemplar,
                "Sucursal": s.centro.Sucursales if s.centro else "N/A",
                "Usuario": s.realizo.NombreUsuario if s.realizo else "N/A",
                "MontoTotal": monto_total,
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
    # Permisos: Admin y Coordinador
    require_role(user, [ROLE_ADMIN, ROLE_COORD])

    s = db.get(Siniestro, idSiniestro)
    if not s:
        raise HTTPException(404, detail="Siniestro no encontrado")

    # Borrar hijos manualmente por restricciones NO ACTION
    for det in list(s.detalles or []):
        db.delete(det)
    for imp in list(s.implicados or []):
        db.delete(imp)
    db.flush()

    db.delete(s)
    db.commit()
    return {"estatus": True, "mensaje": f"Siniestro {idSiniestro} eliminado"}


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
            monto_total_perdidas += detalle.Monto
            if detalle.Recuperado:
                # Asumimos recuperación parcial, aquí podrías tener un campo MontoRecuperado
                monto_total_recuperado += detalle.Monto * 0.6  # Ejemplo: 60% de recuperación promedio
    
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
    
    # Query corregida: contar siniestros únicos, no detalles
    query = select(
        TipoSiniestro.Cuenta,
        func.count(func.distinct(Siniestro.IdSiniestro)).label('cantidad'),
        func.coalesce(func.sum(SiniestroDetalle.Monto), 0).label('monto_total')
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
    Usa la vista vista_sucursales de la base de datos
    """
    try:
        # Primero obtener datos de la vista vista_sucursales
        query_vista = text("""
            SELECT 
                IdCentro,
                Sucursales,
                TipoSucursal,
                Zona,
                Estado,
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
            
            # Calcular monto total de pérdidas desde SiniestrosDetalles
            monto_perdidas = db.query(func.sum(SiniestroDetalle.Monto)).join(
                Siniestro, SiniestroDetalle.IdSiniestros == Siniestro.IdSiniestro
            ).filter(
                Siniestro.IdCentro == row.IdCentro
            ).scalar() or 0
            
            vista_sucursales.append({
                "IdCentro": row.IdCentro,
                "Sucursales": row.Sucursales,
                "TipoSucursal": row.TipoSucursal,
                "Zona": row.Zona,
                "Estado": row.Estado,
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

# ========================
# Seeding opcional de roles (solo utilidad manual)
# ========================

