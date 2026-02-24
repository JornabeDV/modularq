const https = require('https');
const http = require('http');

// Configuración
const LOCAL_URL = 'http://localhost:3000';

// Función para hacer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función para colorear output
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

// Función para simular datos que exceden límites
function createExceededLimitScenario() {
  log('\n🎭 Simulando Escenario de Corte Automático...', 'blue');
  
  const scenarios = [
    {
      name: 'Tarea Pequeña - Excede Límite',
      task: {
        id: 'task-1',
        title: 'Crear botón de login',
        estimated_hours: 1
      },
      session: {
        id: 'session-1',
        start_time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 horas atrás
        hours: null,
        end_time: null
      },
      expected: {
        maxHours: 1.2, // 1 + 20%
        workedHours: 1.5,
        shouldExceed: true,
        action: 'CORTE AUTOMÁTICO'
      }
    },
    {
      name: 'Tarea Grande - Excede Límite',
      task: {
        id: 'task-2',
        title: 'Desarrollar módulo completo',
        estimated_hours: 8
      },
      session: {
        id: 'session-2',
        start_time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
        hours: null,
        end_time: null
      },
      expected: {
        maxHours: 9.6, // 8 + 20%
        workedHours: 10,
        shouldExceed: true,
        action: 'CORTE AUTOMÁTICO'
      }
    },
    {
      name: 'Tarea Sin Estimación - Excede Límite',
      task: {
        id: 'task-3',
        title: 'Tarea sin tiempo estimado',
        estimated_hours: null
      },
      session: {
        id: 'session-3',
        start_time: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 horas atrás
        hours: null,
        end_time: null
      },
      expected: {
        maxHours: 2, // Límite por defecto
        workedHours: 2.5,
        shouldExceed: true,
        action: 'CORTE AUTOMÁTICO'
      }
    },
    {
      name: 'Tarea Normal - No Excede',
      task: {
        id: 'task-4',
        title: 'Revisar código',
        estimated_hours: 2
      },
      session: {
        id: 'session-4',
        start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
        hours: null,
        end_time: null
      },
      expected: {
        maxHours: 2.4, // 2 + 20%
        workedHours: 1,
        shouldExceed: false,
        action: 'CONTINUAR MONITOREANDO'
      }
    }
  ];
  
  return scenarios;
}

// Función para mostrar escenarios
function showScenarios(scenarios) {
  log('\n📋 Escenarios de Testing:', 'cyan');
  
  scenarios.forEach((scenario, index) => {
    log(`\n${index + 1}. ${scenario.name}`, 'white');
    log(`   Tarea: ${scenario.task.title}`, 'white');
    log(`   Estimado: ${scenario.task.estimated_hours || 'N/A'} horas`, 'white');
    log(`   Límite: ${scenario.expected.maxHours} horas`, 'white');
    log(`   Trabajado: ${scenario.expected.workedHours} horas`, 'white');
    log(`   Resultado: ${scenario.expected.shouldExceed ? '🚨 EXCEDE' : '✅ OK'}`, 
        scenario.expected.shouldExceed ? 'red' : 'green');
    log(`   Acción: ${scenario.expected.action}`, 
        scenario.expected.shouldExceed ? 'red' : 'green');
  });
}

