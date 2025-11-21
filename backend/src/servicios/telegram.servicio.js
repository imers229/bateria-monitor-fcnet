/**
 * SERVICIO BOT DE TELEGRAM
 * =========================
 * Maneja toda la lógica del bot de Telegram
 * - Comandos: /start, /estado, /dashboard, /alertas, /silencio, /info
 * - Sistema de suscriptores (hasta 10 usuarios)
 * - Alertas automáticas cuando SOC < 20%
 * - Migrado desde ESP32 al backend para mayor confiabilidad
 */

import TelegramBot from 'node-telegram-bot-api';
import { config } from '../configuracion.js';
import { servicioMQTT } from './mqtt.servicio.js';

class ServicioTelegram {
  constructor() {
    /**
     * Instancia del bot de Telegram
     * @type {TelegramBot}
     */
    this.bot = null;
    
    /**
     * Lista de chat_ids suscritos a alertas
     * @type {Set<string>}
     */
    this.suscriptores = new Set();
    
    /**
     * Flag para evitar enviar múltiples alertas de batería baja
     * @type {boolean}
     */
    this.alertaBajaEnviada = false;
    
    /**
     * Indica si el bot está activo
     * @type {boolean}
     */
    this.activo = false;
  }

  /**
   * Inicia el bot de Telegram y registra comandos
   */
  iniciar() {
    if (!config.telegram.token) {
      console.error('❌ Token de Telegram no configurado');
      return;
    }

    console.log('🤖 Iniciando bot de Telegram...');
    
    try {
      // Crear bot con polling
      this.bot = new TelegramBot(config.telegram.token, { 
        polling: {
          interval: 300,
          autoStart: true,
          params: {
            timeout: 10
          }
        }
      });
      this.activo = true;

      // Manejar errores de polling
      this.bot.on('polling_error', (error) => {
        console.error('❌ Error de polling:', error.code, error.message);
      });

      // Registrar comandos
      this.registrarComandos();
      
      // Escuchar eventos de MQTT para alertas automáticas
      this.configurarAlertas();
      
      // Obtener info del bot
      this.bot.getMe().then((botInfo) => {
        console.log('✅ Bot de Telegram activo');
        console.log(`   Usuario: @${botInfo.username}`);
        console.log(`   Nombre: ${botInfo.first_name}`);
      }).catch((err) => {
        console.error('❌ Error obteniendo info del bot:', err.message);
      });
      
    } catch (error) {
      console.error('❌ Error iniciando bot de Telegram:', error);
      this.activo = false;
    }
  }

  /**
   * Registra todos los comandos del bot
   */
  registrarComandos() {
    // /start - Menú principal y suscripción
    this.bot.onText(/\/start/, (msg) => {
      console.log(`📱 Comando /start de ${msg.from.first_name} (${msg.chat.id})`);
      
      const chatId = msg.chat.id.toString();
      const nombre = msg.from.first_name || 'Usuario';
      
      this.agregarSuscriptor(chatId);
      
      const mensaje = `🔋 *Monitor Batería FCNET*\n\n` +
        `Hola *${nombre}*! 👋\n\n` +
        `*Comandos disponibles:*\n` +
        `/dashboard - Ver dashboard web\n` +
        `/estado - Estado actual de batería\n` +
        `/alertas - Activar notificaciones\n` +
        `/silencio - Desactivar notificaciones\n` +
        `/info - Información del sistema\n\n` +
        `✅ Alertas automáticas activas (<${config.telegram.alertas.bateriaBaja}%)`;
      
      this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' })
        .then(() => console.log(`✅ Respuesta enviada a ${chatId}`))
        .catch(err => console.error(`❌ Error enviando mensaje:`, err.message));
    });

    // /dashboard - Link al dashboard
    this.bot.onText(/\/dashboard/, (msg) => {
      const chatId = msg.chat.id;
      const mensaje = `📊 *Dashboard Web*\n\n🌐 ${config.servidor.dashboardUrl}`;
      this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    });

    // /estado - Estado actual completo
    this.bot.onText(/\/estado/, (msg) => {
      const chatId = msg.chat.id;
      this.enviarEstadoActual(chatId);
    });

    // /alertas - Activar notificaciones
    this.bot.onText(/\/alertas/, (msg) => {
      const chatId = msg.chat.id.toString();
      this.agregarSuscriptor(chatId);
      this.bot.sendMessage(chatId, `🔔 Alertas activadas\n\nRecibirás notificaciones cuando la batería esté <${config.telegram.alertas.bateriaBaja}%`, { parse_mode: 'Markdown' });
    });

    // /silencio - Desactivar notificaciones
    this.bot.onText(/\/silencio/, (msg) => {
      const chatId = msg.chat.id.toString();
      this.eliminarSuscriptor(chatId);
      this.bot.sendMessage(chatId, '🔕 Alertas desactivadas');
    });

    // /info - Información del sistema
    this.bot.onText(/\/info/, (msg) => {
      const chatId = msg.chat.id;
      const mqttStatus = servicioMQTT.estaConectado() ? '✅' : '❌';
      
      const mensaje = `📋 *Información del Sistema*\n\n` +
        `🔋 Capacidad: ${config.bateria.capacidad_ah}Ah 24V\n` +
        `⚡ Rango: ${config.bateria.voltajeMin}V - ${config.bateria.voltajeMax}V\n` +
        `📡 MQTT: ${mqttStatus} HiveMQ Cloud\n` +
        `🤖 Backend: Node.js + Express\n` +
        `👥 Suscriptores: ${this.suscriptores.size}/${config.telegram.maxSuscriptores}\n\n` +
        `🌐 ${config.servidor.dashboardUrl}`;
      
      this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    });
  }

