-- Table: asistencia
CREATE TABLE asistencia (
  id_asistencia integer NOT NULL DEFAULT nextval('asistencia_id_asistencia_seq'::regclass),
  id_matricula integer,
  fecha date NOT NULL,
  estado character varying,
  observacion text,
  registrado_por integer,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: desarrollo_infantil
CREATE TABLE desarrollo_infantil (
  id_registro integer NOT NULL DEFAULT nextval('desarrollo_infantil_id_registro_seq'::regclass),
  id_matricula integer,
  fecha date NOT NULL,
  dimension character varying,
  nivel_logro character varying,
  observacion text,
  registrado_por integer,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: mensajes
CREATE TABLE mensajes (
  id_mensaje integer NOT NULL DEFAULT nextval('mensajes_id_mensaje_seq'::regclass),
  id_emisor integer,
  id_receptor integer,
  asunto character varying,
  contenido text NOT NULL,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  leido boolean DEFAULT false
);

-- Table: comunicados
CREATE TABLE comunicados (
  id_comunicado integer NOT NULL DEFAULT nextval('comunicados_id_comunicado_seq'::regclass),
  titulo character varying NOT NULL,
  contenido text NOT NULL,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  creado_por integer
);

-- Table: historial_accesos
CREATE TABLE historial_accesos (
  id_historial integer NOT NULL DEFAULT nextval('historial_accesos_id_historial_seq'::regclass),
  id_usuario integer,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  accion character varying,
  ip_address character varying
);

-- Table: comportamiento
CREATE TABLE comportamiento (
  id_comportamiento integer NOT NULL DEFAULT nextval('comportamiento_id_comportamiento_seq'::regclass),
  id_nino integer,
  estrellas integer DEFAULT 0,
  fecha date DEFAULT CURRENT_DATE,
  id_docente integer,
  observacion text
);

-- Table: reportes
CREATE TABLE reportes (
  id_reporte integer NOT NULL DEFAULT nextval('reportes_id_reporte_seq'::regclass),
  id_docente integer NOT NULL,
  titulo character varying NOT NULL,
  descripcion text NOT NULL,
  tipo character varying DEFAULT 'general'::character varying,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  estado character varying DEFAULT 'pendiente'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles
CREATE TABLE roles (
  id_rol integer NOT NULL DEFAULT nextval('roles_id_rol_seq'::regclass),
  nombre character varying NOT NULL
);

-- Table: grupos
CREATE TABLE grupos (
  id_grupo integer NOT NULL DEFAULT nextval('grupos_id_grupo_seq'::regclass),
  nombre character varying NOT NULL,
  edad_minima integer,
  edad_maxima integer,
  activo boolean DEFAULT true,
  horario character varying
);

-- Table: ninos
CREATE TABLE ninos (
  id_nino integer NOT NULL DEFAULT nextval('ninos_id_nino_seq'::regclass),
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  fecha_nacimiento date NOT NULL,
  documento character varying,
  estado boolean DEFAULT true,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: nino_acudiente
CREATE TABLE nino_acudiente (
  id integer NOT NULL DEFAULT nextval('nino_acudiente_id_seq'::regclass),
  id_nino integer,
  id_acudiente integer,
  parentesco character varying
);

-- Table: acudientes
CREATE TABLE acudientes (
  id_acudiente integer NOT NULL DEFAULT nextval('acudientes_id_acudiente_seq'::regclass),
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  telefono character varying,
  correo character varying,
  direccion text,
  acepta_tratamiento boolean DEFAULT false,
  fecha_aceptacion timestamp without time zone,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: matriculas
CREATE TABLE matriculas (
  id_matricula integer NOT NULL DEFAULT nextval('matriculas_id_matricula_seq'::regclass),
  id_nino integer,
  id_grupo integer,
  id_periodo integer,
  fecha_matricula date DEFAULT CURRENT_DATE,
  estado boolean DEFAULT true
);

-- Table: periodos
CREATE TABLE periodos (
  id_periodo integer NOT NULL DEFAULT nextval('periodos_id_periodo_seq'::regclass),
  nombre character varying NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  activo boolean DEFAULT true
);

-- Table: usuarios
CREATE TABLE usuarios (
  id_usuario integer NOT NULL DEFAULT nextval('usuarios_id_usuario_seq'::regclass),
  nombre character varying NOT NULL,
  correo character varying NOT NULL,
  password text,
  id_rol integer,
  estado boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id_grupo integer,
  id_nino integer
);

