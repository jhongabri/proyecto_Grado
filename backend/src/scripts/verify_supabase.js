const pool = require("../config/db");

const verifyTable = async () => {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'registros_nutricionales';
    `);
    
    if (res.rows.length > 0) {
      console.log("¡Confirmado! La tabla 'registros_nutricionales' existe perfectamente en Supabase.");
      
      // Let's also print the columns just to be sure
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'registros_nutricionales';
      `);
      console.log("\nEstructura de la tabla:");
      cols.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log("La tabla no se encontró en Supabase.");
    }
  } catch (error) {
    console.error("Error al conectar o consultar Supabase:", error);
  } finally {
    process.exit();
  }
};

verifyTable();
