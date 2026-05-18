const pool = require("../config/db");
const aiService = require("../services/ai.service");

exports.getDashboardAcudiente = async (req, res) => {
  try {
    const idUsuario = req.user.id;

    // 1. Verificar el niño vinculado al acudiente
    const acudienteResult = await pool.query(
      `SELECT u.nombre as acudiente_nombre, u.id_nino, n.nombres as nino_nombres, n.apellidos as nino_apellidos, n.fecha_nacimiento
       FROM usuarios u
       LEFT JOIN ninos n ON u.id_nino = n.id_nino
       WHERE u.id_usuario = $1 AND u.id_rol = 3`,
      [idUsuario]
    );

    if (acudienteResult.rows.length === 0) {
      return res.status(404).json({ message: "No se encontró el perfil de acudiente" });
    }

    const { id_nino, nino_nombres, nino_apellidos, fecha_nacimiento } = acudienteResult.rows[0];

    if (!id_nino) {
      return res.json({ 
        vinculado: false, 
        message: "Aún no tienes un niño vinculado a tu cuenta. Contacta al administrador." 
      });
    }

    // 2. Obtener matrícula activa y grupo
    const matriculaResult = await pool.query(
      `SELECT m.id_matricula, g.id_grupo, g.nombre as grupo_nombre, g.horario
       FROM matriculas m
       INNER JOIN grupos g ON m.id_grupo = g.id_grupo
       WHERE m.id_nino = $1 AND m.estado = TRUE
       LIMIT 1`,
      [id_nino]
    );

    let grupo = null;
    let asistenciaHoy = null;
    let docente = null;
    let estrellas = 0;
    let recursos = [];
    let tareas = [];
    let evaluacion = null;
    let historialNutricion = [];
    let nutricionActual = null;
    let tipNutricional = null;

    if (matriculaResult.rows.length > 0) {
      const mat = matriculaResult.rows[0];
      grupo = {
        id_grupo: mat.id_grupo,
        nombre: mat.grupo_nombre,
        horario: mat.horario
      };

      // 3. Obtener docente del grupo (usando usuario_grupos para soporte multi-grupo)
      const docenteResult = await pool.query(
        `SELECT u.id_usuario, u.nombre, u.correo 
         FROM usuarios u
         INNER JOIN usuario_grupos ug ON u.id_usuario = ug.id_usuario
         WHERE ug.id_grupo = $1 AND u.id_rol = 2 LIMIT 1`,
        [mat.id_grupo]
      );
      if (docenteResult.rows.length > 0) {
        docente = docenteResult.rows[0];
      }

      // 4. Obtener asistencia de hoy
      const asistenciaResult = await pool.query(
        `SELECT estado, observacion FROM asistencia WHERE id_matricula = $1 AND fecha = CURRENT_DATE`,
        [mat.id_matricula]
      );
      if (asistenciaResult.rows.length > 0) {
        asistenciaHoy = asistenciaResult.rows[0];
      }

      // 5. Obtener comportamiento (estrellas)
      const comportamientoResult = await pool.query(
        `SELECT estrellas FROM comportamiento WHERE id_nino = $1 ORDER BY fecha DESC LIMIT 1`,
        [id_nino]
      );
      if (comportamientoResult.rows.length > 0) {
        estrellas = comportamientoResult.rows[0].estrellas;
      }

      // 6. Obtener Recursos (Guías, Videos, Material)
      const recursosResult = await pool.query(
        `SELECT * FROM recursos WHERE id_grupo = $1 ORDER BY fecha_creacion DESC`,
        [mat.id_grupo]
      );
      recursos = recursosResult.rows;

      // 7. Obtener Tareas (Asignaciones)
      const tareasResult = await pool.query(
        `SELECT * FROM tareas WHERE id_grupo = $1 ORDER BY fecha_creacion DESC`,
        [mat.id_grupo]
      );
      tareas = tareasResult.rows;

      // 8. Obtener Última Evaluación de Desarrollo
      const evalResult = await pool.query(
        `SELECT * FROM evaluaciones_desarrollo WHERE id_nino = $1 ORDER BY fecha DESC LIMIT 1`,
        [id_nino]
      );
      evaluacion = evalResult.rows[0] || null;

      // 9. Obtener Historial Nutricional
      const nutricionResult = await pool.query(
        `SELECT * FROM registros_nutricionales WHERE id_nino = $1 ORDER BY fecha ASC`,
        [id_nino]
      );
      historialNutricion = nutricionResult.rows || [];
      nutricionActual = historialNutricion.length > 0 ? historialNutricion[historialNutricion.length - 1] : null;

      // Generar Tip Nutricional con IA si hay datos
      if (nutricionActual) {
        const birthDate = new Date(fecha_nacimiento);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        try {
          tipNutricional = await aiService.generateNutritionTip(
            { nombres: nino_nombres, edad: age },
            nutricionActual
          );
        } catch (err) {
          console.error("Error generating AI nutrition tip:", err);
        }
      }
    }

    res.json({
        vinculado: true,
        nino: {
            id_nino,
            nombres: nino_nombres,
            apellidos: nino_apellidos,
            fecha_nacimiento
        },
        grupo,
        docente,
        asistenciaHoy,
        estrellas,
        recursos,
        tareas: tareas || [],
        evaluacion: evaluacion || null,
        historialNutricion,
        nutricionActual,
        tipNutricional
    });

  } catch (error) {
    console.error("Error Dashboard Acudiente:", error);
    res.status(500).json({ message: "Error al cargar dashboard" });
  }
};

exports.getAISummary = async (req, res) => {
  try {
    const idUsuario = req.user.id;

    // 1. Obtener datos del niño vinculado
    const ninoResult = await pool.query(
      `SELECT n.id_nino, n.nombres, n.apellidos, n.fecha_nacimiento
       FROM usuarios u
       JOIN ninos n ON u.id_nino = n.id_nino
       WHERE u.id_usuario = $1`,
      [idUsuario]
    );

    if (ninoResult.rows.length === 0) {
      return res.status(404).json({ message: "Niño no encontrado" });
    }

    const nino = ninoResult.rows[0];

    // 2. Obtener última evaluación
    const evalResult = await pool.query(
      `SELECT * FROM evaluaciones_desarrollo WHERE id_nino = $1 ORDER BY fecha DESC LIMIT 1`,
      [nino.id_nino]
    );

    if (evalResult.rows.length === 0) {
      return res.status(404).json({ message: "No hay evaluaciones disponibles para generar un resumen." });
    }

    const evaluacion = evalResult.rows[0];

    // Calcular edad simple
    const birthDate = new Date(nino.fecha_nacimiento);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    // 3. Llamar al servicio de IA
    const summary = await aiService.generateChildSummary(
      { nombres: nino.nombres, edad: age },
      evaluacion
    );

    res.json({ summary });
  } catch (error) {
    console.error("Error in getAISummary:", error);
    res.status(500).json({ message: error.message || "Error al generar resumen con IA" });
  }
};
