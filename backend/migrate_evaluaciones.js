const pool = require("./src/config/db");

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones_desarrollo (
        id_evaluacion SERIAL PRIMARY KEY,
        id_nino INTEGER REFERENCES ninos(id_nino) ON DELETE CASCADE,
        id_grupo INTEGER REFERENCES grupos(id_grupo),
        id_docente INTEGER REFERENCES usuarios(id_usuario),
        fecha DATE DEFAULT CURRENT_DATE,
        comunicativa INTEGER CHECK (comunicativa BETWEEN 1 AND 4),
        cognitiva INTEGER CHECK (cognitiva BETWEEN 1 AND 4),
        socioafectiva INTEGER CHECK (socioafectiva BETWEEN 1 AND 4),
        corporal INTEGER CHECK (corporal BETWEEN 1 AND 4),
        artistica INTEGER CHECK (artistica BETWEEN 1 AND 4),
        autonomia INTEGER CHECK (autonomia BETWEEN 1 AND 4),
        obs_comunicativa TEXT,
        obs_cognitiva TEXT,
        obs_socioafectiva TEXT,
        obs_corporal TEXT,
        obs_artistica TEXT,
        obs_autonomia TEXT,
        observacion_general TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_nino, id_grupo, fecha)
      );
    `);
    console.log("✅ Tabla evaluaciones_desarrollo creada exitosamente");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en migración:", err);
    process.exit(1);
  }
}

migrate();
