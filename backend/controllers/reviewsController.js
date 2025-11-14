const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { movie_id: movieId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { score, comment_text } = req.body;
    const userId = req.user.id;

    if (!score || score < 1 || score > 10) {
      return res.status(400).json({
        success: false,
        message: 'La puntuación debe estar entre 1 y 10',
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        user_id_movie_id: {
          user_id: userId,
          movie_id: movieId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para esta película',
      });
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada',
      });
    }

    let review = await prisma.review.create({
      data: {
        user_id: userId,
        movie_id: movieId,
        score,
        comment_text,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });

    const totalReviews = await prisma.review.count({
      where: { user_id: userId },
    });

    let promotedToCritic = false;

    if (totalReviews >= 5 && review.user.role !== 'CRITIC') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'CRITIC' },
        select: {
          id: true,
          username: true,
          role: true,
          avatar_url: true,
        },
      });

      review = {
        ...review,
        user: updatedUser,
      };

      req.user.role = updatedUser.role;
      promotedToCritic = true;
    }

    res.status(201).json({
      success: true,
      message: 'ReseAa creada exitosamente',
      data: review,
      meta: {
        totalReviews,
        promotedToCritic,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { score, comment_text } = req.body;
    const userId = req.user.id;

    if (score && (score < 1 || score > 10)) {
      return res.status(400).json({
        success: false,
        message: 'La puntuación debe estar entre 1 y 10',
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada',
      });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta reseña',
      });
    }

    const updateData = {};
    if (score) updateData.score = score;
    if (comment_text !== undefined) updateData.comment_text = comment_text;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatar_url: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Reseña actualizada exitosamente',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada',
      });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta reseña',
      });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovieReviews,
  createReview,
  updateReview,
  deleteReview,
};

