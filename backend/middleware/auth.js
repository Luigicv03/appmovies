const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    // Verificar que el formato sea "Bearer token"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Agregar el usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en auth middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

module.exports = authMiddleware;

