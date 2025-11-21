# DEPLOY FRONTEND - NETLIFY

Dashboard Angular para el monitor de batería FCNET.

✅ **Desplegado en**: https://dashboardfonetbaterias.netlify.app

## 🚀 Despliegue automático

El frontend está configurado con auto-deploy desde GitHub:

```
Repositorio: https://github.com/imers229/bateria-monitor-fcnet
Base directory: frontend
Build command: npm run build
Publish directory: dist/battery-monitor-fcnet/browser
```

Cada push a `main` despliega automáticamente.

## 📝 Actualizar URL del backend

Cuando despliegues el backend en Railway:

1. Edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  backendUrl: 'https://tu-backend.up.railway.app/api'
};
```

2. Haz commit y push:

```bash
git add frontend/src/environments/environment.prod.ts
git commit -m "Update backend URL"
git push
```

Netlify reconstruirá automáticamente.

## 📊 Configuración

El archivo `netlify.toml` incluye:

```toml
[build]
  base = "frontend"
  publish = "dist/battery-monitor-fcnet/browser"
  command = "npm install && npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 💰 Plan gratuito

- 100 GB de ancho de banda/mes
- 300 minutos de build/mes
- Deploy ilimitados
- SSL automático
- Dominio personalizado
