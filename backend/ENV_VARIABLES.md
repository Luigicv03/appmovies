# Variables de Entorno Requeridas

Copia estas variables en el panel de Render o en tu archivo `.env` local:

```env
# Database (Render proporciona esto automáticamente si conectas la DB)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT (OBLIGATORIO - genera uno seguro para producción)
JWT_SECRET="tu-clave-secreta-super-segura-cambiar-en-produccion"

# API Keys (al menos una es recomendada para obtener películas)
OMDB_API_KEY="tu-omdb-api-key"
TMDB_API_KEY="tu-tmdb-api-key"

# Server
PORT=3000  # Render lo asigna automáticamente
NODE_ENV=production

# Frontend URL (opcional, para CORS)
FRONTEND_URL="https://tu-app.expo.dev"
```

## Variables Obligatorias:
- `DATABASE_URL` - Render la proporciona automáticamente si conectas la base de datos
- `JWT_SECRET` - Debes generarlo tú (usa un string largo y aleatorio)

## Variables Opcionales pero Recomendadas:
- `OMDB_API_KEY` o `TMDB_API_KEY` - Para obtener películas de APIs externas
- `FRONTEND_URL` - Para configurar CORS correctamente

