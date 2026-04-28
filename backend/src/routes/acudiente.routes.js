const express = require("express");
const router = express.Router();
const acudienteController = require("../controllers/acudiente.controller");
const { verifyToken, hasRole } = require("../middlewares/auth.middleware");

router.get("/dashboard", verifyToken, hasRole(3), acudienteController.getDashboardAcudiente);

module.exports = router;
