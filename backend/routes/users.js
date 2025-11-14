const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/v1/users/me - Obtener perfil del usuario autenticado
router.get('/me', usersController.getProfile);

// PUT /api/v1/users/me - Actualizar perfil del usuario autenticado
router.put('/me', usersController.updateProfile);

// GET /api/v1/users/me/reviews - Obtener reseñas del usuario autenticado
router.get('/me/reviews', usersController.getMyReviews);

module.exports = router;

