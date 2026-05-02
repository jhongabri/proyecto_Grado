const pool = require("./src/config/db");
const fs = require("fs");

async function generateInserts() {
  const tables = [
    'roles', 'grupos', 'periodos', 'ninos', 'acudientes', 
    'nino_acudiente', 'usuarios', 'matriculas', 'asistencia', 
    'desarrollo_infantil', 'mensajes', 'comunicados', 
    'historial_accesos', 'comportamiento', 'reportes'
  ];
  
  let allInserts = "-- Datos para migración\n\n";
  
  try {
    for (const table of tables) {
      const res = await pool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;
      
      allInserts += `-- Table: ${table}\n`;
      const columns = Object.keys(res.rows[0]);
      
      for (const row of res.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          return val;
        });
        
        allInserts += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      allInserts += "\n";
    }
    
    fs.writeFileSync("data_migration.sql", allInserts);
    console.log("Data migration script generated: data_migration.sql");
    process.exit(0);
  } catch (err) {
    console.error("Error generating inserts:", err);
    process.exit(1);
  }
}

generateInserts();
