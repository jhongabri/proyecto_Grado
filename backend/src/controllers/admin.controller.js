const pool = require("../config/db");
const bcrypt = require("bcrypt");
const XLSX = require("xlsx");

exports.getAdminStats = async (req, res) => {
  try {
    const totalNinos = await pool.query(
      `SELECT COUNT(*) FROM ninos WHERE estado = true`
    );

    const totalDocentes = await pool.query(
      `SELECT COUNT(*) FROM usuarios WHERE id_rol = 2 AND estado = true`
    );

    const totalUsuarios = await pool.query(
      `SELECT COUNT(*) FROM usuarios WHERE estado = true`
    );

    res.json({
      totalNinos: parseInt(totalNinos.rows[0].count),
      totalDocentes: parseInt(totalDocentes.rows[0].count),
      totalUsuarios: parseInt(totalUsuarios.rows[0].count),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo estadísticas" });
  }
};

// ==========================================
// CREAR DOCENTE
// ==========================================
exports.createDocente = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        message: "Correo inválido"
      });
    }

    // Verificar si el correo ya existe
    const userExists = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "El correo ya está registrado"
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Rol 2 = Docente
    const id_rol = 2;

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, id_rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, correo, id_rol`,
      [nombre, correo, hashedPassword, id_rol]
    );

    const docente = result.rows[0];

    res.status(201).json({
      message: "Docente creado correctamente",
      docente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// OBTENER TODOS LOS DOCENTES
// ==========================================
exports.getAllDocentes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.id_rol, u.estado, u.id_grupo, g.nombre as nombre_grupo
       FROM usuarios u
       LEFT JOIN grupos g ON u.id_grupo = g.id_grupo
       WHERE u.id_rol = 2
       ORDER BY u.nombre`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo docentes" });
  }
};

