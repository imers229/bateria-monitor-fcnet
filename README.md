# 🔋 Monitor de Batería FCNET

Sistema completo de monitoreo de batería 24V 100Ah con ESP32, MQTT, Telegram y dashboard en tiempo real.

## 🏗️ Arquitectura

```
ESP32 (simulación) → HiveMQ Cloud → Backend Node.js (Fly.io) → Dashboard Angular (Netlify)
                                         ↓
                                    Bot Telegram
```

## 🚀 Características

- ✅ Monitoreo en tiempo real vía MQTT (HiveMQ Cloud)
- ✅ Dashboard Angular 19 con branding FCNET
- ✅ Backend Node.js con API REST
- ✅ Bot de Telegram con alertas automáticas
- ✅ Modo simulación ESP32 (sin hardware)
- ✅ Deploy gratuito (Fly.io + Netlify)
- ✅ Batería animada con efecto de líquido burbujeante
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Tema oscuro profesional

## 📊 Datos Monitoreados

- **Voltaje**: 20.8V - 26.5V (simulado)
- **Corriente**: -3A (carga) a +3A (descarga)
- **Estado de Carga (SOC)**: Cálculo por voltaje (0-100%)
- **Tiempo de carga**: Estimación hasta 100%
- **Autonomía**: Tiempo restante de uso

## 🛠️ Tecnologías

### Frontend
- Angular 19.0.5
- TypeScript 5.9.3
- MQTT.js 5.14.1
- RxJS 7.8.1
- CSS3 con animaciones avanzadas

### Backend (ESP32)
- ESP32 DevKit
- Sensor INA219
- WiFi + MQTT
- Bot de Telegram

### Infraestructura
- HiveMQ Cloud (MQTT Broker privado)
- GitHub (Control de versiones)

## 📱 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/imers229/bateria-monitor-fcnet.git
cd DASHBOARDFONET/frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo (puerto 4200)
npm start

# Construir para producción
npm run build
```

## 🌐 Despliegue

El proyecto está listo para ser desplegado en cualquier servidor web. Los archivos compilados estarán en `frontend/dist/battery-monitor-fcnet/browser/`.

Puedes usar cualquier hosting de tu elección (Apache, Nginx, Vercel, etc.).

## ⚙️ Configuración

### MQTT (HiveMQ Cloud)

Edita `frontend/src/services/config.service.ts`:

```typescript
readonly MQTT: MqttConfig = {
  broker: 'wss://TU_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt',
  username: 'TU_USUARIO',
  password: 'TU_PASSWORD',
  topic: 'fcnet/battery/data',
  // ...opciones
}
```

**Configuración actual:** El proyecto está configurado con un clúster privado de HiveMQ Cloud en AWS (región EU).

### ESP32

Edita las credenciales en el código Arduino:
- WiFi SSID y password
- MQTT broker y credenciales
- Token del bot de Telegram

## 📡 Estructura de Datos MQTT

**Topic:** `fcnet/battery/data`

```json
{
  "voltage": 25.2,
  "current": 2.5,
  "soc": 85.0,
  "time_to_full": 1.5,
  "time_to_empty": 8.0
}
```

## 🤖 Bot de Telegram

Comandos disponibles:
- `/start` - Iniciar bot
- `/dashboard` - Obtener link del dashboard
- `/estado` - Estado actual de la batería
- `/alertas` - Activar alertas
- `/silencio` - Desactivar alertas
- `/info` - Información del sistema

## 📊 Optimización de Datos

El sistema está optimizado para el plan gratuito de HiveMQ (10GB/mes):

- Publicación cada 5 segundos
- Solo envía datos con cambios significativos
- Consumo estimado: 20-35 MB/mes (0.2-0.35% del límite)
- Soporta hasta 20 usuarios simultáneos

## 📝 Documentación Adicional

- `README.md` - Este archivo
- `INICIO_RAPIDO.md` - Guía de inicio rápido (15-20 min)
- `OPTIMIZACIONES_HIVEMQ.md` - Análisis de consumo de datos

## 🎨 Branding FCNET

Colores corporativos:
- Rojo: #E30613
- Negro: #1A1A1A
- Dorado: #FFD700
- Verde: #00E5A0

## 📄 Licencia

Este proyecto es de uso interno de FCNET.

## 👤 Autor

Desarrollado para FCNET - Internet por Fibra Óptica

---

**Powered by ESP32 + HiveMQ Cloud • Monitoreo 24/7**
