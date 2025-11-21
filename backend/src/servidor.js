/**
 * SERVIDOR PRINCIPAL
 * ==================
 * Punto de entrada del backend
 * - Inicia servidor Express en puerto 3000
 * - Conecta al broker MQTT (HiveMQ Cloud)
 * - Inicia bot de Telegram
 * - Expone API REST para el dashboard
 */

import express from 'express';
import cors from 'cors';
import { config } from './configuracion.js';
import { servicioMQTT } from './servicios/mqtt.servicio.js';
import { servicioTelegram } from './servicios/telegram.servicio.js';
import apiRouter from './api/controlador.js';

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors()); // Permitir peticiones desde el dashboard Angular
app.use(express.json()); // Parsear JSON en peticiones

// Rutas API
app.use('/api', apiRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    nombre: 'FCNET Battery Monitor Backend',
    version: '1.0.0',
    servicios: {
      mqtt: servicioMQTT.estaConectado() ? 'Conectado' : 'Desconectado',
      api: 'Activo'
    },
    endpoints: {
      estado: '/api/estado',
      salud: '/api/salud'
    }
  });
});

// Iniciar servicios
async function iniciarServicios() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  FCNET BATTERY MONITOR - BACKEND      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    // 1. Conectar a MQTT
    servicioMQTT.conectar();
    
    // Esperar 2 segundos para asegurar conexión
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Iniciar bot de Telegram
    servicioTelegram.iniciar();
    
    // 3. Iniciar servidor Express
    app.listen(config.servidor.puerto, () => {
      console.log(`\n🚀 Servidor Express iniciado`);
      console.log(`   Puerto: ${config.servidor.puerto}`);
      console.log(`   API: http://localhost:${config.servidor.puerto}/api`);
      console.log(`\n✅ Backend completamente operativo\n`);
    });
    
    // 4. Reconexión automática MQTT cada 5 minutos (por si se pierde conexión)
    setInterval(() => {
      if (!servicioMQTT.estaConectado()) {
        console.log('⟳ Reconectando MQTT (intervalo de mantenimiento)...');
        servicioMQTT.conectar();
      }
    }, 300000); // 5 minutos
    
  } catch (error) {
    console.error('❌ Error iniciando servicios:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Deteniendo servicios...');
  servicioMQTT.desconectar();
  servicioTelegram.detener();
  process.exit(0);
});

// Iniciar aplicación
iniciarServicios();
