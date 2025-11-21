
// ============================================================================
// Este es el componente principal que Angular carga al iniciar la aplicación.
// Su única función es renderizar el componente MonitorBateriaComponente.
// 
// Arquitectura:
// - Componente standalone (no requiere módulo)
// - Usa el selector 'app-root' que coincide con <app-root> en index.html
// - Importa y renderiza MonitorBateriaComponente
// ============================================================================

import { Component } from '@angular/core';
import { MonitorBateriaComponente } from './componentes/monitor-bateria.componente';

@Component({
  selector: 'app-root',           // Selector CSS que coincide con index.html
  standalone: true,                // Componente standalone (Angular 19)
  imports: [MonitorBateriaComponente], // Importar componente hijo
  template: '<app-monitor-bateria></app-monitor-bateria>', // Template inline simple
  styles: []                       // Sin estilos propios
})
export class AppComponente {
  /** Título de la aplicación */
  title = 'Monitor de Batería FCNET';
}
