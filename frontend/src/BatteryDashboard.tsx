// ============================================
// IMPORTACIONES
// ============================================
import { useState, useEffect, useRef } from 'react'; // Hooks de React para estado y efectos
import mqtt from 'mqtt';                             // Cliente MQTT para conexión con HiveMQ
import { CONFIG } from './config';                   // Configuración de credenciales MQTT
import './BatteryDashboard.css';                     // Estilos CSS del dashboard

// ============================================
// INTERFAZ DE DATOS
// ============================================
// Define la estructura de datos que recibe del ESP32
interface BatteryData {
  voltage: number;        // Voltaje de la batería en V (ej: 25.2)
  current: number;        // Corriente en A (positivo=descargando, negativo=cargando)
  soc: number;           // State of Charge (0-100%)
  time_to_full: number;  // Tiempo estimado hasta carga completa en horas
  time_to_empty: number; // Tiempo estimado hasta descarga completa en horas
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function BatteryDashboard() {
  // ========== ESTADOS DEL COMPONENTE ==========
  // Estado para almacenar los datos de la batería recibidos por MQTT
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);
  
  // Estado de la conexión MQTT (true=conectado, false=desconectado)
  const [isConnected, setIsConnected] = useState(false);
  
  // Texto del estado de conexión para mostrar al usuario
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  
  // Timestamp de la última actualización de datos
  const [lastUpdate, setLastUpdate] = useState<string>('--');
  
