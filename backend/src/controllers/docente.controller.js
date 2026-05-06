
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
    // Por defecto cargamos datos del primer grupo si no se especifica uno
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

    // 3. Obtener estadísticas de asistencia del mes actual para el grupo activo
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

    // 4. Obtener últimos reportes del docente
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

    // Leer archivo Excel configurando fechas
    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: "yyyy-mm-dd" });

    if (data.length === 0) {
      return res.status(400).json({ message: "El archivo está vacío" });
    }

    // Obtener el período activo (opcional)
    const periodoResult = await pool.query(
      `SELECT id_periodo FROM periodos WHERE activo = TRUE LIMIT 1`
    );
    
    let idPeriodo = null;
    if (periodoResult.rows.length > 0) {
      idPeriodo = periodoResult.rows[0].id_periodo;
    }

    const resultados = {
      creados: 0,
      existentes: 0,
      errores: []
    };

    for (const row of data) {
      try {
        // Validar datos requeridos (soporta nombres o nombre)
        const nombreCompleto = row.nombres || row.nombre || "";
        const apellidoCompleto = row.apellidos || row.apellido || "";
        
        // Manejar fecha de nacimiento (si Excel la convierte a numérico o Date, o dateNF de raw:false)
        let fechaNacimiento = null;
        let fNac = row.fecha_nacimiento;
        const edad = parseInt(row.edad);

        if (fNac instanceof Date) {
          fechaNacimiento = fNac.toISOString().split('T')[0];
        } else if (typeof fNac === 'number') {
          const unixTimestamp = (fNac - 25569) * 86400 * 1000;
          fechaNacimiento = new Date(unixTimestamp).toISOString().split('T')[0];
        } else if (typeof fNac === 'string' && fNac.includes('/')) {
           const parts = fNac.split('/');
           if (parts.length === 3) {
               const dd = parts[0].padStart(2, '0');
               const mm = parts[1].padStart(2, '0');
               const yyyy = parts[2];
               if (yyyy.length === 4) {
                   fechaNacimiento = `${yyyy}-${mm}-${dd}`;
               }
           }
        } else if (typeof fNac === 'string' && fNac.includes('-')) {
           fechaNacimiento = fNac;
        }

        if (!fechaNacimiento && !isNaN(edad) && edad > 0) {
           const tempDate = new Date();
           tempDate.setFullYear(tempDate.getFullYear() - edad);
           fechaNacimiento = tempDate.toISOString().split('T')[0];
        }

        if (!nombreCompleto || !fechaNacimiento) {
          resultados.errores.push(`Fila sin datos requeridos: Nombres o Fecha de Nacimiento faltantes.`);
          continue;
        }

        // Verificar si el niño ya existe por documento o por nombre y fecha
        let existingNino;
        if (row.documento) {
          existingNino = await pool.query(
            `SELECT id_nino FROM ninos WHERE documento = $1`,
            [row.documento]
          );
        }
        
        if (!existingNino || existingNino.rows.length === 0) {
          // Buscar por nombre y fecha de nacimiento
          existingNino = await pool.query(
            `SELECT id_nino FROM ninos WHERE nombres = $1 AND fecha_nacimiento = $2`,
            [nombreCompleto, fechaNacimiento]
          );
        }

        let idNino;

        if (existingNino && existingNino.rows.length > 0) {
          // Niño ya existe
          idNino = existingNino.rows[0].id_nino;
          resultados.existentes++;
        } else {
          // Crear nuevo niño
          const ninoResult = await pool.query(
            `INSERT INTO ninos (nombres, apellidos, fecha_nacimiento, documento, estado)
             VALUES ($1, $2, $3, $4, TRUE)
             RETURNING id_nino`,
            [nombreCompleto, apellidoCompleto, fechaNacimiento, row.documento || null]
          );
          idNino = ninoResult.rows[0].id_nino;
          resultados.creados++;
        }

        // Verificar si ya está matriculado en el grupo (y período si existe)
        let existingMatricula;
        if (idPeriodo) {
          existingMatricula = await pool.query(
            `SELECT id_matricula FROM matriculas WHERE id_nino = $1 AND id_grupo = $2 AND id_periodo = $3`,
            [idNino, idGrupo, idPeriodo]
          );
        } else {
          existingMatricula = await pool.query(
            `SELECT id_matricula FROM matriculas WHERE id_nino = $1 AND id_grupo = $2`,
            [idNino, idGrupo]
          );
        }

        if (existingMatricula.rows.length === 0) {
          // Crear matrícula
          if (idPeriodo) {
            await pool.query(
              `INSERT INTO matriculas (id_nino, id_grupo, id_periodo, fecha_matricula, estado)
               VALUES ($1, $2, $3, CURRENT_DATE, TRUE)`,
              [idNino, idGrupo, idPeriodo]
            );
          } else {
            await pool.query(
              `INSERT INTO matriculas (id_nino, id_grupo, fecha_matricula, estado)
               VALUES ($1, $2, CURRENT_DATE, TRUE)`,
              [idNino, idGrupo]
            );
          }
        }

      } catch (err) {
        resultados.errores.push(`Error procesando fila: ${err.message}`);
      }
    }

    res.json({
      message: "Importación completada",
      resultados
    });

  } catch (error) {
    console.error("Error Importar:", error);
    res.status(500).json({ message: "Error al importar estudiantes" });
  }
};

