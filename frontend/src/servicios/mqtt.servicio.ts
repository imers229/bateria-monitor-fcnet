
// ============================================================================
// Maneja la conexión MQTT con HiveMQ Cloud y la recepción de datos en tiempo real.
// OPTIMIZADO: Solo se conecta a MQTT cuando el dashboard está abierto
// Obtiene estado inicial del backend API para ahorrar datos
// 
// Responsabilidades:
// 1. Consultar backend API para obtener último estado (al iniciar)
// 2. Conectar al broker MQTT solo cuando el dashboard esté abierto
// 3. Suscribirse al topic donde el ESP32 publica datos de la batería
// 4. Parsear y distribuir los datos recibidos a través de Observables RxJS
// 5. Gestionar reconexiones automáticas en caso de pérdida de conexión
// 
// Arquitectura OPTIMIZADA:
// - Backend Node.js escucha MQTT 24/7 y guarda último estado
// - Dashboard consulta backend API primero (sin MQTT)
// - Luego se conecta a MQTT para actualizaciones en tiempo real
// - Al cerrar, se desconecta (ahorra datos de los 10GB/mes de HiveMQ)
// 
// Flujo de datos:
// ESP32 → HiveMQ Cloud → Backend Node.js (24/7)
//                             ↓
//                        API REST (último estado)
//                             ↓
//                Dashboard Angular → MQTT (solo cuando está abierto)
// ============================================================================

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import mqtt from 'mqtt';
import { ConfiguracionServicio } from './configuracion.servicio';
import { environment } from '../environments/environment';

/**
 * Interfaz que define la estructura de datos de la batería
 * que envía el ESP32 vía MQTT
 */
export interface DatosBateria {
  /** Voltaje de la batería en Voltios (V) - Rango: 20.8V a 26.5V */
  voltage: number;
  
  /** Corriente en Amperios (A)
   *  - Positivo: descargando
   *  - Negativo: cargando
   *  - Cercano a 0: en reposo
   */
  current: number;
  
  /** Estado de Carga (State of Charge) en porcentaje
   *  - Rango: 0% (vacía) a 100% (llena)
   *  - Calculado por el ESP32 usando voltaje
   */
  soc: number;
  
  /** Tiempo estimado hasta carga completa en horas
   *  - Solo válido si está cargando (current < 0)
   *  - -1 si no está cargando
   */
  time_to_full: number;
  
  /** Tiempo estimado hasta descarga completa en horas (autonomía)
   *  - Solo válido si está descargando (current > 0)
   *  - -1 si no está descargando
   */
  time_to_empty: number;
}

