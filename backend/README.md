# Backend - CineCritica API

Backend REST API para la aplicación de reseñas de películas CineCritica.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hashing de contraseñas
- **TMDB API** - Integración con The Movie Database

## 📋 Prerequisitos

- Node.js >= 18
- PostgreSQL >= 14
- Una API key de TMDB (opcional)

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Copiar el archivo de configuración:
```bash
cp env.example .env
```

3. Configurar variables de entorno en `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/cinecritica?schema=public"
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"
TMDB_API_KEY="tu_tmdb_api_key"
PORT=3000
NODE_ENV=development
```

4. Configurar Prisma:
```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

## 🏃 Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión

### Usuarios (requiere autenticación)
- `GET /api/v1/users/me` - Obtener perfil
- `PUT /api/v1/users/me` - Actualizar perfil
- `GET /api/v1/users/me/reviews` - Obtener mis reseñas

### Películas
- `GET /api/v1/movies` - Listar películas (con filtros)
- `GET /api/v1/movies/trending` - Películas trending
- `GET /api/v1/movies/:id` - Obtener película por ID
- `GET /api/v1/movies/:movieId/reviews` - Reseñas de una película
- `POST /api/v1/movies/:movieId/reviews` - Crear reseña (requiere autenticación)

### Reseñas
- `PUT /api/v1/reviews/:reviewId` - Actualizar reseña (requiere autenticación)
- `DELETE /api/v1/reviews/:reviewId` - Eliminar reseña (requiere autenticación)

## 🗄️ Base de Datos

### Modelos
- **User** - Usuarios del sistema (USER o CRITIC)
- **Movie** - Películas y series
- **Review** - Reseñas de películas

### Migraciones
```bash
# Crear nueva migración
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

## 🚢 Despliegue en Render

1. Crear un servicio PostgreSQL en Render
2. Crear un Web Service apuntando al repositorio
3. Configurar las variables de entorno:
   - `DATABASE_URL` - URL de la base de datos de Render
   - `JWT_SECRET` - Secret para JWT
   - `TMDB_API_KEY` - API key de TMDB
   - `NODE_ENV` - production
4. Comando de build: `npm install && npx prisma generate`
5. Comando de start: `npm start`

