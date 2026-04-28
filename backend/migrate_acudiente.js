const pool = require("./src/config/db");
async function migrate() {
  try {
    await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_nino INTEGER REFERENCES ninos(id_nino)");
    console.log("Migration successful: id_nino added to usuarios");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
