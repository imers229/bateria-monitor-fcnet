/**
 * CONFIGURACIÓN DEL BACKEND
 * ========================
 * Centraliza todas las variables de configuración del sistema
 * Carga valores desde variables de entorno (.env)
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Servidor Express
  servidor: {
    puerto: process.env.PORT || 3000,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4200'
  },

  // Conexión MQTT (HiveMQ Cloud)
  mqtt: {
    host: process.env.MQTT_HOST || 'cdd0f3d0066146a385e294acd95f7868.s1.eu.hivemq.cloud',
    port: parseInt(process.env.MQTT_PORT) || 8883,
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || 'Admin123',
    topic: process.env.MQTT_TOPIC || 'fcnet/battery/data',
    
    // Opciones de conexión
    opciones: {
      protocol: 'mqtts',
      clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      rejectUnauthorized: false // HiveMQ Cloud con certificado autofirmado
    }
  },

  // Bot de Telegram
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    maxSuscriptores: 10,
    
    // Umbrales para alertas
    alertas: {
      bateriaBaja: 20, // SOC% mínimo antes de alertar
      bateriaCritica: 10, // SOC% crítico
      recuperacion: 25 // SOC% para resetear alerta
    }
  },

  // Configuración de batería (misma que ESP32 y dashboard)
  bateria: {
    capacidad_ah: 100,
    voltajeMax: 26.5,
    voltajeMin: 20.8,
    
    // Umbrales de detección de cambios para optimizar MQTT
    cambioMinimo: {
      voltaje: 0.1, // V
      corriente: 0.2, // A
      soc: 0.5 // %
    }
  }
};
