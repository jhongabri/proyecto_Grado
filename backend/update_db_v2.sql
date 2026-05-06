-- 1. Crear tabla para relación multi-grupo
CREATE TABLE IF NOT EXISTS usuario_grupos (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_grupo INTEGER REFERENCES grupos(id_grupo) ON DELETE CASCADE,
  UNIQUE(id_usuario, id_grupo)
);

-- 2. Migrar datos existentes de la tabla usuarios a la nueva tabla relacional
-- Solo para usuarios con rol docente (2)
INSERT INTO usuario_grupos (id_usuario, id_grupo)
SELECT id_usuario, id_grupo 
FROM usuarios 
WHERE id_grupo IS NOT NULL AND id_rol = 2
ON CONFLICT DO NOTHING;

-- 3. Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id_tarea SERIAL PRIMARY KEY,
  id_grupo INTEGER REFERENCES grupos(id_grupo) ON DELETE CASCADE,
  id_docente INTEGER REFERENCES usuarios(id_usuario),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_entrega DATE,
  recurso_url TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
