// ============================================================================
// MAIN.TS - ANGULAR 19 BOOTSTRAP
// ============================================================================

// ============================================================================
// MAIN.TS - ANGULAR 19 BOOTSTRAP
// ============================================================================
// Punto de entrada de la aplicación Angular.
// Bootstrapea (inicializa) el componente raíz de la aplicación.
// ============================================================================

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponente } from './app.componente';
import { appConfiguracion } from './app.configuracion';

// Inicializar la aplicación Angular con el componente raíz y su configuración
bootstrapApplication(AppComponente, appConfiguracion)
  .catch((err) => console.error('❌ Error al inicializar la aplicación:', err));
