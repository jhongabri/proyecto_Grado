const pool = require("../config/db");

exports.registrarNutricion = async (req, res) => {
  try {
    const { id_nino, peso, talla, observaciones } = req.body;

    if (!id_nino || !peso || !talla) {
      return res.status(400).json({ message: "El niño, peso y talla son obligatorios." });
    }

    // Calcular IMC
    const tallaMetros = parseFloat(talla) / 100;
    const pesoNum = parseFloat(peso);
    const imc = parseFloat((pesoNum / (tallaMetros * tallaMetros)).toFixed(2));

    // Lógica simplificada de estado nutricional para MVP (Basada en umbrales generales de IMC infantil)
    let estado = "Normal";
    if (imc < 14) {
      estado = "Bajo peso";
    } else if (imc > 18 && imc <= 19) {
      estado = "Riesgo de Sobrepeso";
    } else if (imc > 19) {
      estado = "Sobrepeso";
    }

    const newRecord = await pool.query(
      `INSERT INTO registros_nutricionales (id_nino, peso, talla, imc, estado_nutricional, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_nino, pesoNum, parseFloat(talla), imc, estado, observaciones]
    );

    res.status(201).json({
      message: "Registro nutricional guardado exitosamente.",
      registro: newRecord.rows[0]
    });
  } catch (error) {
    console.error("Error al registrar nutrición:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getHistorialNutricion = async (req, res) => {
  try {
    const { id_nino } = req.params;

    const historial = await pool.query(
      `SELECT * FROM registros_nutricionales 
       WHERE id_nino = $1 
       ORDER BY fecha ASC`,
      [id_nino]
    );

    res.json(historial.rows);
  } catch (error) {
    console.error("Error al obtener el historial nutricional:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
