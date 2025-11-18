// ============================================================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================================
// Este es el punto de entrada de la aplicación React.
// Renderiza el componente BatteryDashboard que contiene toda la lógica
// del dashboard de monitoreo de batería.
//
// Estructura de la aplicación:
// App.tsx (este archivo) → BatteryDashboard.tsx → Componentes visuales
// ============================================================================

import BatteryDashboard from './BatteryDashboard'

function App() {
  // Renderizar el dashboard completo
  // BatteryDashboard maneja:
  // - Conexión MQTT a HiveMQ
  // - Recepción de datos del ESP32
  // - Visualización de batería animada
  // - Métricas en tiempo real
  // - Alertas de batería baja
  return <BatteryDashboard />
}

export default App

