-- Esquema para Supabase - Plataforma CDI

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL
);

-- Grupos
CREATE TABLE IF NOT EXISTS grupos (
  id_grupo SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  edad_minima INTEGER,
  edad_maxima INTEGER,
  activo BOOLEAN DEFAULT true,
  horario VARCHAR(255)
);

-- Periodos
CREATE TABLE IF NOT EXISTS periodos (
  id_periodo SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT true
);

-- Niños
CREATE TABLE IF NOT EXISTS ninos (
  id_nino SERIAL PRIMARY KEY,
  nombres VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  documento VARCHAR(255),
  estado BOOLEAN DEFAULT true,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acudientes
CREATE TABLE IF NOT EXISTS acudientes (
  id_acudiente SERIAL PRIMARY KEY,
  nombres VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255) NOT NULL,
  telefono VARCHAR(255),
  correo VARCHAR(255),
  direccion TEXT,
  acepta_tratamiento BOOLEAN DEFAULT false,
  fecha_aceptacion TIMESTAMP,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación Niño-Acudiente
CREATE TABLE IF NOT EXISTS nino_acudiente (
  id SERIAL PRIMARY KEY,
  id_nino INTEGER REFERENCES ninos(id_nino),
  id_acudiente INTEGER REFERENCES acudientes(id_acudiente),
  parentesco VARCHAR(255)
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  password TEXT,
  id_rol INTEGER REFERENCES roles(id_rol),
  estado BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_grupo INTEGER REFERENCES grupos(id_grupo),
  id_nino INTEGER REFERENCES ninos(id_nino)
);

-- Matriculas
CREATE TABLE IF NOT EXISTS matriculas (
  id_matricula SERIAL PRIMARY KEY,
  id_nino INTEGER REFERENCES ninos(id_nino),
  id_grupo INTEGER REFERENCES grupos(id_grupo),
  id_periodo INTEGER REFERENCES periodos(id_periodo),
  fecha_matricula DATE DEFAULT CURRENT_DATE,
  estado BOOLEAN DEFAULT true
);

-- Asistencia
CREATE TABLE IF NOT EXISTS asistencia (
  id_asistencia SERIAL PRIMARY KEY,
  id_matricula INTEGER REFERENCES matriculas(id_matricula),
  fecha DATE NOT NULL,
  estado VARCHAR(255),
  observacion TEXT,
  registrado_por INTEGER REFERENCES usuarios(id_usuario),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Desarrollo Infantil
CREATE TABLE IF NOT EXISTS desarrollo_infantil (
  id_registro SERIAL PRIMARY KEY,
  id_matricula INTEGER REFERENCES matriculas(id_matricula),
  fecha DATE NOT NULL,
  dimension VARCHAR(255),
  nivel_logro VARCHAR(255),
  observacion TEXT,
  registrado_por INTEGER REFERENCES usuarios(id_usuario),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id_mensaje SERIAL PRIMARY KEY,
  id_emisor INTEGER REFERENCES usuarios(id_usuario),
  id_receptor INTEGER REFERENCES usuarios(id_usuario),
  asunto VARCHAR(255),
  contenido TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT false
);

-- Comunicados
CREATE TABLE IF NOT EXISTS comunicados (
  id_comunicado SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES usuarios(id_usuario)
);

-- Historial Accesos
CREATE TABLE IF NOT EXISTS historial_accesos (
  id_historial SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id_usuario),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accion VARCHAR(255),
  ip_address VARCHAR(255)
);

-- Comportamiento
CREATE TABLE IF NOT EXISTS comportamiento (
  id_comportamiento SERIAL PRIMARY KEY,
  id_nino INTEGER REFERENCES ninos(id_nino),
  estrellas INTEGER DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  id_docente INTEGER REFERENCES usuarios(id_usuario),
  observacion TEXT
);

-- Reportes
CREATE TABLE IF NOT EXISTS reportes (
  id_reporte SERIAL PRIMARY KEY,
  id_docente INTEGER REFERENCES usuarios(id_usuario),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(255) DEFAULT 'general',
  fecha DATE DEFAULT CURRENT_DATE,
  estado VARCHAR(255) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
