const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API CDI funcionando 🚀" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

const pool = require("./config/db");

pool.connect()
  .then(() => console.log("Conectado a PostgreSQL 🐘"))
  .catch(err => console.error("Error de conexión", err));

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const testRoutes = require("./routes/test.routes");
app.use("/api/test", testRoutes);

const ninoRoutes = require("./routes/nino.routes");
app.use("/api/ninos", ninoRoutes);

const grupoRoutes = require("./routes/grupo.routes");
app.use("/api/grupos", grupoRoutes);

const periodoRoutes = require("./routes/periodo.routes");
app.use("/api/periodos", periodoRoutes);

const matriculaRoutes = require("./routes/matricula.routes");
app.use("/api/matriculas", matriculaRoutes);

const asistenciaRoutes = require("./routes/asistencia.routes");
app.use("/api/asistencias", asistenciaRoutes);

const desarrolloRoutes = require("./routes/desarrollo.routes");
app.use("/api/desarrollos", desarrolloRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

const docenteRoutes = require("./routes/docente.routes");
app.use("/api/docente", docenteRoutes);

const acudienteRoutes = require("./routes/acudiente.routes");
app.use("/api/acudiente", acudienteRoutes);
