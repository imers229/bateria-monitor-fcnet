/*
  ESP32 - Monitor de Batería 24V 100Ah con MQTT
  FCNET - Sistema de Monitoreo en Tiempo Real
  
  MODO DE SIMULACIÓN - PARA PRUEBAS SIN HARDWARE
  
  Este código genera datos simulados realistas de una batería 24V 100Ah
  para probar el dashboard y conexión MQTT sin necesidad de conectar sensores.
  
  Simulación:
  - Voltaje: Varía entre 23V y 26V (simula carga/descarga)
  - Corriente: Alterna entre carga (-2A) y descarga (+3A)
  - SOC: Calculado automáticamente según voltaje
  - Tiempo de carga/descarga: Calculado según corriente
  
  Hardware necesario: SOLO ESP32 (sin INA219, sin sensores)
  Conexión: WiFi + MQTT (HiveMQ Cloud)
  
  NOTA: Telegram ahora está en el backend Node.js para mayor confiabilidad
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// WIFI
const char* ssid = "IMER SOTO - GoNet";
const char* password = "f42jN9#r";

// MQTT HIVEMQ CLOUD
const char* mqtt_server = "cdd0f3d0066146a385e294acd95f7868.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "admin";
const char* mqtt_password = "Admin123";
const char* mqtt_topic = "fcnet/battery/data";

// BATERÍA
static const float CAP_AH = 100.0f;
static const float V_MAX_FULL = 26.5f;
static const float V_MIN_EMPTY = 20.8f;

// OBJETOS
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// CONTROL MQTT
float lastSOC = -1, lastV = -1, lastI = -1;

// ============================================================================
// VARIABLES DE SIMULACIÓN
// ============================================================================
float simulatedVoltage = 24.5f;      // Voltaje inicial simulado (V)
float simulatedCurrent = 0.5f;       // Corriente inicial simulada (A)
bool simulationCharging = false;     // Estado: true=cargando, false=descargando
unsigned long lastSimulationUpdate = 0;
const long simulationInterval = 2000; // Actualizar simulación cada 2 segundos

// ============================================================================
// FUNCIONES DE SIMULACIÓN
// ============================================================================

/**
 * Actualiza los valores simulados de voltaje y corriente
 * Simula un ciclo realista de carga y descarga de batería
 */
void updateSimulation() {
  unsigned long currentMillis = millis();
  
  // Actualizar cada 2 segundos
  if (currentMillis - lastSimulationUpdate < simulationInterval) {
    return;
  }
  lastSimulationUpdate = currentMillis;
  
  // Simular carga/descarga alternada
  if (simulationCharging) {
    // MODO CARGA: Voltaje sube, corriente negativa
    simulatedVoltage += 0.05f;  // Incremento gradual
    simulatedCurrent = -2.0f + (random(-20, 20) / 100.0f); // -2A ± variación
    
    // Cambiar a descarga cuando llegue a ~26V
    if (simulatedVoltage >= 26.0f) {
      simulationCharging = false;
      Serial.println("📊 Simulación: Cambiando a DESCARGA");
    }
  } else {
    // MODO DESCARGA: Voltaje baja, corriente positiva
    simulatedVoltage -= 0.03f;  // Decremento gradual
    simulatedCurrent = 3.0f + (random(-30, 30) / 100.0f); // 3A ± variación
    
    // Cambiar a carga cuando llegue a ~23V
    if (simulatedVoltage <= 23.0f) {
      simulationCharging = true;
      Serial.println("📊 Simulación: Cambiando a CARGA");
    }
  }
  
  // Limitar valores a rangos realistas
  simulatedVoltage = constrain(simulatedVoltage, 22.0f, 27.0f);
  
  // Agregar ruido realista (±0.01V)
  float voltageNoise = (random(-10, 10) / 1000.0f);
  simulatedVoltage += voltageNoise;
}

// ============================================================================
// FUNCIONES DE LECTURA (SIMULADAS)
// ============================================================================

/**
 * Retorna el voltaje simulado de la batería
 * En modo real, esto leería el ADC del ESP32
 */
float readVin_V() {
  return simulatedVoltage;
}

/**
 * Retorna la corriente simulada
 * En modo real, esto leería el sensor INA219
 */
float readCurrent_A() {
  return simulatedCurrent;
}