// Obtener lista de estudiantes para pasar asistencia
exports.getEstudiantesAsistencia = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const idGrupo = req.query.id_grupo;

    if (!idGrupo) {
      return res.status(400).json({ message: "ID de grupo es requerido" });
    }

    // Verificar acceso al grupo
    const checkAcceso = await pool.query(
      `SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`,
      [idDocente, idGrupo]
    );

    if (checkAcceso.rows.length === 0) {
      return res.status(403).json({ message: "No tienes acceso a este grupo" });
    }

    // Obtener estudiantes con su asistencia del día
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const estudiantesResult = await pool.query(
      `SELECT 
        m.id_matricula,
        n.id_nino,
        n.nombres,
        n.apellidos,
        n.fecha_nacimiento,
        a.estado as asistencia_estado,
        a.observacion as asistencia_observacion,
        c.estrellas as comportamiento_estrellas
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       LEFT JOIN asistencia a ON m.id_matricula = a.id_matricula AND a.fecha = $1
       LEFT JOIN comportamiento c ON n.id_nino = c.id_nino AND c.fecha = $1
       WHERE m.id_grupo = $2 AND m.estado = TRUE
       ORDER BY n.nombres`,
      [fecha, idGrupo]
    );

    res.json({
      fecha,
      id_grupo: idGrupo,
      estudiantes: estudiantesResult.rows
    });

  } catch (error) {
    console.error("Error getEstudiantesAsistencia:", error);
    res.status(500).json({ message: "Error al obtener estudiantes" });
  }
};

