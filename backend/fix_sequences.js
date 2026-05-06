const pool = require("./src/config/db");

async function fixSequences() {
  const tables = [
    { name: 'roles', id: 'id_rol' },
    { name: 'grupos', id: 'id_grupo' },
    { name: 'periodos', id: 'id_periodo' },
    { name: 'ninos', id: 'id_nino' },
    { name: 'acudientes', id: 'id_acudiente' },
    { name: 'nino_acudiente', id: 'id' },
    { name: 'usuarios', id: 'id_usuario' },
    { name: 'matriculas', id: 'id_matricula' },
    { name: 'asistencia', id: 'id_asistencia' },
    { name: 'desarrollo_infantil', id: 'id_registro' },
    { name: 'mensajes', id: 'id_mensaje' },
    { name: 'comunicados', id: 'id_comunicado' },
    { name: 'historial_accesos', id: 'id_historial' },
    { name: 'comportamiento', id: 'id_comportamiento' },
    { name: 'reportes', id: 'id_reporte' }
  ];

  try {
    console.log("Sincronizando secuencias en Supabase...");
    for (const table of tables) {
      const query = `SELECT setval(pg_get_serial_sequence('${table.name}', '${table.id}'), coalesce(max(${table.id}), 1)) FROM ${table.name};`;
      await pool.query(query);
      console.log(`✅ Secuencia de ${table.name} actualizada.`);
    }
    console.log("¡Todas las secuencias están sincronizadas! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("Error sincronizando secuencias:", err);
    process.exit(1);
  }
}

fixSequences();
