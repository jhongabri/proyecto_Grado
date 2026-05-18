const pool = require("../config/db");

const createTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS registros_nutricionales (
          id_registro SERIAL PRIMARY KEY,
          id_nino INTEGER REFERENCES ninos(id_nino) ON DELETE CASCADE,
          fecha DATE NOT NULL DEFAULT CURRENT_DATE,
          peso NUMERIC(5,2) NOT NULL,
          talla NUMERIC(5,2) NOT NULL,
          imc NUMERIC(4,2),
          estado_nutricional VARCHAR(50),
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await pool.query(query);
    console.log("Tabla registros_nutricionales creada con éxito.");
  } catch (error) {
    console.error("Error al crear la tabla:", error);
  } finally {
    process.exit();
  }
};

createTable();
