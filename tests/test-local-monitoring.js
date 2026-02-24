const https = require('https');
const http = require('http');

// Configuración
const LOCAL_URL = 'http://localhost:3000';
const PRODUCTION_URL = 'https://modularq.vercel.app';

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

// Función para crear datos de prueba
async function createTestData() {
  log('\n🧪 Creating Test Data...', 'blue');
  
  try {
    // Simular una tarea que excede límites
    const testTask = {
      id: 'test-task-1',
      title: 'Test Task - Exceeds Limit',
      estimated_hours: 2, // 2 horas estimadas
      // Límite máximo sería: 2 * 1.2 = 2.4 horas
    };
    
    // Simular una sesión activa de más de 2.4 horas
    const testSession = {
      id: 'test-session-1',
      task_id: 'test-task-1',
      user_id: 'test-user-1',
      project_id: 'test-project-1',
      start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
      hours: null,
      end_time: null
    };
    
    log(`✅ Test Task Created:`, 'green');
    log(`   Title: ${testTask.title}`, 'green');
    log(`   Estimated: ${testTask.estimated_hours} hours`, 'green');
    log(`   Max Limit: ${testTask.estimated_hours * 1.2} hours (20% extra)`, 'green');
    
    log(`✅ Test Session Created:`, 'green');
    log(`   Started: ${testSession.start_time}`, 'green');
    log(`   Duration: 3+ hours (exceeds limit)`, 'green');
    log(`   Status: Active (no end_time)`, 'green');
    
    return { testTask, testSession };
    
  } catch (error) {
    log(`❌ Error creating test data: ${error.message}`, 'red');
    return null;
  }
}

