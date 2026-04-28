const pool = require("./src/config/db");
async function migrate() {
  try {
    await pool.query("ALTER TABLE comportamiento ADD CONSTRAINT unique_nino_fecha UNIQUE (id_nino, fecha)");
    console.log("Migration successful: unique constraint added to comportamiento");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
