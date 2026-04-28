const express = require("express");
const router = express.Router();

const { 
  getAdminStats, 
  createDocente, 
  getAllDocentes, 
  getAllGrupos,
  asignarGrupoDocente,
  getEstudiantesPorGrupo,
  importarEstudiantesAdmin,
  agregarEstudianteGrupo,
  eliminarEstudianteGrupo,
  actualizarEstudianteGrupo,
  vincularAcudienteNino,
  getAllAcudientes
} = require("../controllers/admin.controller");

// 👇 Importación correcta
const { verifyToken, hasRole } = require("../middlewares/auth.middleware");

// Solo admin puede ver stats
router.get("/stats", verifyToken, hasRole(1), getAdminStats);

// Solo admin puede crear docentes
router.post("/docentes", verifyToken, hasRole(1), createDocente);

// Obtener todos los docentes
router.get("/docentes", verifyToken, hasRole(1), getAllDocentes);

// Obtener acudientes
router.get("/acudientes", verifyToken, hasRole(1), getAllAcudientes);
router.put("/acudientes/vincular", verifyToken, hasRole(1), vincularAcudienteNino);

// Obtener todos los grupos
router.get("/grupos", verifyToken, hasRole(1), getAllGrupos);

// Ver estudiantes de grupo
router.get("/grupos/:id/estudiantes", verifyToken, hasRole(1), getEstudiantesPorGrupo);

// Agregar estudiante manualmente a un grupo
router.post("/grupos/:id_grupo/estudiantes", verifyToken, hasRole(1), agregarEstudianteGrupo);

// Eliminar estudiante de un grupo (borra matrícula)
router.delete("/grupos/estudiantes/:id_matricula", verifyToken, hasRole(1), eliminarEstudianteGrupo);

// Actualizar estudiante
router.put("/grupos/estudiantes/:id_nino", verifyToken, hasRole(1), actualizarEstudianteGrupo);

// Importar Excel a grupo
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
router.post("/grupos/importar", verifyToken, hasRole(1), upload.single("excel"), importarEstudiantesAdmin);

// Asignar grupo a docente
router.put("/docentes/asignar-grupo", verifyToken, hasRole(1), asignarGrupoDocente);

module.exports = router;
