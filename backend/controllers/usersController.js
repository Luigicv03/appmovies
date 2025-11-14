const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar_url, current_password, new_password } = req.body;

    if (
      (username === undefined || username === null) &&
      avatar_url === undefined &&
      !new_password
    ) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar',
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const updateData = {};

    if (username !== undefined && username !== null) {
      const sanitizedUsername = username.trim();

      if (!sanitizedUsername) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario no puede estar vacío',
        });
      }

      if (sanitizedUsername !== currentUser.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: sanitizedUsername,
            NOT: { id: req.user.id },
          },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'El nombre de usuario ya está en uso',
          });
        }
      }

      updateData.username = sanitizedUsername;
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar la contraseña actual para actualizarla',
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres',
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        currentUser.password_hash
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta',
        });
      }

      updateData.password_hash = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se detectaron cambios para actualizar',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    if (new_password) {
      const passwordUpdated = await bcrypt.compare(new_password, user.password_hash);

      if (!passwordUpdated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar la contraseña. Inténtalo nuevamente.',
        });
      }
    }

    const { password_hash, ...sanitizedUser } = user;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { user_id: req.user.id },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster_url: true,
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

module.exports = { getProfile, updateProfile, getMyReviews };

