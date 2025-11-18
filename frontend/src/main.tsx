// ============================================================================
// PUNTO DE ENTRADA DE LA APLICACIÓN REACT
// ============================================================================
// Este archivo es el punto de entrada principal de la aplicación.
// Se ejecuta cuando se carga index.html y monta la aplicación React en el DOM.
//
// Flujo de ejecución:
// 1. index.html carga este archivo (main.tsx)
// 2. Se obtiene el elemento <div id="root"> del HTML
// 3. Se crea la raíz de React en ese elemento
// 4. Se renderiza <App /> dentro de <StrictMode>
// 5. App.tsx renderiza BatteryDashboard.tsx
// ============================================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Montar la aplicación React en el elemento con id="root"
createRoot(document.getElementById('root')!).render(
  // StrictMode: modo estricto de React para detectar problemas potenciales
  // - Advierte sobre componentes con efectos secundarios inseguros
  // - Detecta APIs obsoletas
  // - Solo afecta en desarrollo, no en producción
  <StrictMode>
    <App />
  </StrictMode>,
)

