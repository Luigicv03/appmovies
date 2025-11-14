const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');
const reviewsController = require('../controllers/reviewsController');
const authMiddleware = require('../middleware/auth');

// GET /api/v1/movies - Obtener todas las películas (con filtros opcionales)
router.get('/', moviesController.getMovies);

// GET /api/v1/movies/trending - Obtener películas trending
router.get('/trending', moviesController.getTrending);

// GET /api/v1/movies/:movieId/reviews - Obtener reseñas de una película
router.get('/:movieId/reviews', reviewsController.getMovieReviews);

// POST /api/v1/movies/:movieId/reviews - Crear una reseña
router.post('/:movieId/reviews', authMiddleware, reviewsController.createReview);

// GET /api/v1/movies/:id - Obtener película por ID (debe ir al final)
router.get('/:id', moviesController.getMovieById);

module.exports = router;

