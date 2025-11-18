// ============================================================================
// ARCHIVO DE CONFIGURACIÓN DEL DASHBOARD DE BATERÍA
// ============================================================================
// Este archivo centraliza todas las configuraciones del sistema:
// - Credenciales de HiveMQ Cloud
// - Topics MQTT
// - Umbrales de batería
// - Intervalos de actualización
//
// IMPORTANTE: Este archivo contiene credenciales sensibles.
// En producción, usar variables de entorno (.env)
// ============================================================================

// Configuración de conexión MQTT a HiveMQ Cloud
export const CONFIG = {
  // ===== CONFIGURACIÓN MQTT =====
  MQTT: {
    // URL del broker HiveMQ Cloud con WebSocket seguro (wss://)
    // Formato: wss://<cluster-id>.s1.eu.hivemq.cloud:8884/mqtt
    broker: 'wss://9b393250bf3b476193e50e4fc543905f.s1.eu.hivemq.cloud:8884/mqtt',
    
    // Credenciales de autenticación HiveMQ
    // Usuario creado en el panel de HiveMQ Cloud
    username: 'Imersoto',
    password: 'Bateria123',
    
    // Topic MQTT donde el ESP32 publica los datos de la batería
    // El ESP32 publica JSON cada 5 segundos con: voltage, current, soc, time_to_full, time_to_empty
    topic: 'battery/data',
    
    // ID único del cliente para identificar esta conexión
    // Se genera aleatoriamente para evitar conflictos si hay múltiples dashboards abiertos
    clientId: 'dashboard_' + Math.random().toString(16).substr(2, 8),
    
    // Opciones avanzadas de conexión MQTT
    options: {
      clean: true,               // Sesión limpia (no persistir mensajes offline)
      reconnectPeriod: 5000,     // Reconectar cada 5 segundos si se pierde conexión
      connectTimeout: 30000,     // Timeout de 30 segundos para la conexión inicial
      keepalive: 60              // Enviar ping cada 60 segundos para mantener conexión viva
    }
  },
  
  // ===== CONFIGURACIÓN DEL DASHBOARD =====
  DASHBOARD: {
    // Intervalo de actualización esperado (debe coincidir con ESP32)
    // ESP32 publica cada 5 segundos para optimizar consumo de datos (10GB/mes limit)
    updateInterval: 5000,        
    
    // Umbral de batería baja (%)
    // Por debajo de este valor se muestra alerta roja y mensaje crítico
    lowBatteryThreshold: 20,     
    
    // Umbral de batería media (%)
    // Entre lowThreshold y mediumThreshold se muestra amarillo
    // Por encima de mediumThreshold se muestra verde
    mediumBatteryThreshold: 50   
  }
};

