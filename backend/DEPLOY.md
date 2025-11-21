# DEPLOY BACKEND - FLY.IO

Backend Node.js para el monitor de batería FCNET.

## 📦 Requisitos

- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Cuenta en Fly.io (gratuita)

## 🚀 Despliegue

### 1. Instalar Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Autenticarse

```bash
fly auth signup  # Primera vez
# o
fly auth login   # Si ya tienes cuenta
```

### 3. Crear la aplicación

```bash
cd backend
fly launch --no-deploy
```

Configuración recomendada:
- **Nombre**: `fcnet-battery-backend` (o el que prefieras)
- **Región**: `mad` (Madrid) o la más cercana
- **Crear Postgres**: No
- **Deploy ahora**: No

### 4. Configurar secretos

```bash
fly secrets set \
  MQTT_HOST=cdd0f3d0066146a385e294acd95f7868.s1.eu.hivemq.cloud \
  MQTT_PORT=8883 \
  MQTT_USERNAME=admin \
  MQTT_PASSWORD=Admin123 \
  MQTT_TOPIC=fcnet/battery/data \
  TELEGRAM_BOT_TOKEN=8159152554:AAGntjC6glwD_YbACC0H7w0vkZ7ao4xO360 \
  DASHBOARD_URL=https://tu-dashboard.netlify.app
```

**Importante:** Reemplaza `DASHBOARD_URL` con la URL real de Netlify después de desplegar el frontend.

### 5. Desplegar

```bash
fly deploy
```

### 6. Verificar

```bash
fly status
fly logs
```

Abre en el navegador:
```bash
fly open
```

## 📡 Endpoints

Una vez desplegado, tu backend estará en: `https://fcnet-battery-backend.fly.dev`

- `GET /` - Info del backend
- `GET /api/estado` - Último estado de batería
- `GET /api/salud` - Health check detallado
- `GET /api/healthz` - Health check simple (Docker)

## 🔄 Actualizar

Cada vez que hagas cambios:

```bash
fly deploy
```

## 📊 Monitoreo

```bash
# Ver logs en tiempo real
fly logs

# Ver estado de la app
fly status

# Ver métricas
fly dashboard
```

## 🐛 Debugging

```bash
# SSH a la máquina virtual
fly ssh console

# Reiniciar app
fly apps restart

# Escalar (cambiar recursos)
fly scale vm shared-cpu-1x --memory 512
```

## ⚙️ Variables de entorno

Actualizar un secret:

```bash
fly secrets set TELEGRAM_BOT_TOKEN=nuevo-token
```

Ver secretos configurados:

```bash
fly secrets list
```

## 🔒 Seguridad

- ✅ Todos los secretos se manejan con `fly secrets` (no en código)
- ✅ `.env` está en `.gitignore`
- ✅ HTTPS automático
- ✅ Health checks configurados

## 💰 Costos

El plan gratuito de Fly.io incluye:
- 3 máquinas virtuales shared-cpu-1x
- 256 MB RAM por VM (ajustable hasta 512 MB gratis)
- 3 GB de almacenamiento persistente
- 160 GB de transferencia saliente

**Tu backend usa:**
- 1 VM con 256 MB RAM
- Auto-start/stop desactivado (siempre encendido para MQTT)
- ~1-2 GB de transferencia/mes

✅ **Completamente dentro del tier gratuito**

## 📝 Notas

- El backend se mantiene siempre encendido (`auto_stop_machines = false`)
- Reconexión automática MQTT cada 5 minutos
- Health checks cada 30 segundos
- CORS habilitado para dashboard