// ==========================================
// OBTENER TODOS LOS GRUPOS (usar grupo controller ahora)
// ==========================================
exports.getAllGrupos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_grupo, nombre, edad_minima, edad_maxima, activo 
       FROM grupos 
       WHERE activo = TRUE 
       ORDER BY nombre`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo grupos" });
  }
};

// ==========================================
// OBTENER ESTUDIANTES DE UN GRUPO (para admin)
// ==========================================
exports.getEstudiantesPorGrupo = async (req, res) => {
  try {
    const { id } = req.params;

    const estudiantesResult = await pool.query(
      `SELECT m.id_matricula, n.id_nino, n.nombres, n.apellidos, n.documento as codigo,
              n.fecha_nacimiento, 
              EXTRACT(YEAR FROM age(CURRENT_DATE, n.fecha_nacimiento)) as edad
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       WHERE m.id_grupo = $1 AND m.estado = TRUE
       ORDER BY n.nombres, n.apellidos`,
      [id]
    );

    res.json({
      estudiantes: estudiantesResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo estudiantes del grupo" });
  }
};

// ==========================================
// IMPORTAR ESTUDIANTES ADMIN PARA GRUPO ESPECIFICO
// ==========================================
exports.importarEstudiantesAdmin = async (req, res) => {
  try {
    const idGrupo = req.body.id_grupo;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo Excel" });
    }

    if (!idGrupo) {
      return res.status(400).json({ message: "ID del grupo es requerido" });
    }

    // Verificar grupo existe
    const grupoCheck = await pool.query("SELECT id_grupo FROM grupos WHERE id_grupo = $1", [idGrupo]);
    if (grupoCheck.rows.length === 0) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Leer Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: "Archivo Excel vacío" });
    }

    // NO requerir periodo activo (opcional o null)
    let idPeriodo = req.body.id_periodo || null;

    const resultados = { creados: 0, existentes: 0, errores: [] };

    for (const row of data) {
      try {
        const nombres = row.nombre || row.nombres || "";
        const apellidos = row.apellido || row.apellidos || "";
        const codigo = row.codigo || row.documento || null;
        let fechaStr = null;
        const edad = parseInt(row.edad);
        
        if (row.fecha_nacimiento) {
           let fNac = row.fecha_nacimiento;
           if (fNac instanceof Date) {
             fechaStr = fNac.toISOString().split('T')[0];
           } else if (typeof fNac === 'number') {
             const unixTimestamp = (fNac - 25569) * 86400 * 1000;
             fechaStr = new Date(unixTimestamp).toISOString().split('T')[0];
           } else if (typeof fNac === 'string' && fNac.includes('/')) {
              const parts = fNac.split('/');
              if (parts.length === 3) {
                  const dd = parts[0].padStart(2, '0');
                  const mm = parts[1].padStart(2, '0');
                  const yyyy = parts[2];
                  if (yyyy.length === 4) fechaStr = `${yyyy}-${mm}-${dd}`;
              }
           } else if (typeof fNac === 'string' && fNac.includes('-')) {
              fechaStr = fNac;
           }
        } 
        
        if (!fechaStr && !isNaN(edad) && edad > 0) {
           const fechaNac = new Date();
           fechaNac.setFullYear(fechaNac.getFullYear() - edad);
           fechaStr = fechaNac.toISOString().split('T')[0];
        }

        if (!nombres || !apellidos || !fechaStr) {
          resultados.errores.push(`Fila inválida o incompleta: nombres o fecha/edad faltantes. Row: ${JSON.stringify(row)}`);
          continue;
        }

        // Check existing nino by codigo or nombres+fecha
        let existingNino = codigo ? await pool.query(`SELECT id_nino FROM ninos WHERE documento = $1`, [codigo]) : null;
        if (!existingNino || existingNino.rows.length === 0) {
          existingNino = await pool.query(
            `SELECT id_nino FROM ninos WHERE nombres ILIKE $1 AND apellidos ILIKE $2 AND fecha_nacimiento = $3`,
            [nombres, apellidos, fechaStr]
          );
        }

        let idNino;
        if (existingNino && existingNino.rows.length > 0) {
          idNino = existingNino.rows[0].id_nino;
          resultados.existentes++;
        } else {
          const ninoResult = await pool.query(
            `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, documento, estado)
             VALUES ($1, $2, $3, $4, TRUE) RETURNING id_nino`,
            [nombres, apellidos, fechaStr, codigo]
          );
          idNino = ninoResult.rows[0].id_nino;
          resultados.creados++;
        }

        // Check matricula existing
        const existingMatricula = await pool.query(
          `SELECT id_matricula FROM matriculas WHERE id_nino = $1 AND id_grupo = $2${idPeriodo ? ' AND id_periodo = $3' : ''}`,
          idPeriodo ? [idNino, idGrupo, idPeriodo] : [idNino, idGrupo]
        );

        if (existingMatricula.rows.length === 0) {
          await pool.query(
            `INSERT INTO matriculas (id_nino, id_grupo${idPeriodo ? ', id_periodo' : ''}, fecha_matricula, estado)
             VALUES ($1, $2${idPeriodo ? ', $3' : ''}, CURRENT_DATE, TRUE)`,
            idPeriodo ? [idNino, idGrupo, idPeriodo] : [idNino, idGrupo]
          );
        }

      } catch (err) {
        resultados.errores.push(`Error fila: ${err.message}`);
      }
    }

    res.json({ message: "Importación completada", resultados });
  } catch (error) {
    console.error("Error import admin:", error);
    res.status(500).json({ message: "Error importando estudiantes" });
  }
};

// ==========================================
// ASIGNAR GRUPO A DOCENTE
// ==========================================
exports.asignarGrupoDocente = async (req, res) => {
  try {
    const { id_docente, id_grupo } = req.body;

    if (!id_docente) {
      return res.status(400).json({ message: "ID del docente es requerido" });
    }

    // Verificar que el docente exista
    const docenteExists = await pool.query(
      "SELECT id_usuario, nombre FROM usuarios WHERE id_usuario = $1 AND id_rol = 2",
      [id_docente]
    );

    if (docenteExists.rows.length === 0) {
      return res.status(404).json({ message: "Docente no encontrado" });
    }

    // Verificar que el grupo exista (si se proporciona)
    if (id_grupo) {
      const grupoExists = await pool.query(
        "SELECT id_grupo FROM grupos WHERE id_grupo = $1",
        [id_grupo]
      );

      if (grupoExists.rows.length === 0) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
    }

    // Actualizar el grupo del docente
    const result = await pool.query(
      `UPDATE usuarios 
       SET id_grupo = $1 
       WHERE id_usuario = $2 
       RETURNING id_usuario, nombre, id_grupo`,
      [id_grupo || null, id_docente]
    );

    res.json({
      message: id_grupo ? "Grupo asignado correctamente" : "Grupo removido correctamente",
      docente: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error asignando grupo" });
  }
};

// Agregar estudiante manual a grupo admin
exports.agregarEstudianteGrupo = async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const { nombres, apellidos, fecha_nacimiento, documento } = req.body;

    if (!nombres || !apellidos || !fecha_nacimiento) {
      return res.status(400).json({ message: "Nombres, apellidos y fecha de nacimiento son obligatorios" });
    }

    const grupoExists = await pool.query("SELECT id_grupo FROM grupos WHERE id_grupo = $1", [id_grupo]);
    if (grupoExists.rows.length === 0) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    let idNino;
    let existingNino = documento ? 
      await pool.query("SELECT id_nino FROM ninos WHERE documento = $1", [documento]) : null;

    if (!existingNino || existingNino.rows.length === 0) {
      existingNino = await pool.query(
        "SELECT id_nino FROM ninos WHERE nombres = $1 AND fecha_nacimiento = $2",
        [nombres, fecha_nacimiento]
      );
    }

    if (existingNino && existingNino.rows.length > 0) {
      idNino = existingNino.rows[0].id_nino;
    } else {
      const result = await pool.query(
        `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, documento, estado)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING id_nino`,
        [nombres, apellidos, fecha_nacimiento, documento || null]
      );
      idNino = result.rows[0].id_nino;
    }

    const checkMat = await pool.query(
      "SELECT id_matricula FROM matriculas WHERE id_nino = $1 AND id_grupo = $2",
      [idNino, id_grupo]
    );
    
    if (checkMat.rows.length > 0) {
      return res.status(400).json({ message: "El estudiante ya está en este grupo" });
    }

    await pool.query(
      "INSERT INTO matriculas (id_nino, id_grupo, fecha_matricula, estado) VALUES ($1, $2, CURRENT_DATE, TRUE)",
      [idNino, id_grupo]
    );

    res.json({ message: "Estudiante agregado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al agregar estudiante" });
  }
};

// Eliminar estudiante de grupo admin
exports.eliminarEstudianteGrupo = async (req, res) => {
  try {
    const { id_matricula } = req.params;

    const checkMat = await pool.query(
      "SELECT id_matricula FROM matriculas WHERE id_matricula = $1",
      [id_matricula]
    );
    if (checkMat.rows.length === 0) return res.status(404).json({ message: "Matrícula no encontrada" });

    await pool.query("DELETE FROM matriculas WHERE id_matricula = $1", [id_matricula]);

    res.json({ message: "Estudiante retirado del grupo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al retirar estudiante" });
  }
};
// Actualizar datos de un estudiante admin
exports.actualizarEstudianteGrupo = async (req, res) => {
  try {
    const { id_nino } = req.params;
    const { nombres, apellidos, fecha_nacimiento, documento } = req.body;

    if (!nombres || !apellidos || !fecha_nacimiento) {
      return res.status(400).json({ message: "Nombres, apellidos y fecha de nacimiento son obligatorios" });
    }

    const result = await pool.query(
      `UPDATE ninos SET nombres = $1, apellidos = $2, fecha_nacimiento = $3, documento = $4 
       WHERE id_nino = $5 RETURNING *`,
      [nombres, apellidos, fecha_nacimiento, documento || null, id_nino]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    res.json({ message: "Estudiante actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar estudiante" });
  }
};

// Vincular acudiente con niño
exports.vincularAcudienteNino = async (req, res) => {
  try {
    const { id_usuario, id_nino } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ message: "ID del usuario es requerido" });
    }

    // Verificar que el usuario exista y sea rol 3 (Acudiente)
    const userResult = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND id_rol = 3",
      [id_usuario]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario acudiente no encontrado" });
    }

    // Actualizar el id_nino del usuario
    await pool.query(
      "UPDATE usuarios SET id_nino = $1 WHERE id_usuario = $2",
      [id_nino || null, id_usuario]
    );

    res.json({ message: id_nino ? "Niño vinculado correctamente" : "Vínculo removido" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al vincular niño" });
  }
};

// Obtener acudientes sin niño (o todos los acudientes para gestión)
exports.getAllAcudientes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.id_nino, n.nombres as nino_nombres, n.apellidos as nino_apellidos
       FROM usuarios u
       LEFT JOIN ninos n ON u.id_nino = n.id_nino
       WHERE u.id_rol = 3
       ORDER BY u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener acudientes" });
  }
};
