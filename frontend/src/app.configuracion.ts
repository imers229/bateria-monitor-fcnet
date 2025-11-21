// ============================================================================
// CONFIGURACIÓN DE LA APLICACIÓN - ANGULAR 19
// ============================================================================
// Define los providers (servicios) globales de la aplicación.
// 
// Providers configurados:
// 1. Zone Change Detection: Optimiza la detección de cambios con event coalescing
//    (agrupa eventos similares para reducir ciclos de detección)
// 2. Animations: Habilita el motor de animaciones de Angular
// ============================================================================

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfiguracion: ApplicationConfig = {
  providers: [
    // Optimizar detección de cambios agrupando eventos
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Habilitar animaciones de Angular (para futuras mejoras)
    provideAnimations()
  ]
};