// ============================================================================
// CÁLCULOS DE BATERÍA
// ============================================================================

/**
 * Calcula el Estado de Carga (SOC) basado en el voltaje
 * Interpolación lineal entre V_MIN_EMPTY y V_MAX_FULL
 */
float calculateSOC_voltage(float voltage) {
  float soc = 100.0f * (voltage - V_MIN_EMPTY) / (V_MAX_FULL - V_MIN_EMPTY);
  if (soc < 0.0f) soc = 0.0f;
  if (soc > 100.0f) soc = 100.0f;
  return soc;
}

/**
 * Estima el tiempo hasta carga completa en horas
 * Solo válido si está cargando (current < 0)
 */
float estimateTimeToFull_hours(float current_A, float soc_percent) {
  if (current_A >= 0.0f) return -1.0f;
  float ah_needed = CAP_AH * (100.0f - soc_percent) / 100.0f;
  return ah_needed / ((-current_A) * 0.95f);
}

float estimateTimeToEmpty_hours(float current_A, float soc_percent) {
  if (current_A <= 0.0f) return -1.0f;
  float ah_available = CAP_AH * soc_percent / 100.0f;
  return ah_available / current_A;
}

// CONEXIÓN WIFI
void setup_wifi() {
  Serial.print("Conectando WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi OK");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Error");
  }
}

// CONEXIÓN MQTT
void reconnectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 3) {
    Serial.print("Conectando HiveMQ... ");
    String clientId = "ESP32Battery_" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("✅ MQTT OK");
    } else {
      Serial.print("❌ Error: ");
      Serial.println(mqttClient.state());
      delay(5000);
      attempts++;
    }
  }
}

// SETUP
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n===== MONITOR BATERÍA 24V =====");
  Serial.println("FCNET - Sistema MQTT");
  Serial.println("⚠️ MODO SIMULACIÓN ⚠️");
  Serial.println("Datos generados sin hardware\n");
  
  // Inicializar variables de simulación
  simulatedVoltage = 24.5;
  simulatedCurrent = 2.5;
  simulationCharging = false;
  lastSimulationUpdate = 0;
  
  Serial.println("Simulación: 23V-26V ciclo");
  Serial.println("Corriente: ±2-3A alternando\n");
  
  setup_wifi();
  
  espClient.setInsecure();
  
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setKeepAlive(60);
  mqttClient.setBufferSize(512);
  
  Serial.println("\n✅ Sistema listo");
  Serial.println("📊 Publicando a MQTT cada 5s");
  Serial.println("🔌 " + String(mqtt_server));
  Serial.println("🤖 Bot de Telegram: Backend Node.js");
  Serial.println("================================\n");
}

// LOOP
void loop() {
  // Actualizar simulación cada 2 segundos
  updateSimulation();
  
  if (WiFi.status() != WL_CONNECTED) setup_wifi();
  
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();
  
  float V = readVin_V();
  float I = readCurrent_A();
  float SOC = calculateSOC_voltage(V);
  float t_full = estimateTimeToFull_hours(I, SOC);
  float t_empty = estimateTimeToEmpty_hours(I, SOC);

  // MQTT optimizado (10GB/mes)
  bool pub = false;
  if (lastSOC == -1) pub = true;
  if (abs(SOC - lastSOC) >= 0.5) pub = true;
  if (abs(V - lastV) >= 0.1) pub = true;
  if (abs(I - lastI) >= 0.2) pub = true;
  
  if (pub && mqttClient.connected()) {
    String json = "{\"voltage\":" + String(V, 2) + 
                  ",\"current\":" + String(I, 2) + 
                  ",\"soc\":" + String(SOC, 1) + 
                  ",\"time_to_full\":" + String(t_full, 1) + 
                  ",\"time_to_empty\":" + String(t_empty, 1) + "}";
    
    if (mqttClient.publish(mqtt_topic, json.c_str(), false)) {
      Serial.println("📤 " + json);
      lastSOC = SOC; lastV = V; lastI = I;
    }
  }
  
  Serial.printf("V=%.2fV I=%.2fA SOC=%.1f%% MQTT=%s\n", 
                V, I, SOC,
                mqttClient.connected() ? "✅" : "❌");
  
  delay(5000);
}
