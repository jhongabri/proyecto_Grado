const pool = require("../config/db");
const XLSX = require("xlsx");

// Obtener datos del dashboard del docente
exports.getDashboardDocente = async (req, res) => {
  try {
    const idDocente = req.user.id;

    // 1. Obtener los grupos asignados al docente
    const gruposResult = await pool.query(
      `SELECT g.id_grupo, g.nombre, g.edad_minima, g.edad_maxima, g.horario
       FROM grupos g
       INNER JOIN usuario_grupos ug ON ug.id_grupo = g.id_grupo
       WHERE ug.id_usuario = $1`,
      [idDocente]
    );

    if (gruposResult.rows.length === 0) {
      return res.json({ 
        grupos: [], 
        message: "No tienes grupos asignados" 
      });
    }

    const grupos = gruposResult.rows;
    const idGrupo = req.query.id_grupo || grupos[0].id_grupo;
    const grupoActivo = grupos.find(g => g.id_grupo == idGrupo) || grupos[0];

    // 2. Obtener estudiantes matriculados en el grupo activo
    const estudiantesResult = await pool.query(
      `SELECT m.id_matricula, n.id_nino, n.nombres, n.apellidos, n.fecha_nacimiento
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       WHERE m.id_grupo = $1 AND m.estado = TRUE`,
      [grupoActivo.id_grupo]
    );

    const estudiantes = estudiantesResult.rows;

    // 3. Obtener estadísticas de asistencia
    const asistenciaStats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) as ausentes
       FROM asistencia a
       INNER JOIN matriculas m ON a.id_matricula = m.id_matricula
       WHERE m.id_grupo = $1 
       AND DATE_TRUNC('month', a.fecha) = DATE_TRUNC('month', CURRENT_DATE)`,
      [grupoActivo.id_grupo]
    );

    // 4. Obtener últimos reportes
    const reportesResult = await pool.query(
      `SELECT r.id_reporte, r.titulo, r.descripcion, r.fecha, r.estado
       FROM reportes r
       WHERE r.id_docente = $1
       ORDER BY r.fecha DESC
       LIMIT 5`,
      [idDocente]
    );

    const stats = asistenciaStats.rows[0];
    const porcentajeAsistencia = stats.total > 0 
      ? Math.round((stats.presentes / stats.total) * 100) 
      : 0;

    res.json({
      grupos,
      grupoActivo: {
        ...grupoActivo,
        total_estudiantes: estudiantes.length
      },
      estudiantes,
      estadisticas: {
        total_asistencias: Number(stats.total) || 0,
        presentes: Number(stats.presentes) || 0,
        ausentes: Number(stats.ausentes) || 0,
        porcentaje_asistencia: porcentajeAsistencia
      },
      reportes: reportesResult.rows
    });

  } catch (error) {
    console.error("Error Dashboard Docente:", error);
    res.status(500).json({ message: "Error al cargar dashboard" });
  }
};

// Importar estudiantes desde Excel
exports.importarEstudiantes = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const idGrupo = req.body.id_grupo;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: "yyyy-mm-dd" });

    if (data.length === 0) {
      return res.status(400).json({ message: "El archivo está vacío" });
    }

    const periodoResult = await pool.query(`SELECT id_periodo FROM periodos WHERE activo = TRUE LIMIT 1`);
    let idPeriodo = periodoResult.rows.length > 0 ? periodoResult.rows[0].id_periodo : null;

    const resultados = { creados: 0, existentes: 0, errores: [] };

    for (const row of data) {
      try {
        const nombreCompleto = row.nombres || row.nombre || "";
        const apellidoCompleto = row.apellidos || row.apellido || "";
        let fechaNacimiento = row.fecha_nacimiento;

        if (!nombreCompleto || !fechaNacimiento) {
          resultados.errores.push(`Fila sin datos requeridos.`);
          continue;
        }

        let existingNino = row.documento ? await pool.query(`SELECT id_nino FROM ninos WHERE documento = $1`, [row.documento]) : null;
        if (!existingNino || existingNino.rows.length === 0) {
          existingNino = await pool.query(`SELECT id_nino FROM ninos WHERE nombres = $1 AND fecha_nacimiento = $2`, [nombreCompleto, fechaNacimiento]);
        }

        let idNino;
        if (existingNino && existingNino.rows.length > 0) {
          idNino = existingNino.rows[0].id_nino;
          resultados.existentes++;
        } else {
          const ninoResult = await pool.query(
            `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, documento, estado) VALUES ($1, $2, $3, $4, TRUE) RETURNING id_nino`,
            [nombreCompleto, apellidoCompleto, fechaNacimiento, row.documento || null]
          );
          idNino = ninoResult.rows[0].id_nino;
          resultados.creados++;
        }

        const checkMat = await pool.query(`SELECT id_matricula FROM matriculas WHERE id_nino = $1 AND id_grupo = $2`, [idNino, idGrupo]);
        if (checkMat.rows.length === 0) {
          await pool.query(
            `INSERT INTO matriculas (id_nino, id_grupo, id_periodo, fecha_matricula, estado) VALUES ($1, $2, $3, CURRENT_DATE, TRUE)`,
            [idNino, idGrupo, idPeriodo]
          );
        }
      } catch (err) {
        resultados.errores.push(`Error procesando fila: ${err.message}`);
      }
    }

    res.json({ message: "Importación completada", resultados });
  } catch (error) {
    console.error("Error Importar:", error);
    res.status(500).json({ message: "Error al importar estudiantes" });
  }
};

// Obtener lista de estudiantes para asistencia
exports.getEstudiantesAsistencia = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_grupo, fecha } = req.query;
    if (!id_grupo) return res.status(400).json({ message: "ID de grupo es requerido" });

    const checkAcceso = await pool.query(`SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`, [idDocente, id_grupo]);
    if (checkAcceso.rows.length === 0) return res.status(403).json({ message: "No tienes acceso a este grupo" });

    const fechaBusca = fecha || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT m.id_matricula, n.id_nino, n.nombres, n.apellidos, a.estado as asistencia_estado, a.observacion as asistencia_observacion, c.estrellas as comportamiento_estrellas
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       LEFT JOIN asistencia a ON m.id_matricula = a.id_matricula AND a.fecha = $1
       LEFT JOIN comportamiento c ON n.id_nino = c.id_nino AND c.fecha = $1
       WHERE m.id_grupo = $2 AND m.estado = TRUE
       ORDER BY n.nombres`,
      [fechaBusca, id_grupo]
    );

    res.json({ fecha: fechaBusca, id_grupo, estudiantes: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener estudiantes" });
  }
};