  // Referencia al cliente MQTT (persiste entre renders)
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  // ========== EFECTO: CONEXIÓN MQTT ==========
  // Este efecto se ejecuta UNA VEZ al montar el componente
  // Establece la conexión con HiveMQ Cloud y configura todos los listeners
  useEffect(() => {
    // Log para debugging
    console.log('🔌 Conectando a HiveMQ Cloud...');
    
    // Crear cliente MQTT con las credenciales de config.ts
    const client = mqtt.connect(CONFIG.MQTT.broker, {
      username: CONFIG.MQTT.username,    // Usuario: Imersoto
      password: CONFIG.MQTT.password,    // Contraseña: Bateria123
      clientId: CONFIG.MQTT.clientId,    // ID único para este cliente
      ...CONFIG.MQTT.options             // Opciones: keepalive, reconnect, etc.
    });

    // Guardar referencia del cliente para cleanup posterior
    clientRef.current = client;

    // ===== EVENTO: Conexión Exitosa =====
    client.on('connect', () => {
      console.log('✅ Conectado a HiveMQ Cloud');
      setIsConnected(true);                    // Actualizar estado de conexión
      setConnectionStatus('En línea');         // Actualizar texto de estado
      
      // Suscribirse al topic donde el ESP32 publica los datos
      client.subscribe(CONFIG.MQTT.topic, (err) => {
        if (!err) {
          console.log('📡 Suscrito al topic:', CONFIG.MQTT.topic);
        } else {
          console.error('❌ Error al suscribirse:', err);
        }
      });
    });

    // ===== EVENTO: Mensaje Recibido =====
    // Se ejecuta cada vez que llega un mensaje del ESP32
    client.on('message', (_topic, message) => {
      try {
        // Parsear el JSON recibido del ESP32
        // Ejemplo: {"voltage":25.2,"current":2.5,"soc":85,"time_to_full":1.5,"time_to_empty":8}
        const data: BatteryData = JSON.parse(message.toString());
        console.log('📊 Datos recibidos:', data);
        
        // Actualizar el estado con los nuevos datos (esto re-renderiza el componente)
        setBatteryData(data);
        
        // Actualizar timestamp con fecha/hora actual
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
        setLastUpdate(timeString);
      } catch (error) {
        // Si el JSON está mal formado, mostrar error
        console.error('❌ Error al parsear mensaje:', error);
      }
    });

    // ===== EVENTO: Error de Conexión =====
    client.on('error', (error) => {
      console.error('❌ Error MQTT:', error);
      setIsConnected(false);
      setConnectionStatus('Error de conexión');
    });

    // ===== EVENTO: Desconexión =====
    client.on('offline', () => {
      console.log('📴 Desconectado de HiveMQ');
      setIsConnected(false);
      setConnectionStatus('Desconectado');
    });

    // ===== EVENTO: Reconexión Automática =====
    client.on('reconnect', () => {
      console.log('🔄 Reconectando...');
      setConnectionStatus('Reconectando...');
    });

    // ===== CLEANUP: Al desmontar el componente =====
    // Cerrar la conexión MQTT cuando el usuario cierre la pestaña
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        console.log('🔌 Conexión MQTT cerrada');
      }
    };
  }, []); // Array vacío = ejecutar solo una vez al montar

  // ========== FUNCIÓN: FORMATEAR TIEMPO ==========
  // Convierte horas decimales a un formato legible en español
  // Ejemplo: 2.5 horas → "2h 30min"
  // Ejemplo: 0.25 horas → "15 min"
  // Ejemplo: valores negativos o nulos → "N/A"
  const formatTime = (hours: number): string => {
    // Validar que el valor sea positivo y exista
    if (hours < 0 || !hours) return 'N/A';
    
    if (hours < 1) {
      // Si es menos de 1 hora, mostrar solo minutos
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    
    // Si es más de 1 hora, separar horas y minutos
    const h = Math.floor(hours);           // Parte entera (horas)
    const m = Math.round((hours - h) * 60); // Parte decimal convertida a minutos
    
    // Formatear según el caso
    if (h === 0) return `${m} min`;        // Solo minutos
    if (m === 0) return `${h}h`;           // Solo horas exactas
    return `${h}h ${m}min`;                // Horas y minutos
  };

  // ========== FUNCIÓN: CLASE CSS SEGÚN NIVEL DE BATERÍA ==========
  // Retorna la clase CSS apropiada según el estado de carga (SOC)
  // Esto controla los colores y animaciones de la batería
  const getBatteryClass = (soc: number): string => {
    if (soc < CONFIG.DASHBOARD.lowBatteryThreshold) return 'low';      // Rojo: < 20%
    if (soc < CONFIG.DASHBOARD.mediumBatteryThreshold) return 'medium'; // Amarillo: 20% - 50%
    return '';                                                           // Verde: >= 50%
  };

  // ========== FUNCIÓN: MENSAJE DE ESTADO DESCRIPTIVO ==========
  // Retorna el texto y emoji apropiado según el nivel de carga
  const getBatteryStatus = (soc: number): string => {
    if (soc < CONFIG.DASHBOARD.lowBatteryThreshold) {
      return '⚠️ Batería Baja - Requiere Carga Inmediata';
    } else if (soc < CONFIG.DASHBOARD.mediumBatteryThreshold) {
      return '⚡ Batería Media - Considere Cargar Pronto';
    } else if (soc < 80) {
      return '✅ Batería en Buen Estado';
    } else if (soc < 95) {
      return '🔋 Batería con Buena Carga';
    } else {
      return '💯 Batería Completamente Cargada';
    }
  };

  // ========== FUNCIÓN: ESTADO ACTUAL (CARGANDO/DESCARGANDO) ==========
  // Determina si la batería está cargando, descargando o en reposo
  // Retorna un objeto con icono, texto y color para el indicador
  const getCurrentState = (current: number) => {
    if (current < -0.1) {
      // Corriente negativa < -0.1A = cargando
      return { icon: '⚡', text: 'Cargando', color: '#4CAF50' };
    } else if (current > 0.1) {
      // Corriente positiva > 0.1A = descargando
      return { icon: '🔋', text: 'Descargando', color: '#ff9800' };
    } else {
      // Entre -0.1A y +0.1A = sin actividad significativa
      return { icon: '💤', text: 'Reposo', color: '#2196F3' };
    }
  };

  // ========== VARIABLES AUXILIARES ==========
  // Extraer valores con valores por defecto seguros
  const soc = batteryData?.soc || 0;                    // Estado de carga (0-100%)
  const voltage = batteryData?.voltage || 0;            // Voltaje en V
  const current = batteryData?.current || 0;            // Corriente en A
  const timeFull = batteryData?.time_to_full || -1;     // Tiempo para carga completa
  const timeEmpty = batteryData?.time_to_empty || -1;   // Tiempo hasta descarga total
  
  // Calcular valores derivados
  const batteryClass = getBatteryClass(soc);            // Clase CSS para colores
  const currentState = getCurrentState(current);        // Estado actual (cargando/descargando)
  const showAlert = soc < CONFIG.DASHBOARD.lowBatteryThreshold && batteryData !== null; // Mostrar alerta si SOC < 20%

  // ========== RENDERIZADO DEL COMPONENTE ==========
  return (
    <div className="container">
      {/* ===== ENCABEZADO ===== */}
      <header>
        <h1>🔋 Monitor de Batería</h1>
        <p className="subtitle">Sistema 24V 100Ah - Monitoreo en Tiempo Real</p>
        
        {/* Indicador de conexión MQTT */}
        <div className="connection-indicator">
          {/* Punto verde/rojo según estado de conexión */}
          <div className={`status-dot ${isConnected ? 'connected' : ''}`}></div>
          <span>{connectionStatus}</span>
        </div>
      </header>

      <div className="dashboard">
        {/* ===== SECCIÓN: VISUALIZACIÓN DE BATERÍA ===== */}
        {/* Muestra la batería animada con líquido */}
        <div className="battery-section">
          <div className="battery-container">
            {/* Cuerpo de la batería con líquido animado */}
            <div className="battery-shell">
              <div 
                className={`battery-level ${batteryClass}`}
                style={{ height: `${soc}%` }}  // Altura = porcentaje de carga
              >
                {/* Efecto de olas/líquido */}
                <div className="battery-liquid"></div>
                {/* Texto del porcentaje dentro de la batería */}
                <span className="soc-text">{soc.toFixed(1)}%</span>
              </div>
            </div>
            {/* Terminal positivo de la batería */}
            <div className="battery-cap"></div>
          </div>
          
          {/* Información textual del estado de carga */}
          <div className="battery-info">
            <h2>Estado de Carga</h2>
            {/* Barra de progreso horizontal */}
            <div className="progress-bar">
              <div 
                className={`progress-fill ${batteryClass}`}
                style={{ width: `${soc}%` }}
              ></div>
            </div>
            {/* Mensaje descriptivo del estado */}
            <p className="status-text">
              {batteryData ? getBatteryStatus(soc) : 'Esperando datos...'}
            </p>
          </div>
        </div>

        {/* ===== SECCIÓN: MÉTRICAS PRINCIPALES ===== */}
        {/* Grid de 4 tarjetas con las mediciones principales */}
        <div className="metrics-grid">
          {/* TARJETA 1: Voltaje */}
          <div className="metric-card voltage-card">
            <div className="metric-header">
              <div className="metric-icon">⚡</div>
              <span className="metric-label">Voltaje</span>
            </div>
            <div className="metric-value">{voltage.toFixed(2)}V</div>
            {/* Rango válido para batería de plomo-ácido 24V */}
            <div className="metric-range">20.8V - 26.5V</div>
          </div>

          {/* TARJETA 2: Corriente */}
          <div className="metric-card current-card">
            <div className="metric-header">
              <div className="metric-icon">🔌</div>
              <span className="metric-label">Corriente</span>
            </div>
            {/* Mostramos el valor absoluto (sin signo negativo) */}
            <div className="metric-value">{Math.abs(current).toFixed(2)}A</div>
            {/* Indicador de cargando/descargando con color dinámico */}
            <div className="metric-state" style={{ color: currentState.color }}>
              {currentState.icon} {currentState.text}
            </div>
          </div>

          {/* TARJETA 3: Tiempo de Carga */}
          <div className="metric-card time-card">
            <div className="metric-header">
              <div className="metric-icon">⏱️</div>
              <span className="metric-label">Tiempo de Carga</span>
            </div>
            {/* Tiempo estimado para llegar a 100% (calculado por ESP32) */}
            <div className="metric-value">{formatTime(timeFull)}</div>
            <div className="metric-sublabel">Hasta 100%</div>
          </div>

          {/* TARJETA 4: Autonomía */}
          <div className="metric-card autonomy-card">
            <div className="metric-header">
              <div className="metric-icon">⏳</div>
              <span className="metric-label">Autonomía</span>
            </div>
            {/* Tiempo estimado hasta descarga completa (calculado por ESP32) */}
            <div className="metric-value">{formatTime(timeEmpty)}</div>
            <div className="metric-sublabel">Tiempo restante</div>
          </div>
        </div>

        {/* ===== SECCIÓN: PANEL DE INFORMACIÓN ===== */}
        {/* Especificaciones técnicas del sistema */}
        <div className="info-panel">
          <h3>📋 Especificaciones del Sistema</h3>
          <div className="specs-grid">
            <div className="spec">
              <div className="spec-label">Capacidad</div>
              <div className="spec-value">100Ah</div>
            </div>
            <div className="spec">
              <div className="spec-label">Voltaje Nominal</div>
              <div className="spec-value">24V</div>
            </div>
            <div className="spec">
              <div className="spec-label">Voltaje Máximo</div>
              <div className="spec-value">26.5V</div>
            </div>
            <div className="spec">
              <div className="spec-label">Voltaje Mínimo</div>
              <div className="spec-value">20.8V</div>
            </div>
            <div className="spec">
              <div className="spec-label">Shunt</div>
              {/* Shunt de 50A con caída de voltaje de 75mV */}
              <div className="spec-value">50A/75mV</div>
            </div>
            <div className="spec">
              <div className="spec-label">Sensor</div>
              {/* Sensor de corriente/voltaje INA219 de alta precisión */}
              <div className="spec-value">INA219</div>
            </div>
          </div>
        </div>

        {/* ===== ALERTA DE BATERÍA BAJA ===== */}
        {/* Solo se muestra cuando SOC < 20% */}
        {showAlert && (
          <div className="alert-box">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>ALERTA: Nivel de Batería Bajo</strong>
              <p>Conecta el cargador inmediatamente</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== PIE DE PÁGINA ===== */}
      <footer>
        <div className="footer-content">
          <p>
            {/* Timestamp de la última actualización recibida del ESP32 */}
            <span>Última actualización: <strong>{lastUpdate}</strong></span>
          </p>
          <p className="credits">
            {/* Información del sistema */}
            Powered by ESP32 + HiveMQ Cloud • Monitoreo 24/7
          </p>
          <p className="telegram-info">
            {/* Bot de Telegram para alertas remotas */}
            📱 Bot de Telegram: <strong>@mi_battery_monitor_bot</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
