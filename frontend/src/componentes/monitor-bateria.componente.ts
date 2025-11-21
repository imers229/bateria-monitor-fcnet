// ============================================================================
// COMPONENTE MONITOR DE BATERÍA - ANGULAR 19
// ============================================================================
// Componente principal del dashboard de monitoreo de batería 24V 100Ah
// 
// Funcionalidad:
// - Muestra en tiempo real los datos de la batería recibidos vía MQTT
// - Visualiza voltaje, corriente, estado de carga (SOC) y autonomía
// - Aplica colores y alertas según nivel de batería
// - Calcula estados (cargando/descargando/reposo)
// - Formatea tiempos en formato legible
// 
// Arquitectura:
// - Componente standalone (no requiere módulo)
// - Se suscribe a Observables del MqttServicio para recibir datos
// - Usa ViewEncapsulation.None para aplicar estilos globales
// - Limpia suscripciones al destruirse (previene fugas de memoria)
// 
// Datos recibidos del ESP32 cada 5 segundos:
// {voltage, current, soc, time_to_full, time_to_empty}
// ============================================================================

import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MqttServicio, DatosBateria } from '../servicios/mqtt.servicio';
import { ConfiguracionServicio } from '../servicios/configuracion.servicio';

/**
 * Componente principal del Monitor de Batería
 */
@Component({
  selector: 'app-monitor-bateria',           // Selector para usar en templates
  standalone: true,                           // Componente standalone (Angular 19)
  imports: [CommonModule],                    // Importa directivas comunes (ngIf, ngFor, etc.)
  templateUrl: './monitor-bateria.componente.html',  // Template externo
  styleUrls: ['./monitor-bateria.componente.css'],   // Estilos externos
  encapsulation: ViewEncapsulation.None       // Sin encapsulación (estilos globales)
})
export class MonitorBateriaComponente implements OnInit, OnDestroy {
  
  // ========================================================================
  // PROPIEDADES PÚBLICAS (DISPONIBLES EN EL TEMPLATE)
  // ========================================================================
  
  /** Datos actuales de la batería recibidos del ESP32 */
  batteryData: DatosBateria | null = null;
  
  /** Estado de conexión MQTT (true=conectado, false=desconectado) */
  isConnected: boolean = false;
  
  /** Mensaje de estado de la conexión ("En línea", "Conectando...", etc.) */
  connectionStatus: string = 'Conectando...';
  
  /** Timestamp formateado de la última actualización ("20/11/2025 14:30:15") */
  lastUpdate: string = '--';

  // ========================================================================
  // PROPIEDADES PRIVADAS
  // ========================================================================
  
  /**
   * Array de suscripciones a Observables
   * Se guardan para poder desuscribirse en ngOnDestroy
   * Esto previene fugas de memoria
   */
  private subscriptions: Subscription[] = [];

  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  /**
   * Constructor del componente
   * Angular inyecta automáticamente las dependencias
   * 
   * @param mqttService - Servicio de conexión MQTT
   * @param configService - Servicio de configuración (público para usar en template)
   */
  constructor(
    private mqttService: MqttServicio,
    public configService: ConfiguracionServicio
  ) {}

  // ========================================================================
  // MÉTODO: INICIALIZACIÓN DEL COMPONENTE
  // ========================================================================
  
  /**
   * Se ejecuta UNA VEZ después de que Angular crea el componente
   * 
   * Aquí nos suscribimos a los Observables del MqttServicio:
   * - batteryData$: Datos de la batería
   * - isConnected$: Estado de conexión
   * - connectionStatus$: Mensaje de estado
   * - lastUpdate$: Timestamp de última actualización
   * 
   * Cada vez que el servicio MQTT recibe datos, estos Observables
   * emiten nuevos valores y actualizan las propiedades del componente.
   * Angular detecta los cambios y actualiza la UI automáticamente.
   */
  ngOnInit(): void {
    // Suscribirse a los datos de la batería
    this.subscriptions.push(
      this.mqttService.batteryData$.subscribe(data => {
        this.batteryData = data;
      }),
      
      // Suscribirse al estado de conexión
      this.mqttService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
      }),
      