  /**
   * Configura las alertas automáticas basadas en eventos MQTT
   */
  configurarAlertas() {
    servicioMQTT.on('nuevosDatos', (datos) => {
      const soc = datos.soc;
      
      // Alerta de batería baja
      if (soc < config.telegram.alertas.bateriaBaja && !this.alertaBajaEnviada) {
        this.enviarAlertaBateriaBaja(datos);
        this.alertaBajaEnviada = true;
      }
      
      // Resetear alerta cuando se recupera
      if (soc >= config.telegram.alertas.recuperacion) {
        this.alertaBajaEnviada = false;
      }
    });
  }

  /**
   * Envía el estado actual de la batería a un chat
   * @param {string|number} chatId - ID del chat de Telegram
   */
  enviarEstadoActual(chatId) {
    const datos = servicioMQTT.obtenerUltimoEstado();
    
    if (!datos.timestamp) {
      this.bot.sendMessage(chatId, '⚠️ No hay datos disponibles aún');
      return;
    }
    
    const { voltage, current, soc, time_to_full, time_to_empty, estado } = datos;
    
    const icono = estado === 'Cargando' ? '⚡' : 
                  estado === 'Descargando' ? '🔋' : '💤';
    
    let mensaje = `🔋 *Estado Actual*\n\n`;
    mensaje += `📊 Carga: *${soc.toFixed(1)}%*\n`;
    mensaje += `⚡ Voltaje: ${voltage.toFixed(2)}V\n`;
    mensaje += `🔌 Corriente: ${Math.abs(current).toFixed(2)}A\n`;
    mensaje += `📈 ${icono} ${estado}\n\n`;
    
    // Tiempo estimado
    if (time_to_full > 0 && estado === 'Cargando') {
      const horas = Math.floor(time_to_full);
      const minutos = Math.floor((time_to_full - horas) * 60);
      mensaje += `⏱️ Carga completa: ${horas}h ${minutos}min\n`;
    }
    
    if (time_to_empty > 0 && estado === 'Descargando') {
      const horas = Math.floor(time_to_empty);
      const minutos = Math.floor((time_to_empty - horas) * 60);
      mensaje += `⏱️ Tiempo restante: ${horas}h ${minutos}min\n`;
    }
    
    this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
  }

  /**
   * Envía alerta de batería baja a todos los suscriptores
   * @param {Object} datos - Datos actuales de batería
   */
  enviarAlertaBateriaBaja(datos) {
    if (this.suscriptores.size === 0) return;
    
    const { soc, voltage, current, estado } = datos;
    
    let mensaje = `🚨 *BATERÍA BAJA!* 🚨\n\n`;
    mensaje += `🔋 ${soc.toFixed(1)}%\n`;
    mensaje += `⚡ ${voltage.toFixed(2)}V\n`;
    mensaje += `🔌 ${Math.abs(current).toFixed(2)}A\n\n`;
    
    if (estado === 'Descargando') {
      mensaje += `⚠️ *CONECTA CARGADOR YA*\n\n`;
    }
    
    mensaje += `📊 ${config.servidor.dashboardUrl}`;
    
    console.log(`🚨 Enviando alerta de batería baja (${soc.toFixed(1)}%) a ${this.suscriptores.size} suscriptores`);
    
    // Enviar a todos los suscriptores
    this.suscriptores.forEach(chatId => {
      this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' })
        .catch(err => console.error(`Error enviando alerta a ${chatId}:`, err.message));
    });
  }

  /**
   * Agrega un suscriptor a las alertas
   * @param {string} chatId - ID del chat a suscribir
   * @returns {boolean} true si se agregó, false si ya existía o límite alcanzado
   */
  agregarSuscriptor(chatId) {
    if (this.suscriptores.size >= config.telegram.maxSuscriptores) {
      console.log(`⚠️ Límite de suscriptores alcanzado (${config.telegram.maxSuscriptores})`);
      return false;
    }
    
    if (!this.suscriptores.has(chatId)) {
      this.suscriptores.add(chatId);
      console.log(`➕ Nuevo suscriptor: ${chatId} (Total: ${this.suscriptores.size})`);
      return true;
    }
    
    return false;
  }

  /**
   * Elimina un suscriptor de las alertas
   * @param {string} chatId - ID del chat a eliminar
   * @returns {boolean} true si se eliminó, false si no existía
   */
  eliminarSuscriptor(chatId) {
    if (this.suscriptores.has(chatId)) {
      this.suscriptores.delete(chatId);
      console.log(`➖ Suscriptor eliminado: ${chatId} (Total: ${this.suscriptores.size})`);
      return true;
    }
    
    return false;
  }

  /**
   * Detiene el bot de Telegram
   */
  detener() {
    if (this.bot) {
      this.bot.stopPolling();
      this.activo = false;
      console.log('🤖 Bot de Telegram detenido');
    }
  }
}

// Exportar instancia única (singleton)
export const servicioTelegram = new ServicioTelegram();
