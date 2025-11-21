/**
 * SERVICIO MQTT
 * =============
 * Maneja la conexión permanente con HiveMQ Cloud
 * - Suscripción al topic fcnet/battery/data
 * - Almacena último estado de batería
 * - Emite eventos cuando llegan nuevos datos
 * - Optimiza consumo de datos (10GB/mes)
 */

import mqtt from 'mqtt';
import { EventEmitter } from 'events';
import { config } from '../configuracion.js';

class ServicioMQTT extends EventEmitter {
  constructor() {
    super();
    
    /**
     * Cliente MQTT conectado a HiveMQ Cloud
     * @type {mqtt.MqttClient}
     */
    this.cliente = null;
    
    /**
     * Último estado de batería recibido
     * @type {Object}
     */
    this.ultimoEstado = {
      voltage: 0,
      current: 0,
      soc: 0,
      time_to_full: 0,
      time_to_empty: 0,
      timestamp: null,
      estado: 'Desconocido'
    };
    
    /**
     * Estado de conexión MQTT
     * @type {boolean}
     */
    this.conectado = false;
    
    /**
     * Contador de mensajes recibidos (para estadísticas)
     * @type {number}
     */
    this.mensajesRecibidos = 0;
  }

  /**
   * Conecta al broker MQTT de HiveMQ Cloud
   * Establece conexión permanente y maneja reconexiones automáticas
   */
  conectar() {
    const url = `${config.mqtt.opciones.protocol}://${config.mqtt.host}:${config.mqtt.port}`;
    
    console.log('🔌 Conectando a HiveMQ Cloud...');
    console.log(`   Host: ${config.mqtt.host}:${config.mqtt.port}`);
    console.log(`   Usuario: ${config.mqtt.username}`);
    console.log(`   Topic: ${config.mqtt.topic}`);
    
    // Crear cliente MQTT con credenciales
    this.cliente = mqtt.connect(url, {
      ...config.mqtt.opciones,
      username: config.mqtt.username,
      password: config.mqtt.password
    });

    // Evento: Conexión exitosa
    this.cliente.on('connect', () => {
      this.conectado = true;
      console.log('✅ MQTT conectado a HiveMQ Cloud');
      
      // Suscribirse al topic de batería
      this.cliente.subscribe(config.mqtt.topic, (err) => {
        if (err) {
          console.error('❌ Error suscribiéndose al topic:', err);
        } else {
          console.log(`📡 Suscrito a: ${config.mqtt.topic}`);
        }
      });
    });

    // Evento: Mensaje recibido
    this.cliente.on('message', (topic, mensaje) => {
      this.procesarMensaje(topic, mensaje);
    });

    // Evento: Error de conexión
    this.cliente.on('error', (error) => {
      console.error('❌ Error MQTT:', error.message);
      this.conectado = false;
    });

    // Evento: Desconexión
    this.cliente.on('close', () => {
      this.conectado = false;
      console.log('⚠️ MQTT desconectado. Reconectando...');
    });

    // Evento: Reconexión
    this.cliente.on('reconnect', () => {
      console.log('🔄 Intentando reconectar MQTT...');
    });
  }

  /**
   * Procesa mensajes MQTT recibidos del ESP32
   * @param {string} topic - Topic del mensaje
   * @param {Buffer} mensaje - Payload del mensaje
   */
  procesarMensaje(topic, mensaje) {
    try {
      // Parsear JSON del ESP32
      const datos = JSON.parse(mensaje.toString());
      this.mensajesRecibidos++;
      
      // Actualizar último estado
      this.ultimoEstado = {
        voltage: datos.voltage || 0,
        current: datos.current || 0,
        soc: datos.soc || 0,
        time_to_full: datos.time_to_full || 0,
        time_to_empty: datos.time_to_empty || 0,
        timestamp: new Date().toISOString(),
        estado: this.determinarEstado(datos.current)
      };
      
      console.log(`📥 [${this.mensajesRecibidos}] V=${datos.voltage}V I=${datos.current}A SOC=${datos.soc}%`);
      
      // Emitir evento para que otros servicios reaccionen
      this.emit('nuevosDatos', this.ultimoEstado);
      
    } catch (error) {
      console.error('❌ Error procesando mensaje MQTT:', error);
    }
  }

  /**
   * Determina el estado de la batería según la corriente
   * @param {number} corriente - Corriente en amperios (+ descarga, - carga)
   * @returns {string} Estado: "Cargando", "Descargando" o "Reposo"
   */
  determinarEstado(corriente) {
    if (corriente < -0.1) return 'Cargando';
    if (corriente > 0.1) return 'Descargando';
    return 'Reposo';
  }

  /**
   * Obtiene el último estado de batería almacenado
   * @returns {Object} Último estado con todos los datos
   */
  obtenerUltimoEstado() {
    return this.ultimoEstado;
  }

  /**
   * Verifica si el servicio está conectado a MQTT
   * @returns {boolean} true si está conectado
   */
  estaConectado() {
    return this.conectado;
  }

  /**
   * Desconecta del broker MQTT
   */
  desconectar() {
    if (this.cliente) {
      this.cliente.end();
      this.conectado = false;
      console.log('🔌 MQTT desconectado');
    }
  }
}

// Exportar instancia única (singleton)
export const servicioMQTT = new ServicioMQTT();
