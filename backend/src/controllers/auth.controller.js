const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ==========================================
// REGISTER NORMAL
// ==========================================
exports.register = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        message: "Correo inválido"
      });
    }

    // 🔐 Validación de Contraseña Segura (Mínimo 8 caracteres, 1 Mayúscula, 1 Minúscula, 1 Número y 1 Carácter Especial)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])[A-Za-z\d@$!%*?&._\-]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial (ej: @$!%*?&._-)"
      });
    }

    const userExists = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "El usuario ya existe"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 Rol fijo para registro público (ejemplo: 3 = Acudiente)
    const id_rol = 3;

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, id_rol)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre, correo, id_rol`,
      [nombre, correo, hashedPassword, id_rol]
    );

    const user = result.rows[0];

    // Generar token automáticamente después del registro
    const token = jwt.sign(
      {
        id: user.id_usuario,
        rol: user.id_rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Usuario registrado correctamente 🚀",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// ==========================================
// LOGIN NORMAL
// ==========================================
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        message: "Correo y password son obligatorios"
      });
    }

    const result = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Usuario no encontrado"
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Contraseña incorrecta"
      });
    }

    delete user.password;

    const token = jwt.sign(
      {
        id: user.id_usuario,
        rol: user.id_rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login exitoso 🔐",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// ==========================================
// LOGIN CON GOOGLE
// ==========================================
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre = payload.name;

    const user = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [email]
    );

    // Usuario ya existe
    if (user.rows.length > 0) {

      const token = jwt.sign(
        {
          id: user.rows[0].id_usuario,
          rol: user.rows[0].id_rol
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        token,
        user: {
          id_usuario: user.rows[0].id_usuario,
          nombre: user.rows[0].nombre,
          correo: user.rows[0].correo,
          id_rol: user.rows[0].id_rol
        }
      });
    }

    // Usuario nuevo → necesita completar registro
    return res.json({
      nuevo: true,
      correo: email,
      nombre
    });

  } catch (error) {
    console.error("DEBUG googleLogin Error:", error);
    res.status(401).json({
      message: "Error en autenticación con Google",
      error: error.message
    });
  }
};


// ==========================================
// COMPLETAR REGISTRO GOOGLE
// ==========================================
exports.completeGoogleRegister = async (req, res) => {
  try {
    const { nombre, correo } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({
        message: "Datos incompletos"
      });
    }

    // Rol fijo (ejemplo: 3 = Acudiente)
    const id_rol = 3;

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, id_rol)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre, correo, id_rol`,
      [nombre, correo, null, id_rol] // password null para Google
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id_usuario,
        rol: user.id_rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};