// Registrar asistencia
exports.registrarAsistencia = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_matricula, fecha, estado, observacion, id_grupo } = req.body;

    if (!id_grupo) {
      return res.status(400).json({ message: "ID de grupo es requerido" });
    }

    // Verificar que el docente tenga acceso a este grupo
    const checkAcceso = await pool.query(
      `SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`,
      [idDocente, id_grupo]
    );

    if (checkAcceso.rows.length === 0) {
      return res.status(403).json({ message: "No tienes acceso a este grupo" });
    }

    // Verificar que la matrícula pertenezca al grupo indicado
    const matriculaResult = await pool.query(
      `SELECT m.id_matricula FROM matriculas m
       WHERE m.id_matricula = $1 AND m.id_grupo = $2`,
      [id_matricula, id_grupo]
    );

    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ message: "Matrícula no pertenece al grupo" });
    }

    // Verificar si ya existe asistencia para esa fecha
    const existingAsistencia = await pool.query(
      `SELECT id_asistencia FROM asistencia 
       WHERE id_matricula = $1 AND fecha = $2`,
      [id_matricula, fecha]
    );

    if (existingAsistencia.rows.length > 0) {
      // Actualizar asistencia existente
      const result = await pool.query(
        `UPDATE asistencia 
         SET estado = $1, observacion = $2, registrado_por = $3
         WHERE id_matricula = $4 AND fecha = $5
         RETURNING *`,
        [estado, observacion, idDocente, id_matricula, fecha]
      );
      return res.json(result.rows[0]);
    }

    // Crear nueva asistencia
    const result = await pool.query(
      `INSERT INTO asistencia (id_matricula, fecha, estado, observacion, registrado_por)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_matricula, fecha, estado, observacion, idDocente]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error registrar asistencia:", error);
    res.status(500).json({ message: "Error al registrar asistencia" });
  }
};

// Crear reporte/queja
exports.crearReporte = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { titulo, descripcion, tipo } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({ message: "Título y descripción son requeridos" });
    }

    const result = await pool.query(
      `INSERT INTO reportes (id_docente, titulo, descripcion, tipo, fecha, estado)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 'pendiente')
       RETURNING *`,
      [idDocente, titulo, descripcion, tipo || 'general']
    );

    res.status(201).json({
      message: "Reporte creado exitosamente",
      reporte: result.rows[0]
    });

  } catch (error) {
    console.error("Error crear reporte:", error);
    res.status(500).json({ message: "Error al crear reporte" });
  }
};

// Obtener reportes del admin
exports.getReportesAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id_reporte, r.titulo, r.descripcion, r.tipo, r.fecha, r.estado,
              u.nombre as docente_nombre
       FROM reportes r
       INNER JOIN usuarios u ON r.id_docente = u.id_usuario
       ORDER BY r.fecha DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getReportesAdmin:", error);
    res.status(500).json({ message: "Error al obtener reportes" });
  }
};

// Actualizar estado del reporte
exports.actualizarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await pool.query(
      `UPDATE reportes SET estado = $1 WHERE id_reporte = $2 RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizar reporte:", error);
    res.status(500).json({ message: "Error al actualizar reporte" });
  }
};

// Obtener lista directa de estudiantes para gestión
exports.getEstudiantesLista = async (req, res) => {
  try {
    const userId = req.user.id;
    const idGrupo = req.query.id_grupo;

    if (!idGrupo) {
      return res.json([]);
    }

    // Verificar acceso
    const checkAcceso = await pool.query(
      "SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2",
      [userId, idGrupo]
    );

    if (checkAcceso.rows.length === 0) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const estudiantes = await pool.query(
      `SELECT m.id_matricula, n.id_nino, n.nombres, n.apellidos, n.fecha_nacimiento, n.documento
       FROM matriculas m
       INNER JOIN ninos n ON m.id_nino = n.id_nino
       WHERE m.id_grupo = $1 AND m.estado = TRUE
       ORDER BY n.nombres ASC`,
      [idGrupo]
    );

    res.json(estudiantes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener lista" });
  }
};

// Agregar estudiante manual
exports.agregarEstudianteManual = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombres, apellidos, fecha_nacimiento, documento, id_grupo } = req.body;

    if (!nombres || !apellidos || !fecha_nacimiento || !id_grupo) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Verificar acceso
    const checkAcceso = await pool.query(
      "SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2",
      [userId, id_grupo]
    );
    if (checkAcceso.rows.length === 0) {
      return res.status(403).json({ message: "No autorizado" });
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

// Actualizar datos de un estudiante
exports.actualizarEstudianteManual = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_nino } = req.params;
    const { nombres, apellidos, fecha_nacimiento, documento } = req.body;

    if (!nombres || !apellidos || !fecha_nacimiento) {
      return res.status(400).json({ message: "Nombres, apellidos y fecha de nacimiento son obligatorios" });
    }

    // Verificar que el docente tenga grupo asignado
    const grupo = await pool.query(
      "SELECT id_grupo FROM usuarios WHERE id_usuario = $1 AND id_rol = 2",
      [userId]
    );
    if (grupo.rows.length === 0 || !grupo.rows[0].id_grupo) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Verificar que el niño pertenezca al grupo del docente
    const checkMat = await pool.query(
      "SELECT m.id_matricula FROM matriculas m WHERE m.id_nino = $1 AND m.id_grupo = $2 AND m.estado = TRUE",
      [id_nino, grupo.rows[0].id_grupo]
    );
    if (checkMat.rows.length === 0) {
      return res.status(404).json({ message: "Estudiante no encontrado en tu grupo" });
    }

    await pool.query(
      `UPDATE ninos SET nombres = $1, apellidos = $2, fecha_nacimiento = $3, documento = $4 WHERE id_nino = $5`,
      [nombres, apellidos, fecha_nacimiento, documento || null, id_nino]
    );

    res.json({ message: "Estudiante actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar estudiante" });
  }
};