/**
 * Servicio de gestión de conexión MQTT
 * 
 * Singleton: Una única instancia compartida en toda la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class MqttServicio implements OnDestroy {
  
  // ========================================================================
  // PROPIEDADES PRIVADAS
  // ========================================================================
  
  /** Cliente MQTT (biblioteca mqtt.js) */
  private client: mqtt.MqttClient | null = null;
  
  /** URL del backend API */
  private readonly BACKEND_API_URL = environment.backendUrl;
  
  // BehaviorSubjects: Mantienen el último valor y lo emiten a nuevos suscriptores
  
  /** Subject de datos de batería - Emite null hasta recibir primer mensaje */
  private batteryDataSubject = new BehaviorSubject<DatosBateria | null>(null);
  
  /** Subject de estado de conexión - true=conectado, false=desconectado */
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  
  /** Subject de mensaje de estado - Texto descriptivo del estado */
  private connectionStatusSubject = new BehaviorSubject<string>('Cargando estado inicial...');
  
  /** Subject de última actualización - Timestamp formateado */
  private lastUpdateSubject = new BehaviorSubject<string>('--');

  // ========================================================================
  // OBSERVABLES PÚBLICOS
  // ========================================================================
  // Los componentes se suscriben a estos para recibir notificaciones de cambios
  
  /** Observable de datos de batería - Los componentes reciben aquí los datos del ESP32 */
  public batteryData$: Observable<DatosBateria | null> = this.batteryDataSubject.asObservable();
  
  /** Observable de estado de conexión - Para mostrar indicador visual */
  public isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();
  
  /** Observable de mensaje de estado - Para mostrar texto en UI */
  public connectionStatus$: Observable<string> = this.connectionStatusSubject.asObservable();
  
  /** Observable de última actualización - Para mostrar timestamp */
  public lastUpdate$: Observable<string> = this.lastUpdateSubject.asObservable();

  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  /**
   * Constructor del servicio
   * Se ejecuta UNA VEZ cuando Angular crea la instancia del servicio
   * 
   * OPTIMIZACIÓN: Primero consulta backend API, luego conecta a MQTT
   * 
   * @param configService - Inyección del servicio de configuración
   */
  constructor(private configService: ConfiguracionServicio) {
    // 1. Obtener último estado del backend (sin MQTT)
    this.obtenerEstadoInicial();
    
    // 2. Conectar a MQTT para actualizaciones en tiempo real
    setTimeout(() => this.connect(), 1000); // Esperar 1s para que cargue el estado inicial
  }

  // ========================================================================
  // MÉTODO: OBTENER ESTADO INICIAL DEL BACKEND
  // ========================================================================
  
  /**
   * Consulta el backend API para obtener el último estado de batería
   * sin necesidad de conectarse a MQTT
   * 
   * Ventajas:
   * - Más rápido que esperar mensaje MQTT
   * - Ahorra datos (no mantiene conexión MQTT activa)
   * - El backend siempre tiene el último estado
   * 
   * @private Solo se llama desde el constructor
   */
  private async obtenerEstadoInicial(): Promise<void> {
    try {
      console.log('📊 Consultando estado inicial del backend...');
      
      const response = await fetch(`${this.BACKEND_API_URL}/estado`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Si hay datos válidos, emitirlos
      if (data.voltage && data.soc !== undefined) {
        const estadoInicial: DatosBateria = {
          voltage: data.voltage,
          current: data.current,
          soc: data.soc,
          time_to_full: data.time_to_full,
          time_to_empty: data.time_to_empty
        };
        
        console.log('✅ Estado inicial obtenido:', estadoInicial);
        this.batteryDataSubject.next(estadoInicial);
        
        // Actualizar timestamp
        if (data.timestamp) {
          const date = new Date(data.timestamp);
          const timeString = date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          this.lastUpdateSubject.next(timeString);
        }
        
        this.connectionStatusSubject.next('Conectando a MQTT...');
      }
      
    } catch (error) {
      console.warn('⚠️ No se pudo obtener estado del backend:', error);
      console.log('📡 Esperando datos de MQTT...');
      this.connectionStatusSubject.next('Esperando datos...');
    }
  }

  // ========================================================================
  // MÉTODO: CONECTAR A MQTT
  // ========================================================================
  
  /**
   * Establece la conexión con el broker MQTT de HiveMQ Cloud
   * 
   * OPTIMIZACIÓN: Solo se conecta cuando el dashboard está abierto
   * Al cerrar la pestaña, ngOnDestroy() cerrará la conexión
   * 
   * Proceso:
   * 1. Obtiene configuración del servicio de configuración
   * 2. Crea cliente MQTT con credenciales
   * 3. Configura listeners para eventos (connect, message, error, etc.)
   * 4. La biblioteca MQTT.js maneja automáticamente la reconexión
   * 
   * @private Solo se llama internamente desde el constructor
   */
  private connect(): void {
    console.log('🔌 Conectando a HiveMQ Cloud...');
    
    // Obtener configuración MQTT
    const config = this.configService.MQTT;
    
    // Crear cliente MQTT y conectar al broker
    // La biblioteca mqtt.js maneja la conexión WebSocket internamente
    this.client = mqtt.connect(config.broker, {
      clientId: config.clientId,    // ID único de este cliente
      username: config.username,    // Usuario para autenticación
      password: config.password,    // Contraseña para autenticación
      ...config.options             // Opciones: keepalive, reconnectPeriod, etc.
    });

    // ========== EVENTO: Conexión Exitosa ==========
    this.client.on('connect', () => {
      console.log('✅ Conectado a HiveMQ Cloud (Clúster Privado)');
      
      // Actualizar estado
      this.isConnectedSubject.next(true);
      this.connectionStatusSubject.next('En línea');
      
      // Suscribirse al topic donde el ESP32 publica
      // QoS 0 = "Fire and forget" (más rápido, sin confirmación)
      this.client?.subscribe(config.topic, { qos: 0 }, (err) => {
        if (!err) {
          console.log('📡 Suscrito al topic:', config.topic);
        } else {
          console.error('❌ Error al suscribirse:', err);
          this.connectionStatusSubject.next('Error en suscripción');
        }
      });
    });

    // ========== EVENTO: Mensaje Recibido ==========
    // Se ejecuta cada vez que llega un mensaje del ESP32
    this.client.on('message', (_topic, message) => {
      try {
        // Parsear JSON del mensaje
        // Ejemplo: {"voltage":25.2,"current":2.5,"soc":85,"time_to_full":1.5,"time_to_empty":8}
        const data: DatosBateria = JSON.parse(message.toString());
        console.log('📊 Datos recibidos:', data);
        
        // Emitir datos a todos los componentes suscritos
        this.batteryDataSubject.next(data);
        
        // Actualizar timestamp de última actualización
        const now = new Date();
        const timeString = now.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false  // Formato 24 horas
        });
        this.lastUpdateSubject.next(timeString);
        
      } catch (error) {
        // Si el JSON está mal formado, mostrar error
        console.error('❌ Error al parsear mensaje:', error);
      }
    });

    // ========== EVENTO: Error de Conexión ==========
    this.client.on('error', (error) => {
      console.error('❌ Error MQTT:', error);
      this.isConnectedSubject.next(false);
      this.connectionStatusSubject.next('Error de conexión');
    });

    // ========== EVENTO: Desconexión ==========
    this.client.on('offline', () => {
      console.log('📴 Desconectado de HiveMQ');
      this.isConnectedSubject.next(false);
      this.connectionStatusSubject.next('Desconectado');
    });

    // ========== EVENTO: Reconexión Automática ==========
    // La biblioteca MQTT.js intenta reconectar automáticamente
    this.client.on('reconnect', () => {
      console.log('🔄 Reconectando...');
      this.connectionStatusSubject.next('Reconectando...');
    });
  }

  // ========================================================================
  // MÉTODO: DESTRUCCIÓN DEL SERVICIO
  // ========================================================================
  
  /**
   * Cierra la conexión MQTT al destruir el servicio
   * 
   * Este método es llamado por Angular cuando:
   * - El usuario cierra la pestaña del navegador
   * - La aplicación se recarga
   * - El servicio es destruido manualmente (raro)
   * 
   * OPTIMIZACIÓN: Al cerrar el dashboard, se desconecta de MQTT
   * Esto ahorra datos de los 10GB/mes de HiveMQ Cloud
   * 
   * Importante: Siempre cerrar conexiones para evitar fugas de memoria
   */
  ngOnDestroy(): void {
    if (this.client) {
      this.client.end();
      console.log('🔌 Conexión MQTT cerrada (ahorrando datos)');
    }
  }
}
