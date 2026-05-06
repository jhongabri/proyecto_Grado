const pool = require("./src/config/db");
const fs = require("fs");
const path = require("path");

async function migrate() {
  try {
    console.log("--- Iniciando Migración a Supabase ---");

    // 1. Ejecutar Esquema
    console.log("Ejecutando esquema (schema_supabase.sql)...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "schema_supabase.sql"), "utf8");
    await pool.query(schemaSql);
    console.log("✅ Esquema creado exitosamente.");

    // 2. Ejecutar Migración de Datos
    console.log("Ejecutando migración de datos (data_migration.sql)...");
    if (fs.existsSync(path.join(__dirname, "data_migration.sql"))) {
      const dataSql = fs.readFileSync(path.join(__dirname, "data_migration.sql"), "utf8");
      // El archivo data_migration.sql puede ser grande, así que lo ejecutamos por partes si es necesario,
      // pero por ahora intentaremos todo junto ya que son inserts sencillos.
      await pool.query(dataSql);
      console.log("✅ Datos migrados exitosamente.");
    } else {
      console.log("⚠️ No se encontró el archivo data_migration.sql, saltando paso de datos.");
    }

    console.log("--- Migración Completada con Éxito 🚀 ---");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
    process.exit(1);
  }
}

migrate();