// Registrar asistencia
exports.registrarAsistencia = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_matricula, fecha, estado, observacion, id_grupo } = req.body;

    const checkAcceso = await pool.query(`SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`, [idDocente, id_grupo]);
    if (checkAcceso.rows.length === 0) return res.status(403).json({ message: "No autorizado" });

    const existing = await pool.query(`SELECT id_asistencia FROM asistencia WHERE id_matricula = $1 AND fecha = $2`, [id_matricula, fecha]);

    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE asistencia SET estado = $1, observacion = $2, registrado_por = $3 WHERE id_matricula = $4 AND fecha = $5 RETURNING *`,
        [estado, observacion, idDocente, id_matricula, fecha]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO asistencia (id_matricula, fecha, estado, observacion, registrado_por) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_matricula, fecha, estado, observacion, idDocente]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar asistencia" });
  }
};

// Reportes
exports.crearReporte = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { titulo, descripcion, tipo } = req.body;
    const result = await pool.query(
      `INSERT INTO reportes (id_docente, titulo, descripcion, tipo, fecha, estado) VALUES ($1, $2, $3, $4, CURRENT_DATE, 'pendiente') RETURNING *`,
      [idDocente, titulo, descripcion, tipo || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al crear reporte" });
  }
};

exports.getReportesAdmin = async (req, res) => {
  try {
    const result = await pool.query(`SELECT r.*, u.nombre as docente_nombre FROM reportes r INNER JOIN usuarios u ON r.id_docente = u.id_usuario ORDER BY r.fecha DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.actualizarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await pool.query(`UPDATE reportes SET estado = $1 WHERE id_reporte = $2 RETURNING *`, [estado, id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

// Gestión Estudiantes Lista
exports.getEstudiantesLista = async (req, res) => {
  try {
    const userId = req.user.id;
    const idGrupo = req.query.id_grupo;
    if (!idGrupo) return res.json([]);
    const check = await pool.query(`SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`, [userId, idGrupo]);
    if (check.rows.length === 0) return res.status(403).json({ message: "No autorizado" });

    const result = await pool.query(
      `SELECT m.id_matricula, n.id_nino, n.nombres, n.apellidos, n.fecha_nacimiento, n.documento
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       WHERE m.id_grupo = $1 AND m.estado = TRUE
       ORDER BY n.nombres`,
      [idGrupo]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

exports.agregarEstudianteManual = async (req, res) => {
  try {
    const { nombres, apellidos, fecha_nacimiento, documento, id_grupo } = req.body;
    const result = await pool.query(
      `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, documento, estado) VALUES ($1, $2, $3, $4, TRUE) RETURNING id_nino`,
      [nombres, apellidos, fecha_nacimiento, documento || null]
    );
    const idNino = result.rows[0].id_nino;
    await pool.query(`INSERT INTO matriculas (id_nino, id_grupo, fecha_matricula, estado) VALUES ($1, $2, CURRENT_DATE, TRUE)`, [idNino, id_grupo]);
    res.json({ message: "Éxito" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

exports.actualizarEstudianteManual = async (req, res) => {
  try {
    const { id_nino } = req.params;
    const { nombres, apellidos, fecha_nacimiento, documento } = req.body;
    await pool.query(`UPDATE ninos SET nombres = $1, apellidos = $2, fecha_nacimiento = $3, documento = $4 WHERE id_nino = $5`, [nombres, apellidos, fecha_nacimiento, documento || null, id_nino]);
    res.json({ message: "Éxito" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

exports.eliminarEstudianteManual = async (req, res) => {
  try {
    const { id_matricula } = req.params;
    await pool.query(`DELETE FROM matriculas WHERE id_matricula = $1`, [id_matricula]);
    res.json({ message: "Éxito" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

exports.registrarComportamiento = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_nino, estrellas, observacion } = req.body;
    const result = await pool.query(
      `INSERT INTO comportamiento (id_nino, estrellas, id_docente, observacion, fecha)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       ON CONFLICT (id_nino, fecha) DO UPDATE SET estrellas = EXCLUDED.estrellas, observacion = EXCLUDED.observacion RETURNING *`,
      [id_nino, estrellas || 0, idDocente, observacion || ""]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

// --- TAREAS Y RECURSOS ---

exports.getTareas = async (req, res) => {
  try {
    const { id_grupo } = req.query;
    const result = await pool.query(`SELECT * FROM tareas WHERE id_grupo = $1 ORDER BY fecha_creacion DESC`, [id_grupo]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.crearTarea = async (req, res) => {
  try {
    const idDocente = req.user.id;
    if (!req.body) {
      console.error("DEBUG: req.body is undefined in crearTarea");
      return res.status(400).json({ message: "No se recibieron datos (body undefined)" });
    }
    let { id_grupo, titulo, descripcion, fecha_entrega, recurso_url } = req.body;

    if (req.file) {
      recurso_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    if (!id_grupo) return res.status(400).json({ message: "id_grupo es requerido" });

    const result = await pool.query(
      `INSERT INTO tareas (id_grupo, id_docente, titulo, descripcion, fecha_entrega, recurso_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id_grupo, idDocente, titulo, descripcion, fecha_entrega || null, recurso_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear tarea" });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id } = req.params;
    await pool.query(`DELETE FROM tareas WHERE id_tarea = $1 AND id_docente = $2`, [id, idDocente]);
    res.json({ message: "Eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.getRecursos = async (req, res) => {
  try {
    const { id_grupo } = req.query;
    const result = await pool.query(`SELECT * FROM recursos WHERE id_grupo = $1 ORDER BY fecha_creacion DESC`, [id_grupo]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.crearRecurso = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.body) {
      console.error("DEBUG: req.body is undefined in crearRecurso");
      return res.status(400).json({ message: "No se recibieron datos (body undefined)" });
    }
    const { id_grupo, titulo, descripcion, tipo } = req.body;
    let { url } = req.body;

    if (req.file) {
      url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    if (!id_grupo) return res.status(400).json({ message: "id_grupo es requerido" });

    await pool.query(
      `INSERT INTO recursos (id_grupo, titulo, descripcion, tipo, url) VALUES ($1, $2, $3, $4, $5)`,
      [id_grupo, titulo, descripcion, tipo, url]
    );
    res.json({ message: "Publicado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
};

exports.eliminarRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM recursos WHERE id_recurso = $1`, [id]);
    res.json({ message: "Eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

// --- BÚSQUEDA Y EVALUACIÓN ---

exports.buscarEstudiantes = async (req, res) => {
  try {
    const userId = req.user.id;
    let { query } = req.query;
    if (!query) return res.json([]);
    query = query.trim();

    console.log(`DEBUG: Docente ${userId} buscando: "${query}"`);

    const result = await pool.query(
      `SELECT DISTINCT ON (n.id_nino) n.id_nino, n.nombres, n.apellidos, n.documento, g.nombre as grupo_nombre
       FROM ninos n
       INNER JOIN matriculas m ON n.id_nino = m.id_nino AND m.estado = TRUE
       INNER JOIN grupos g ON m.id_grupo = g.id_grupo
       INNER JOIN usuario_grupos ug ON g.id_grupo = ug.id_grupo
       WHERE ug.id_usuario = $1 
       AND (CONCAT(n.nombres, ' ', n.apellidos) ILIKE $2 
            OR n.documento::text ILIKE $2)
       ORDER BY n.id_nino
       LIMIT 10`,
      [userId, `%${query}%`]
    );

    console.log(`DEBUG: Resultados encontrados: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error("Search Docente Error:", error);
    res.status(500).json({ message: "Error al buscar" });
  }
};

exports.evaluarDesarrollo = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_nino, id_grupo, fecha, comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia, observacion_general } = req.body;
    const fechaEval = fecha || new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `INSERT INTO evaluaciones_desarrollo (id_nino, id_grupo, id_docente, fecha, comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia, observacion_general)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id_nino, id_grupo, fecha) DO UPDATE SET comunicativa = EXCLUDED.comunicativa, cognitiva = EXCLUDED.cognitiva, socioafectiva = EXCLUDED.socioafectiva, corporal = EXCLUDED.corporal, artistica = EXCLUDED.artistica, autonomia = EXCLUDED.autonomia, observacion_general = EXCLUDED.observacion_general RETURNING *`,
      [id_nino, id_grupo, idDocente, fechaEval, comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia, observacion_general || ""]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
};

exports.getEvaluacionNino = async (req, res) => {
  try {
    const { id_nino } = req.params;
    const { id_grupo } = req.query;
    const result = await pool.query(`SELECT ed.*, n.nombres, n.apellidos FROM evaluaciones_desarrollo ed INNER JOIN ninos n ON ed.id_nino = n.id_nino WHERE ed.id_nino = $1 AND ed.id_grupo = $2 ORDER BY ed.fecha DESC LIMIT 1`, [id_nino, id_grupo]);
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.getEvaluacionesGrupo = async (req, res) => {
  try {
    const { id_grupo } = req.query;
    const result = await pool.query(`SELECT DISTINCT ON (ed.id_nino) ed.*, n.nombres, n.apellidos FROM evaluaciones_desarrollo ed INNER JOIN ninos n ON ed.id_nino = n.id_nino WHERE ed.id_grupo = $1 ORDER BY ed.id_nino, ed.fecha DESC`, [id_grupo]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};