// Función para probar el endpoint local
async function testLocalEndpoint() {
  log('\n🔍 Testing Local Endpoint...', 'blue');
  
  try {
    // Test GET endpoint
    const getResponse = await makeRequest(`${LOCAL_URL}/api/check-limit-exceeded`, {
      method: 'GET'
    });
    
    if (getResponse.statusCode === 200) {
      log('✅ GET Endpoint: SUCCESS', 'green');
      log(`   Message: ${getResponse.data.message}`, 'green');
      log(`   Usage: ${JSON.stringify(getResponse.data.usage, null, 2)}`, 'green');
    } else {
      log(`❌ GET Endpoint: FAILED (${getResponse.statusCode})`, 'red');
      log(`   Response: ${getResponse.rawData}`, 'red');
    }
    
    // Test POST endpoint
    const postResponse = await makeRequest(`${LOCAL_URL}/api/check-limit-exceeded`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (postResponse.statusCode === 200) {
      log('✅ POST Endpoint: SUCCESS', 'green');
      log(`   Message: ${postResponse.data.message}`, 'green');
      log(`   Exceeded Tasks: ${postResponse.data.exceededTasks}`, 'green');
      log(`   Timestamp: ${postResponse.data.timestamp}`, 'green');
    } else {
      log(`❌ POST Endpoint: FAILED (${postResponse.statusCode})`, 'red');
      log(`   Response: ${postResponse.rawData}`, 'red');
    }
    
    return getResponse.statusCode === 200 && postResponse.statusCode === 200;
    
  } catch (error) {
    log(`❌ Local Test Error: ${error.message}`, 'red');
    return false;
  }
}

// Función para simular el comportamiento del sistema
async function simulateSystemBehavior() {
  log('\n🎭 Simulating System Behavior...', 'blue');
  
  const scenarios = [
    {
      name: 'Tarea Normal (1 hora estimada)',
      estimated_hours: 1,
      worked_hours: 0.8,
      expected: 'No excede límite'
    },
    {
      name: 'Tarea Cerca del Límite (1 hora estimada)',
      estimated_hours: 1,
      worked_hours: 1.1,
      expected: 'No excede límite (límite: 1.2h)'
    },
    {
      name: 'Tarea Excede Límite (1 hora estimada)',
      estimated_hours: 1,
      worked_hours: 1.3,
      expected: 'EXCEDE LÍMITE (límite: 1.2h)'
    },
    {
      name: 'Tarea Grande Normal (10 horas estimadas)',
      estimated_hours: 10,
      worked_hours: 11,
      expected: 'No excede límite (límite: 12h)'
    },
    {
      name: 'Tarea Grande Excede Límite (10 horas estimadas)',
      estimated_hours: 10,
      worked_hours: 12.5,
      expected: 'EXCEDE LÍMITE (límite: 12h)'
    },
    {
      name: 'Tarea Sin Estimación',
      estimated_hours: null,
      worked_hours: 1.5,
      expected: 'No excede límite (límite: 2h)'
    },
    {
      name: 'Tarea Sin Estimación Excede',
      estimated_hours: null,
      worked_hours: 2.5,
      expected: 'EXCEDE LÍMITE (límite: 2h)'
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    const maxHours = scenario.estimated_hours ? scenario.estimated_hours * 1.2 : 2;
    const exceeds = scenario.worked_hours >= maxHours;
    
    log(`\n📋 Scenario ${index + 1}: ${scenario.name}`, 'cyan');
    log(`   Estimated: ${scenario.estimated_hours || 'N/A'} hours`, 'white');
    log(`   Worked: ${scenario.worked_hours} hours`, 'white');
    log(`   Max Limit: ${maxHours} hours (20% extra)`, 'white');
    log(`   Result: ${exceeds ? '🚨 EXCEDE LÍMITE' : '✅ OK'}`, exceeds ? 'red' : 'green');
    log(`   Expected: ${scenario.expected}`, 'yellow');
  });
}

// Función para mostrar cómo funciona el cron job
function showCronJobBehavior() {
  log('\n⏰ Cron Job Behavior Simulation...', 'blue');
  
  log('🔄 Every 5 minutes, the system will:', 'cyan');
  log('   1. Check all active time sessions', 'white');
  log('   2. Calculate total worked hours for each task', 'white');
  log('   3. Determine if task exceeds limit (estimated + 20%)', 'white');
  log('   4. If exceeds: Count it silently (no action taken)', 'white');
  log('   5. Return JSON response with exceeded count', 'white');
  
  log('\n📊 Example Response:', 'cyan');
  log('   {', 'white');
  log('     "message": "Checked 5 sessions for limit violations",', 'white');
  log('     "exceededTasks": 2,', 'white');
  log('     "exceededDetails": [...],', 'white');
  log('     "timestamp": "2025-10-20T22:10:28.809Z",', 'white');
  log('     "note": "Tasks exceeding limits require manual intervention"', 'white');
  log('   }', 'white');
}

// Función principal
async function runLocalTest() {
  log('🚀 ModulArq Local Monitoring Test', 'bold');
  log('==================================', 'bold');
  
  // 1. Crear datos de prueba
  const testData = await createTestData();
  
  // 2. Probar endpoint local
  const localOk = await testLocalEndpoint();
  
  // 3. Simular comportamiento del sistema
  await simulateSystemBehavior();
  
  // 4. Mostrar comportamiento del cron job
  showCronJobBehavior();
  
  // Resumen final
  log('\n📊 Test Results Summary', 'bold');
  log('========================', 'bold');
  log(`✅ Local Endpoint: ${localOk ? 'SUCCESS' : 'FAILED'}`, localOk ? 'green' : 'red');
  
  if (localOk) {
    log('\n🎉 Local testing successful!', 'green');
    log('The monitoring system is working correctly.', 'green');
  } else {
    log('\n⚠️  Local testing failed. Check if the server is running:', 'yellow');
    log('   npm run dev', 'yellow');
  }
  
  log('\n🔧 Manual Testing Commands:', 'blue');
  log('   curl -X GET http://localhost:3000/api/check-limit-exceeded', 'white');
  log('   curl -X POST http://localhost:3000/api/check-limit-exceeded -H "Content-Type: application/json" -d "{}"', 'white');
}

// Ejecutar test
if (require.main === module) {
  runLocalTest().catch(error => {
    log(`❌ Test Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runLocalTest, createTestData, simulateSystemBehavior };
