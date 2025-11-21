# DEPLOY FRONTEND - NETLIFY

Dashboard Angular para el monitor de batería FCNET.

## 📦 Requisitos

- Cuenta en [Netlify](https://netlify.com) (gratuita)
- Repositorio en GitHub

## 🚀 Despliegue

### Opción 1: Deploy desde GitHub (Recomendado)

1. **Sube el código a GitHub**

```bash
cd frontend
git init
git add .
git commit -m "Frontend dashboard FCNET"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/battery-monitor-frontend.git
git push -u origin main
```

2. **Conecta con Netlify**

- Ve a [app.netlify.com](https://app.netlify.com)
- Click en "Add new site" → "Import an existing project"
- Selecciona "GitHub" y autoriza
- Selecciona tu repositorio `battery-monitor-frontend`

3. **Configuración de build**

```yaml
Build command: npm run build
Publish directory: dist/battery-monitor-fcnet/browser
```

4. **Variables de entorno** (Opcional)

Si quieres cambiar la URL del backend:
- Settings → Environment variables
- Add: `BACKEND_URL` = `https://tu-backend.fly.dev/api`

5. **Deploy**

Click en "Deploy site" - ¡Listo! 🎉

### Opción 2: Deploy manual con CLI

1. **Instalar Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **Login**

```bash
netlify login
```

3. **Build local**

```bash
cd frontend
npm install
npm run build
```

4. **Deploy**

```bash
netlify deploy --prod
```

Selecciona:
- Publish directory: `dist/battery-monitor-fcnet/browser`

## 📝 Actualizar URL del backend

Una vez que tengas tu backend desplegado en Fly.io:

1. Edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  backendUrl: 'https://fcnet-battery-backend.fly.dev/api'
};
```

2. Haz commit y push:

```bash
git add src/environments/environment.prod.ts
git commit -m "Update backend URL"
git push
```

Netlify automáticamente reconstruirá y desplegará.

## 🌐 Dominio personalizado

1. Ve a Netlify Dashboard → Domain settings
2. Click "Add custom domain"
3. Ingresa tu dominio (ej: `battery.tudominio.com`)
4. Sigue las instrucciones para configurar DNS

Netlify proporciona SSL automático con Let's Encrypt ✅

## 🔄 Auto-deploy

Con la integración de GitHub, cada push a `main` despliega automáticamente:

```bash
git add .
git commit -m "Update dashboard"
git push
```

## 📊 Configuración

El archivo `netlify.toml` ya está configurado:

```toml
[build]
  publish = "dist/battery-monitor-fcnet/browser"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🐛 Troubleshooting

### Error: "Page not found" al recargar

✅ Ya configurado en `netlify.toml` - todos los paths redirigen a `index.html`

### Error de CORS

Asegúrate que el backend tenga CORS habilitado:

```javascript
// backend/src/servidor.js
app.use(cors());
```

### Dashboard no conecta a MQTT

1. Verifica que el backend esté desplegado
2. Verifica la URL en `environment.prod.ts`
3. Abre DevTools → Network para ver errores

## 💰 Costos

El plan gratuito de Netlify incluye:
- 100 GB de ancho de banda/mes
- 300 minutos de build/mes
- Deploy ilimitados
- SSL automático
- Dominio personalizado

✅ **Completamente dentro del tier gratuito**

## 📱 Vista previa

Netlify crea URLs de preview para cada Pull Request:

1. Crea una rama: `git checkout -b nueva-feature`
2. Haz cambios y push
3. Crea Pull Request en GitHub
4. Netlify genera preview automático

## 🔒 Seguridad

- ✅ HTTPS automático (Let's Encrypt)
- ✅ Headers de seguridad configurados
- ✅ Deploy atómicos (rollback fácil)
- ✅ No hay secretos en el frontend (solo URL pública del backend)

## 📝 Comandos útiles

```bash
# Build local
npm run build

# Preview local del build de producción
npx http-server dist/battery-monitor-fcnet/browser

# Ver logs de Netlify
netlify logs

# Rollback al deploy anterior
netlify rollback
```