// Retirar estudiante manual
exports.eliminarEstudianteManual = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_matricula } = req.params;

    const grupo = await pool.query(
      "SELECT id_grupo FROM usuarios WHERE id_usuario = $1 AND id_rol = 2",
      [userId]
    );
    if (grupo.rows.length === 0 || !grupo.rows[0].id_grupo) {
      return res.status(403).json({ message: "No autorizado" });
    }
    
    const checkMat = await pool.query(
      "SELECT id_matricula FROM matriculas WHERE id_matricula = $1 AND id_grupo = $2",
      [id_matricula, grupo.rows[0].id_grupo]
    );
    if (checkMat.rows.length === 0) return res.status(404).json({ message: "Matrícula no encontrada en su grupo" });

    await pool.query("DELETE FROM matriculas WHERE id_matricula = $1", [id_matricula]);

    res.json({ message: "Estudiante retirado del grupo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al retirar estudiante" });
  }
};

// Registrar comportamiento (estrellas)
exports.registrarComportamiento = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_nino, estrellas, observacion } = req.body;

    if (!id_nino) {
      return res.status(400).json({ message: "ID del niño es requerido" });
    }

    // Insertar o actualizar comportamiento para el día de hoy
    const result = await pool.query(
      `INSERT INTO comportamiento (id_nino, estrellas, id_docente, observacion, fecha)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       ON CONFLICT (id_nino, fecha) DO UPDATE 
       SET estrellas = EXCLUDED.estrellas, observacion = EXCLUDED.observacion
       RETURNING *`,
      [id_nino, estrellas || 0, idDocente, observacion || ""]
    );

    res.json({
      message: "Comportamiento registrado",
      comportamiento: result.rows[0]
    });

  } catch (error) {
    console.error("Error Behavior:", error);
    res.status(500).json({ message: "Error al registrar comportamiento" });
  }
};

// --- GESTIÓN DE TAREAS ---

// Obtener tareas por grupo
exports.getTareas = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_grupo } = req.query;

    if (!id_grupo) return res.status(400).json({ message: "Grupo requerido" });

    const result = await pool.query(
      `SELECT * FROM tareas WHERE id_grupo = $1 ORDER BY fecha_creacion DESC`,
      [id_grupo]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
};

