
// ============================================================================
// Centraliza TODAS las configuraciones del sistema de monitoreo de batería.
// 
// Propósito:
// - Almacenar credenciales de conexión MQTT (HiveMQ Cloud)
// - Definir umbrales de alertas de batería
// - Configurar intervalos de actualización
// 
// Uso:
// Este servicio es inyectable en cualquier componente mediante:
//   constructor(private configService: ConfiguracionServicio) { }
// 
// Arquitectura:
// - Singleton (una sola instancia en toda la app gracias a providedIn: 'root')
// - Solo lectura (propiedades readonly)
// - No tiene estado mutable
// ============================================================================

import { Injectable } from '@angular/core';

/**
 * Interfaz que define la estructura de configuración MQTT
 */
export interface ConfiguracionMqtt {
  /** URL del broker MQTT con WebSocket Seguro (WSS) */
  broker: string;
  /** Usuario para autenticación en HiveMQ Cloud */
  username: string;
  /** Contraseña para autenticación en HiveMQ Cloud */
  password: string;
  /** Topic MQTT donde el ESP32 publica los datos */
  topic: string;
  /** ID único del cliente para identificar esta conexión */
  clientId: string;
  /** Opciones avanzadas de conexión MQTT */
  options: {
    /** Sesión limpia (no persistir mensajes offline) */
    clean: boolean;
    /** Intervalo de reconexión en milisegundos */
    reconnectPeriod: number;
    /** Timeout de conexión inicial en milisegundos */
    connectTimeout: number;
    /** Intervalo de ping para mantener conexión viva (segundos) */
    keepalive: number;
  };
}

/**
 * Interfaz que define la configuración del dashboard
 */
export interface ConfiguracionDashboard {
  /** Intervalo esperado de actualización de datos (ms) */
  updateInterval: number;
  /** Umbral de batería baja (%) - Alerta roja */
  lowBatteryThreshold: number;
  /** Umbral de batería media (%) - Alerta amarilla */
  mediumBatteryThreshold: number;
}

/**
 * Servicio de configuración global de la aplicación
 * 
 * @Injectable providedIn: 'root' - Crea una única instancia compartida
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionServicio {
  
  // ========================================================================
  // CONFIGURACIÓN MQTT
  // ========================================================================
  
  /**
   * Configuración completa de conexión MQTT a HiveMQ Cloud
   * 
   * Detalles de la conexión:
   * - Cluster: AWS EU (región europea)
   * - Protocolo: WebSocket Seguro (WSS) en puerto 8884
   * - Autenticación: Usuario/contraseña
   * - Topic: fcnet/battery/data (donde ESP32 publica)
   */
  readonly MQTT: ConfiguracionMqtt = {
    // URL completa del broker HiveMQ Cloud
    // Formato: wss://[cluster-id].s1.eu.hivemq.cloud:8884/mqtt
    broker: 'wss://cdd0f3d0066146a385e294acd95f7868.s1.eu.hivemq.cloud:8884/mqtt',
    
    // Credenciales de autenticación
    // IMPORTANTE: En producción, usar variables de entorno
    username: 'admin',
    password: 'Admin123',
    
    // Topic MQTT - El ESP32 publica datos JSON cada 5 segundos aquí
    // Formato del mensaje: { voltage, current, soc, time_to_full, time_to_empty }
    topic: 'fcnet/battery/data',
    
    // ID único generado aleatoriamente para identificar este cliente
    // Formato: dashboard_[8 caracteres hexadecimales]
    // Esto evita conflictos si hay múltiples dashboards abiertos
    clientId: 'dashboard_' + Math.random().toString(16).substr(2, 8),
    
    // Opciones avanzadas de conexión MQTT
    options: {
      // Sesión limpia: no guarda mensajes si el cliente se desconecta
      clean: true,
      
      // Reintentar conexión cada 5 segundos si se pierde
      reconnectPeriod: 5000,
      
      // Timeout de 30 segundos para la conexión inicial
      // Si tarda más, marca error de conexión
      connectTimeout: 30000,
      
      // Enviar ping cada 60 segundos para mantener conexión activa
      // Previene desconexiones por inactividad
      keepalive: 60
    }
  };
  
  // ========================================================================
  // CONFIGURACIÓN DEL DASHBOARD
  // ========================================================================
  
  /**
   * Configuración de comportamiento del dashboard
   * 
   * Define:
   * - Intervalo de actualización esperado del ESP32
   * - Umbrales para alertas visuales según nivel de batería
   */
  readonly DASHBOARD: ConfiguracionDashboard = {
    // Intervalo de actualización (5 segundos = 5000 ms)
    // Debe coincidir con el intervalo de publicación del ESP32
    // Optimizado para el plan gratuito de HiveMQ (10GB/mes)
    updateInterval: 5000,
    
    // Umbral de batería BAJA (20%)
    // Por debajo de este valor:
    // - Se muestra alerta roja
    // - Animación de pulsación en batería
    // - Mensaje: "Requiere Carga Inmediata"
    lowBatteryThreshold: 20,
    
    // Umbral de batería MEDIA (50%)
    // Entre lowThreshold y mediumThreshold:
    // - Se muestra color amarillo/dorado
    // - Mensaje: "Considere Cargar Pronto"
    // Por encima de mediumThreshold:
    // - Se muestra color verde
    // - Mensaje: "Batería en Buen Estado"
    mediumBatteryThreshold: 50
  };

  /**
   * Constructor del servicio
   * No requiere dependencias, solo almacena configuración estática
   */
  constructor() { }
}