      // Suscribirse al mensaje de estado
      this.mqttService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
      }),
      
      // Suscribirse al timestamp de última actualización
      this.mqttService.lastUpdate$.subscribe(update => {
        this.lastUpdate = update;
      })
    );
  }

  // ========================================================================
  // MÉTODO: DESTRUCCIÓN DEL COMPONENTE
  // ========================================================================
  
  /**
   * Se ejecuta cuando Angular destruye el componente
   * (al cerrar la pestaña, navegar a otra página, etc.)
   * 
   * Es CRÍTICO desuscribirse de los Observables para evitar:
   * - Fugas de memoria
   * - Actualizaciones a componentes destruidos
   * - Comportamiento inesperado
   */
  ngOnDestroy(): void {
    // Desuscribirse de todos los Observables
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ========================================================================
  // MÉTODOS AUXILIARES PARA EL TEMPLATE
  // ========================================================================
  
  /**
   * Formatea horas decimales a formato legible en español
   * 
   * Ejemplos:
   * - 0.25 horas → "15 min"
   * - 1.5 horas → "1h 30min"
   * - 8 horas → "8h"
   * - -1 o valores inválidos → "N/A"
   * 
   * @param hours - Tiempo en horas (puede ser decimal)
   * @returns String formateado en español
   */
  formatTime(hours: number): string {
    // Validar que el valor sea positivo y exista
    if (hours < 0 || !hours) return 'N/A';
    
    // Si es menos de 1 hora, mostrar solo minutos
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    
    // Si es más de 1 hora, separar horas y minutos
    const h = Math.floor(hours);           // Parte entera (horas)
    const m = Math.round((hours - h) * 60); // Parte decimal → minutos
    
    // Formatear según el caso
    if (h === 0) return `${m} min`;        // Solo minutos
    if (m === 0) return `${h}h`;           // Solo horas exactas
    return `${h}h ${m}min`;                // Horas y minutos
  }

  /**
   * Retorna la clase CSS apropiada según el nivel de batería (SOC)
   * 
   * Esta clase controla:
   * - Color del líquido de la batería animada
   * - Color de la barra de progreso
   * - Animaciones de alerta
   * 
   * @param soc - Estado de Carga en porcentaje (0-100)
   * @returns Clase CSS: 'low', 'medium' o '' (vacío=normal/verde)
   */
  getBatteryClass(soc: number): string {
    if (soc < this.configService.DASHBOARD.lowBatteryThreshold) return 'low';      // < 20% = Rojo
    if (soc < this.configService.DASHBOARD.mediumBatteryThreshold) return 'medium'; // 20-50% = Amarillo
    return '';                                                                       // >= 50% = Verde
  }

  /**
   * Retorna el mensaje de estado descriptivo según el nivel de carga
   * 
   * Mensajes por rango:
   * - 0-19%: "⚠️ Batería Baja - Requiere Carga Inmediata"
   * - 20-49%: "⚡ Batería Media - Considere Cargar Pronto"
   * - 50-79%: "✅ Batería en Buen Estado"
   * - 80-94%: "🔋 Batería con Buena Carga"
   * - 95-100%: "💯 Batería Completamente Cargada"
   * 
   * @param soc - Estado de Carga en porcentaje (0-100)
   * @returns Mensaje descriptivo con emoji
   */
  getBatteryStatus(soc: number): string {
    if (soc < this.configService.DASHBOARD.lowBatteryThreshold) {
      return '⚠️ Batería Baja - Requiere Carga Inmediata';
    } else if (soc < this.configService.DASHBOARD.mediumBatteryThreshold) {
      return '⚡ Batería Media - Considere Cargar Pronto';
    } else if (soc < 80) {
      return '✅ Batería en Buen Estado';
    } else if (soc < 95) {
      return '🔋 Batería con Buena Carga';
    } else {
      return '💯 Batería Completamente Cargada';
    }
  }

  /**
   * Determina el estado actual según la corriente
   * 
   * Lógica:
   * - Corriente < -0.1A: Cargando (flujo hacia la batería)
   * - Corriente > 0.1A: Descargando (flujo desde la batería)
   * - Entre -0.1A y 0.1A: Reposo (sin actividad significativa)
   * 
   * @param current - Corriente en Amperios
   * @returns Objeto con icono, texto y color para el indicador
   */
  getCurrentState(current: number): { icon: string; text: string; color: string } {
    if (current < -0.1) {
      // Corriente negativa = cargando
      return { icon: '⚡', text: 'Cargando', color: '#4CAF50' };
    } else if (current > 0.1) {
      // Corriente positiva = descargando
      return { icon: '🔋', text: 'Descargando', color: '#ff9800' };
    } else {
      // Corriente cercana a cero = reposo
      return { icon: '💤', text: 'Reposo', color: '#2196F3' };
    }
  }

  // ========================================================================
  // GETTERS PARA USAR EN EL TEMPLATE
  // ========================================================================
  // Los getters son propiedades calculadas que se pueden usar en el template
  // como si fueran propiedades normales
  
  /** Estado de carga (SOC) actual - Valor por defecto: 0 */
  get soc(): number {
    return this.batteryData?.soc || 0;
  }

  /** Voltaje actual en Voltios - Valor por defecto: 0 */
  get voltage(): number {
    return this.batteryData?.voltage || 0;
  }

  /** Corriente actual en Amperios - Valor por defecto: 0 */
  get current(): number {
    return this.batteryData?.current || 0;
  }

  /** Tiempo hasta carga completa en horas - Valor por defecto: -1 (N/A) */
  get timeFull(): number {
    return this.batteryData?.time_to_full || -1;
  }

  /** Tiempo hasta descarga completa (autonomía) en horas - Valor por defecto: -1 (N/A) */
  get timeEmpty(): number {
    return this.batteryData?.time_to_empty || -1;
  }

  /** Clase CSS según nivel de batería ('low', 'medium', o '') */
  get batteryClass(): string {
    return this.getBatteryClass(this.soc);
  }

  /** Estado actual (cargando/descargando/reposo) con icono y color */
  get currentState(): { icon: string; text: string; color: string } {
    return this.getCurrentState(this.current);
  }

  /**
   * Indica si se debe mostrar la alerta de batería baja
   * 
   * Condiciones para mostrar alerta:
   * - SOC < 20% (umbral de batería baja)
   * - Y hay datos de batería disponibles (no es null)
   */
  get showAlert(): boolean {
    return this.soc < this.configService.DASHBOARD.lowBatteryThreshold && this.batteryData !== null;
  }

  /**
   * Mensaje de estado de la batería para mostrar en la UI
   * 
   * - Si hay datos: Mensaje según nivel de batería
   * - Si no hay datos: "Esperando datos..."
   */
  get statusMessage(): string {
    return this.batteryData ? this.getBatteryStatus(this.soc) : 'Esperando datos...';
  }
}
