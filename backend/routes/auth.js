const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/register - Registrar nuevo usuario
router.post('/register', authController.register);

// POST /api/v1/auth/login - Iniciar sesión
router.post('/login', authController.login);

module.exports = router;

