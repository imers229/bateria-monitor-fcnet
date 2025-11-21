/**
 * CONTROLADOR API
 * ===============
 * Define las rutas y lógica del API REST
 * Permite al dashboard consultar el estado de batería
 */

import express from 'express';
import { servicioMQTT } from '../servicios/mqtt.servicio.js';

const router = express.Router();

/**
 * GET /api/estado
 * Obtiene el último estado de batería almacenado en el backend
 * 
 * Respuesta:
 * {
 *   voltage: 24.5,
 *   current: -2.3,
 *   soc: 75.2,
 *   time_to_full: 3.5,
 *   time_to_empty: 0,
 *   timestamp: "2025-11-20T10:30:00.000Z",
 *   estado: "Cargando"
 * }
 */
router.get('/estado', (req, res) => {
  const estado = servicioMQTT.obtenerUltimoEstado();
  
  // Agregar información de conexión
  const respuesta = {
    ...estado,
    mqtt_conectado: servicioMQTT.estaConectado(),
    mensajes_recibidos: servicioMQTT.mensajesRecibidos
  };
  
  res.json(respuesta);
});

/**
 * GET /api/salud
 * Health check para verificar que el backend está funcionando
 * 
 * Respuesta:
 * {
 *   estado: "ok",
 *   mqtt: true,
 *   telegram: true,
 *   timestamp: "2025-11-20T10:30:00.000Z"
 * }
 */
router.get('/salud', (req, res) => {
  res.json({
    estado: 'ok',
    mqtt: servicioMQTT.estaConectado(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/healthz
 * Health check simple para Docker/Fly.io
 */
router.get('/healthz', (req, res) => {
  const mqttOk = servicioMQTT.estaConectado();
  res.status(mqttOk ? 200 : 503).json({ ok: mqttOk });
});

export default router;
