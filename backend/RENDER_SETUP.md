# Guía de Despliegue en Render

## Pasos para desplegar el backend en Render

### 1. Crear Base de Datos PostgreSQL

1. En el dashboard de Render, ve a **"New +"** → **"PostgreSQL"**
2. Configura:
   - **Name**: `cinecritica-db`
   - **Database**: `cinecritica`
   - **User**: `cinecritica_user`
   - **Plan**: Free (o el que prefieras)
3. Guarda la **Internal Database URL** que Render te proporciona

### 2. Crear Web Service (Backend)

1. En el dashboard de Render, ve a **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub: `Luigicv03/appdepeliculas`
3. Configura:
   - **Name**: `cinecritica-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (o el que prefieras)

### 3. Configurar Variables de Entorno

En la sección **"Environment"** del Web Service, agrega:

```
DATABASE_URL=<Internal Database URL de tu PostgreSQL>
JWT_SECRET=<genera-un-secreto-largo-y-aleatorio>
NODE_ENV=production
OMDB_API_KEY=<tu-api-key-si-tienes>
TMDB_API_KEY=<tu-api-key-si-tienes>
FRONTEND_URL=<url-de-tu-app-movil-si-la-tienes>
```

**Nota**: Render automáticamente conecta la base de datos si usas el mismo nombre en `render.yaml`, pero puedes hacerlo manualmente también.

### 4. Desplegar

1. Render automáticamente ejecutará:
   - `npm install` - Instala dependencias
   - `npm run build` - Genera Prisma Client y ejecuta migraciones
   - `npm start` - Inicia el servidor

2. Una vez desplegado, tu API estará disponible en:
   `https://cinecritica-backend.onrender.com`

### 5. Verificar Despliegue

1. Prueba el endpoint de health:
   ```
   GET https://cinecritica-backend.onrender.com/health
   ```

2. Deberías recibir:
   ```json
   {
     "status": "ok",
     "message": "Server is running"
   }
   ```

### 6. Actualizar Frontend

En `movie-app/src/constants/config.js`, cambia:
```javascript
BASE_URL: 'https://cinecritica-backend.onrender.com/api/v1'
```

## Troubleshooting

### Error: "Prisma Client not generated"
- Verifica que el script `postinstall` esté en `package.json`
- Revisa los logs de build en Render

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de usar la **Internal Database URL** (no la externa)
- Verifica que la base de datos esté en el mismo plan/región

### Error: "Migration failed"
- Verifica que las migraciones estén en `prisma/migrations/`
- Revisa los logs de build para ver el error específico