// Crear tarea
exports.crearTarea = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id_grupo, titulo, descripcion, fecha_entrega, recurso_url } = req.body;

    const result = await pool.query(
      `INSERT INTO tareas (id_grupo, id_docente, titulo, descripcion, fecha_entrega, recurso_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id_grupo, idDocente, titulo, descripcion, fecha_entrega, recurso_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear tarea" });
  }
};

// Eliminar tarea
exports.eliminarTarea = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const { id } = req.params;

    await pool.query("DELETE FROM tareas WHERE id_tarea = $1 AND id_docente = $2", [id, idDocente]);
    res.json({ message: "Tarea eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
};

// --- EVALUACIÓN DE DESARROLLO INFANTIL ---

// Crear o actualizar evaluación de desarrollo de un niño
exports.evaluarDesarrollo = async (req, res) => {
  try {
    const idDocente = req.user.id;
    const {
      id_nino, id_grupo, fecha,
      comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia,
      obs_comunicativa, obs_cognitiva, obs_socioafectiva, obs_corporal, obs_artistica, obs_autonomia,
      observacion_general
    } = req.body;

    if (!id_nino || !id_grupo) {
      return res.status(400).json({ message: "ID del niño y grupo son requeridos" });
    }

    // Verificar que el docente tenga acceso al grupo
    const checkAcceso = await pool.query(
      `SELECT 1 FROM usuario_grupos WHERE id_usuario = $1 AND id_grupo = $2`,
      [idDocente, id_grupo]
    );

    if (checkAcceso.rows.length === 0) {
      return res.status(403).json({ message: "No tienes acceso a este grupo" });
    }

    const fechaEval = fecha || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO evaluaciones_desarrollo 
       (id_nino, id_grupo, id_docente, fecha,
        comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia,
        obs_comunicativa, obs_cognitiva, obs_socioafectiva, obs_corporal, obs_artistica, obs_autonomia,
        observacion_general)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id_nino, id_grupo, fecha) DO UPDATE SET
        comunicativa = EXCLUDED.comunicativa,
        cognitiva = EXCLUDED.cognitiva,
        socioafectiva = EXCLUDED.socioafectiva,
        corporal = EXCLUDED.corporal,
        artistica = EXCLUDED.artistica,
        autonomia = EXCLUDED.autonomia,
        obs_comunicativa = EXCLUDED.obs_comunicativa,
        obs_cognitiva = EXCLUDED.obs_cognitiva,
        obs_socioafectiva = EXCLUDED.obs_socioafectiva,
        obs_corporal = EXCLUDED.obs_corporal,
        obs_artistica = EXCLUDED.obs_artistica,
        obs_autonomia = EXCLUDED.obs_autonomia,
        observacion_general = EXCLUDED.observacion_general,
        id_docente = EXCLUDED.id_docente
       RETURNING *`,
      [id_nino, id_grupo, idDocente, fechaEval,
       comunicativa, cognitiva, socioafectiva, corporal, artistica, autonomia,
       obs_comunicativa || '', obs_cognitiva || '', obs_socioafectiva || '', obs_corporal || '', obs_artistica || '', obs_autonomia || '',
       observacion_general || '']
    );

    res.json({
      message: "Evaluación guardada exitosamente",
      evaluacion: result.rows[0]
    });
  } catch (error) {
    console.error("Error al evaluar desarrollo:", error);
    res.status(500).json({ message: "Error al guardar evaluación" });
  }
};

// Obtener la evaluación más reciente de un niño específico
exports.getEvaluacionNino = async (req, res) => {
  try {
    const { id_nino } = req.params;
    const { id_grupo } = req.query;

    if (!id_grupo) {
      return res.status(400).json({ message: "ID de grupo es requerido" });
    }

    const result = await pool.query(
      `SELECT ed.*, n.nombres, n.apellidos
       FROM evaluaciones_desarrollo ed
       INNER JOIN ninos n ON ed.id_nino = n.id_nino
       WHERE ed.id_nino = $1 AND ed.id_grupo = $2
       ORDER BY ed.fecha DESC
       LIMIT 1`,
      [id_nino, id_grupo]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener evaluación:", error);
    res.status(500).json({ message: "Error al obtener evaluación" });
  }
};

// Obtener las evaluaciones más recientes de todos los niños de un grupo
exports.getEvaluacionesGrupo = async (req, res) => {
  try {
    const { id_grupo } = req.query;

    if (!id_grupo) {
      return res.status(400).json({ message: "ID de grupo es requerido" });
    }

    const result = await pool.query(
      `SELECT DISTINCT ON (ed.id_nino)
        ed.id_evaluacion, ed.id_nino, ed.fecha,
        ed.comunicativa, ed.cognitiva, ed.socioafectiva, 
        ed.corporal, ed.artistica, ed.autonomia,
        n.nombres, n.apellidos
       FROM evaluaciones_desarrollo ed
       INNER JOIN ninos n ON ed.id_nino = n.id_nino
       WHERE ed.id_grupo = $1
       ORDER BY ed.id_nino, ed.fecha DESC`,
      [id_grupo]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones del grupo:", error);
    res.status(500).json({ message: "Error al obtener evaluaciones" });
  }
};

