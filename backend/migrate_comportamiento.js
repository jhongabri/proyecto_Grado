const pool = require("./src/config/db");
async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comportamiento (
        id_comportamiento SERIAL PRIMARY KEY,
        id_nino INTEGER REFERENCES ninos(id_nino),
        estrellas INTEGER DEFAULT 0,
        fecha DATE DEFAULT CURRENT_DATE,
        id_docente INTEGER REFERENCES usuarios(id_usuario),
        observacion TEXT
      )
    `);
    console.log("Migration successful: comportamiento table created");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
