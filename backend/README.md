# BACKEND - Monitor de Batería FCNET

Backend Node.js para el sistema de monitoreo de batería 24V 100Ah.

## 🎯 Funcionalidad

Este backend centraliza toda la lógica de negocio:

- **Servicio MQTT**: Escucha HiveMQ Cloud 24/7, almacena último estado
- **Bot de Telegram**: Comandos, alertas automáticas, gestión de suscriptores
- **API REST**: Proporciona datos al dashboard Angular

## 📁 Estructura

```
backend/
├── src/
│   ├── servidor.js              # Punto de entrada principal
│   ├── configuracion.js         # Variables de configuración
│   ├── api/
│   │   └── controlador.js       # Rutas y endpoints del API
│   └── servicios/
│       ├── mqtt.servicio.js     # Conexión MQTT permanente
│       └── telegram.servicio.js # Bot de Telegram
├── package.json
├── .env                         # Variables de entorno (no subir a git)
└── .env.example                 # Plantilla de variables
```

## 🚀 Instalación

```bash
cd backend
npm install
```

## ⚙️ Configuración

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` con tus credenciales:
   ```env
   PORT=3000
   MQTT_HOST=tu-cluster.hivemq.cloud
   MQTT_USERNAME=admin
   MQTT_PASSWORD=tu-password
   TELEGRAM_BOT_TOKEN=tu-token
   ```

## 🏃 Ejecutar

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor estará en `http://localhost:3000`

## 📡 API Endpoints

### `GET /`
Información del backend y estado de servicios
```json
{
  "nombre": "FCNET Battery Monitor Backend",
  "version": "1.0.0",
  "servicios": {
    "mqtt": "Conectado",
    "api": "Activo"
  }
}
```

### `GET /api/estado`
Último estado de batería
```json
{
  "voltage": 24.5,
  "current": -2.3,
  "soc": 75.2,
  "time_to_full": 3.5,
  "time_to_empty": 0,
  "timestamp": "2025-11-20T10:30:00.000Z",
  "estado": "Cargando",
  "mqtt_conectado": true,
  "mensajes_recibidos": 1250
}
```

### `GET /api/salud`
Health check
```json
{
  "estado": "ok",
  "mqtt": true,
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

## 🤖 Bot de Telegram

El bot maneja estos comandos:

- `/start` - Menú principal y suscripción a alertas
- `/dashboard` - Link al dashboard web
- `/estado` - Estado actual de batería
- `/alertas` - Activar notificaciones
- `/silencio` - Desactivar notificaciones
- `/info` - Información del sistema

### Alertas automáticas

El bot envía alertas automáticas cuando:
- SOC < 20% (batería baja)
- Solo a usuarios suscritos
- Una vez por evento (no spam)

## 🔌 Arquitectura

```
ESP32 (simulación)
    ↓ publica datos
HiveMQ Cloud (MQTT)
    ↓ escucha 24/7
Backend Node.js
    ├→ Almacena último estado
    ├→ Bot Telegram (alertas)
    └→ API REST
         ↓
Dashboard Angular
    - Consulta /api/estado primero
    - Luego se conecta a MQTT
    - Se desconecta al cerrar
```

## 💾 Optimización de datos

El backend optimiza el consumo de los 10GB/mes de HiveMQ:

1. **Backend escucha 24/7**: Una única conexión permanente
2. **Dashboard consulta API**: Obtiene último estado sin MQTT
3. **MQTT solo cuando es necesario**: Dashboard se conecta solo al abrirse
4. **Publicación inteligente**: ESP32 solo publica cambios significativos

## 📊 Monitoreo

El backend muestra en consola:

```
╔════════════════════════════════════════╗
║  FCNET BATTERY MONITOR - BACKEND      ║
╚════════════════════════════════════════╝

🔌 Conectando a HiveMQ Cloud...
   Host: xxx.hivemq.cloud:8883
   Usuario: admin
   Topic: fcnet/battery/data

✅ MQTT conectado a HiveMQ Cloud
📡 Suscrito a: fcnet/battery/data

🤖 Iniciando bot de Telegram...
✅ Bot de Telegram activo
   Usuario: @mi_battery_monitor_bot

🚀 Servidor Express iniciado
   Puerto: 3000
   API: http://localhost:3000/api

✅ Backend completamente operativo

📥 [1] V=24.50V I=2.50A SOC=75.2%
📥 [2] V=24.55V I=2.48A SOC=75.5%
```

## 🛠️ Desarrollo

### Estructura de servicios

- **mqtt.servicio.js**: EventEmitter que emite 'nuevosDatos'
- **telegram.servicio.js**: Escucha eventos de MQTT para alertas
- **controlador.js**: Express Router con endpoints

### Añadir nuevos endpoints

Editar `src/api/controlador.js`:

```javascript
router.get('/nuevo-endpoint', (req, res) => {
  // Tu lógica aquí
  res.json({ dato: 'valor' });
});
```

## 🐛 Troubleshooting

### Error: MQTT no conecta
- Verificar credenciales en `.env`
- Comprobar que HiveMQ Cloud esté activo
- Revisar firewall/proxy

### Error: Bot de Telegram no responde
- Verificar `TELEGRAM_BOT_TOKEN` en `.env`
- Asegurar que el bot esté activo en @BotFather
- Revisar logs en consola

### Error: EADDRINUSE (puerto en uso)
```bash
# Cambiar puerto en .env
PORT=3001
```

## 📝 Licencia

MIT
