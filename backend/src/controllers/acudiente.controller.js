const pool = require("../config/db");

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

    if (matriculaResult.rows.length > 0) {
      const mat = matriculaResult.rows[0];
      grupo = {
        id_grupo: mat.id_grupo,
        nombre: mat.grupo_nombre,
        horario: mat.horario
      };

      // 3. Obtener docente del grupo
      const docenteResult = await pool.query(
        `SELECT id_usuario, nombre, correo FROM usuarios WHERE id_grupo = $1 AND id_rol = 2 LIMIT 1`,
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
        estrellas
    });

  } catch (error) {
    console.error("Error Dashboard Acudiente:", error);
    res.status(500).json({ message: "Error al cargar dashboard" });
  }
};