// Función para simular respuesta del endpoint
async function simulateEndpointResponse() {
  log('\n🔄 Simulando Respuesta del Endpoint...', 'blue');
  
  try {
    const response = await makeRequest(`${LOCAL_URL}/api/check-limit-exceeded`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (response.statusCode === 200) {
      log('✅ Endpoint Response: SUCCESS', 'green');
      log(`   Message: ${response.data.message}`, 'green');
      log(`   Exceeded Tasks: ${response.data.exceededTasks}`, 'green');
      log(`   Timestamp: ${response.data.timestamp}`, 'green');
      
      if (response.data.exceededDetails && response.data.exceededDetails.length > 0) {
        log(`\n📋 Detalles de Tareas Excedidas:`, 'cyan');
        response.data.exceededDetails.forEach((task, index) => {
          log(`   ${index + 1}. ${task.taskTitle}`, 'white');
          log(`      Total: ${task.totalHours}h / Max: ${task.maxHours}h`, 'white');
          log(`      Exceso: ${task.excessHours}h`, 'red');
          log(`      Acción: CORTE AUTOMÁTICO`, 'red');
        });
      } else {
        log(`\n✅ No hay tareas que excedan límites`, 'green');
      }
      
      return response.data;
    } else {
      log(`❌ Endpoint Error (${response.statusCode}): ${response.rawData}`, 'red');
      return null;
    }
    
  } catch (error) {
    log(`❌ Connection Error: ${error.message}`, 'red');
    return null;
  }
}

// Función para mostrar cómo testear con datos reales
function showRealDataTesting() {
  log('\n🗄️ Cómo Testear con Datos Reales:', 'blue');
  
  log('\n1️⃣ Crear Tarea de Prueba:', 'cyan');
  log('   - Ir a tu aplicación ModulArq', 'white');
  log('   - Crear una tarea con tiempo estimado (ej: 1 hora)', 'white');
  log('   - Iniciar sesión de tiempo', 'white');
  log('   - Dejar corriendo por más de 1.2 horas', 'white');
  
  log('\n2️⃣ Verificar Corte Automático:', 'cyan');
  log('   - Esperar 5 minutos (próximo cron job)', 'white');
  log('   - Verificar que la tarea se marcó como completada', 'white');
  log('   - Verificar que la sesión se terminó', 'white');
  
  log('\n3️⃣ Verificar en Base de Datos:', 'cyan');
  log('   - project_tasks.status = "completed"', 'white');
  log('   - project_tasks.end_date = timestamp actual', 'white');
  log('   - project_tasks.actual_hours = horas trabajadas', 'white');
  log('   - time_entries.end_time = timestamp actual', 'white');
}

// Función para mostrar comandos de testing
function showTestingCommands() {
  log('\n🔧 Comandos de Testing:', 'blue');
  
  log('\n📱 Test Manual (curl):', 'cyan');
  log('   curl -X POST http://localhost:3000/api/check-limit-exceeded \\', 'white');
  log('     -H "Content-Type: application/json" \\', 'white');
  log('     -d "{}"', 'white');
  
  log('\n📱 Test Manual (PowerShell):', 'cyan');
  log('   Invoke-RestMethod -Uri "http://localhost:3000/api/check-limit-exceeded" \\', 'white');
  log('     -Method POST -Body "{}" -ContentType "application/json"', 'white');
  
  log('\n📱 Test con Scheduler:', 'cyan');
  log('   npm run monitor:start    # Cada 5 minutos', 'white');
  log('   npm run monitor:once     # Una vez', 'white');
  
  log('\n📱 Test en Producción:', 'cyan');
  log('   curl -X POST https://ModulArq.vercel.app/api/check-limit-exceeded \\', 'white');
  log('     -H "Content-Type: application/json" \\', 'white');
  log('     -d "{}"', 'white');
}

// Función principal
async function runTestingDemo() {
  log('🧪 ModulArq - Testing del Sistema de Corte Automático', 'bold');
  log('====================================================', 'bold');
  
  // 1. Mostrar escenarios
  const scenarios = createExceededLimitScenario();
  showScenarios(scenarios);
  
  // 2. Simular respuesta del endpoint
  const response = await simulateEndpointResponse();
  
  // 3. Mostrar cómo testear con datos reales
  showRealDataTesting();
  
  // 4. Mostrar comandos de testing
  showTestingCommands();
  
  // Resumen
  log('\n📊 Resumen del Testing:', 'bold');
  log('======================', 'bold');
  
  if (response) {
    log(`✅ Endpoint funcionando correctamente`, 'green');
    log(`📊 Tareas excedidas: ${response.exceededTasks}`, 'green');
    log(`⏰ Última verificación: ${response.timestamp}`, 'green');
  } else {
    log(`❌ Endpoint no disponible`, 'red');
    log(`💡 Asegúrate de que el servidor esté corriendo: npm run dev`, 'yellow');
  }
  
  log('\n🎯 Próximos Pasos:', 'blue');
  log('   1. Crear tarea de prueba en la aplicación', 'white');
  log('   2. Iniciar sesión de tiempo', 'white');
  log('   3. Dejar corriendo más del límite', 'white');
  log('   4. Verificar corte automático', 'white');
}

// Ejecutar
if (require.main === module) {
  runTestingDemo().catch(error => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTestingDemo, createExceededLimitScenario };
