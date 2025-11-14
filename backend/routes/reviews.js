const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const authMiddleware = require('../middleware/auth');

// PUT /api/v1/reviews/:reviewId - Actualizar una reseña
router.put('/:reviewId', authMiddleware, reviewsController.updateReview);

// DELETE /api/v1/reviews/:reviewId - Eliminar una reseña
router.delete('/:reviewId', authMiddleware, reviewsController.deleteReview);

module.exports = router;

