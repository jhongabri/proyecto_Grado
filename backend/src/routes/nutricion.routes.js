const express = require("express");
const router = express.Router();
const { verifyToken, hasRole } = require("../middlewares/auth.middleware");
const { registrarNutricion, getHistorialNutricion } = require("../controllers/nutricion.controller");

// Rutas para Nutrición
// Registro: Permite a Admin (1) y Docente (2)
router.post("/", verifyToken, hasRole(1, 2), registrarNutricion);

// Historial: Permite a Admin (1), Docente (2) y Acudiente (3)
router.get("/:id_nino", verifyToken, hasRole(1, 2, 3), getHistorialNutricion);

module.exports = router;
