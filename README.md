# 🔋 Monitor de Batería FCNET

Dashboard en tiempo real para monitoreo de batería 24V 100Ah con ESP32 e INA219.

## 🚀 Características

- ✅ Monitoreo en tiempo real vía MQTT (HiveMQ Cloud)
- ✅ Dashboard con branding FCNET
- ✅ Batería animada con efecto de líquido burbujeante
- ✅ Alertas de batería baja
- ✅ Bot de Telegram integrado
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Tema oscuro profesional

## 📊 Datos Monitoreados

- **Voltaje**: Lectura directa con divisor de voltaje
- **Corriente**: Sensor INA219 con shunt 50A/75mV
- **Estado de Carga (SOC)**: Cálculo por voltaje
- **Tiempo de carga**: Estimación hasta 100%
- **Autonomía**: Tiempo restante de uso

## 🛠️ Tecnologías

### Frontend
- React 18.3.1
- TypeScript 5.9.3
- Vite 7.2.2
- MQTT.js 5.3.0
- CSS3 con animaciones avanzadas

### Backend (ESP32)
- ESP32 DevKit
- Sensor INA219
- WiFi + MQTT
- Bot de Telegram

### Infraestructura
- HiveMQ Cloud (MQTT Broker)
- Netlify (Hosting)
- GitHub (Control de versiones)

## 📱 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/DASHBOARDFONET.git
cd DASHBOARDFONET/frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🌐 Despliegue en Netlify

### Opción 1: Desde GitHub (Recomendado)

1. Sube el proyecto a GitHub
2. Ve a [Netlify](https://app.netlify.com)
3. Click en "New site from Git"
4. Selecciona tu repositorio
5. Configuración automática (lee `netlify.toml`)
6. ¡Listo! Se despliega automáticamente

### Opción 2: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

## ⚙️ Configuración

### MQTT (HiveMQ)

Edita `frontend/src/config.ts`:

```typescript
export const CONFIG = {
  MQTT: {
    broker: 'wss://TU_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt',
    username: 'TU_USUARIO',
    password: 'TU_PASSWORD',
    topic: 'battery/data',
  }
}
```

### ESP32

Edita las credenciales en el código Arduino:
- WiFi SSID y password
- MQTT broker y credenciales
- Token del bot de Telegram

## 📡 Estructura de Datos MQTT

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
