const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const { verifyToken, hasRole } = require("../middlewares/auth.middleware");
const {
  getDashboardDocente,
  importarEstudiantes,
  getEstudiantesAsistencia,
  registrarAsistencia,
  crearReporte,
  getReportesAdmin,
  actualizarReporte,
  agregarEstudianteManual,
  eliminarEstudianteManual,
  getEstudiantesLista,
  actualizarEstudianteManual,
  registrarComportamiento
} = require("../controllers/docente.controller");

// Rutas para docentes (rol 2)
router.get("/dashboard", verifyToken, hasRole(2), getDashboardDocente);
router.post("/importar", verifyToken, hasRole(2), upload.single("archivo"), importarEstudiantes);
router.get("/estudiantes", verifyToken, hasRole(2), getEstudiantesAsistencia);
router.get("/estudiantes/lista", verifyToken, hasRole(2), getEstudiantesLista);
router.post("/estudiantes/manual", verifyToken, hasRole(2), agregarEstudianteManual);
router.put("/estudiantes/:id_nino", verifyToken, hasRole(2), actualizarEstudianteManual);
router.delete("/estudiantes/:id_matricula", verifyToken, hasRole(2), eliminarEstudianteManual);
router.post("/asistencia", verifyToken, hasRole(2), registrarAsistencia);
router.post("/reportes", verifyToken, hasRole(2), crearReporte);
router.post("/comportamiento", verifyToken, hasRole(2), registrarComportamiento);

// Rutas para admin (rol 1)
router.get("/reportes/admin", verifyToken, hasRole(1), getReportesAdmin);
router.put("/reportes/:id", verifyToken, hasRole(1), actualizarReporte);

module.exports = router;

