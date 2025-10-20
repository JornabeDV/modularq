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

// Función para ejecutar monitoreo
async function runMonitoring() {
  const timestamp = new Date().toLocaleString();
  log(`\n🔄 [${timestamp}] Ejecutando monitoreo de tareas...`, 'blue');
  
  try {
    const response = await makeRequest(`${LOCAL_URL}/api/check-limit-exceeded`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (response.statusCode === 200) {
      const exceededTasks = response.data.exceededTasks || 0;
      
      if (exceededTasks > 0) {
        log(`🚨 ALERTA: ${exceededTasks} tareas exceden límites`, 'red');
        
        if (response.data.exceededDetails) {
          response.data.exceededDetails.forEach((task, index) => {
            log(`   ${index + 1}. ${task.taskTitle}: ${task.totalHours}h / ${task.maxHours}h`, 'white');
          });
        }
      } else {
        log(`✅ Monitoreo completado - Sin tareas excedidas`, 'green');
      }
      
      log(`📊 Timestamp: ${response.data.timestamp}`, 'cyan');
      return true;
    } else {
      log(`❌ Error en monitoreo (${response.statusCode}): ${response.rawData}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error de conexión: ${error.message}`, 'red');
    return false;
  }
}

// Función para configurar scheduler
function setupScheduler(intervalMinutes = 5) {
  log(`⏰ Configurando scheduler cada ${intervalMinutes} minutos...`, 'blue');
  log('Presiona Ctrl+C para detener', 'yellow');
  
  let executionCount = 0;
  let successCount = 0;
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const interval = setInterval(async () => {
    executionCount++;
    const success = await runMonitoring();
    if (success) successCount++;
    
    log(`📈 Estadísticas: ${successCount}/${executionCount} ejecuciones exitosas`, 'cyan');
    log(`⏳ Próxima ejecución en ${intervalMinutes} minutos...`, 'yellow');
  }, intervalMs);
  
  // Ejecutar inmediatamente
  runMonitoring();
  
  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    log('\n\n🛑 Deteniendo scheduler...', 'yellow');
    clearInterval(interval);
    log(`📊 Total ejecuciones: ${executionCount}`, 'blue');
    log(`✅ Exitosas: ${successCount}`, 'green');
    log(`❌ Fallidas: ${executionCount - successCount}`, 'red');
    log('👋 ¡Hasta luego!', 'green');
    process.exit(0);
  });
}

// Función para mostrar opciones de configuración
function showConfigurationOptions() {
  log('\n🔧 Opciones de Configuración del Scheduler', 'bold');
  log('==========================================', 'bold');
  
  log('\n1️⃣ Node.js Scheduler (Recomendado):', 'cyan');
  log('   ✅ Funciona en local y producción', 'green');
  log('   ✅ Fácil de configurar y debuggear', 'green');
  log('   ✅ Flexible (cualquier intervalo)', 'green');
  log('   ✅ Logs detallados', 'green');
  log('   ❌ Requiere proceso corriendo', 'yellow');
  
  log('\n2️⃣ Cron del Sistema (Linux/Mac):', 'cyan');
  log('   ✅ Ejecuta automáticamente', 'green');
  log('   ✅ No requiere proceso activo', 'green');
  log('   ✅ Muy confiable', 'green');
  log('   ❌ Solo funciona en Linux/Mac', 'red');
  log('   ❌ Más difícil de configurar', 'yellow');
  
  log('\n3️⃣ Task Scheduler (Windows):', 'cyan');
  log('   ✅ Ejecuta automáticamente', 'green');
  log('   ✅ No requiere proceso activo', 'green');
  log('   ✅ Interfaz gráfica', 'green');
  log('   ❌ Solo funciona en Windows', 'red');
  log('   ❌ Configuración compleja', 'yellow');
  
  log('\n4️⃣ Vercel Cron Jobs:', 'cyan');
  log('   ✅ Automático en producción', 'green');
  log('   ✅ No requiere servidor local', 'green');
  log('   ❌ No funciona en local', 'red');
  log('   ❌ Dependiente de Vercel', 'red');
  log('   ❌ Debugging difícil', 'red');
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const interval = parseInt(args[1]) || 5;
  
  log('🚀 ModularQ Task Monitoring Scheduler', 'bold');
  log('=====================================', 'bold');
  
  switch (command) {
    case 'start':
      log(`\n▶️ Iniciando scheduler cada ${interval} minutos...`, 'blue');
      setupScheduler(interval);
      break;
      
    case 'once':
      log('\n🎯 Ejecutando monitoreo una vez...', 'blue');
      await runMonitoring();
      break;
      
    case 'config':
      showConfigurationOptions();
      break;
      
    case 'help':
    default:
      log('\n📖 Comandos disponibles:', 'blue');
      log('   node scheduler.js start [interval]  # Iniciar scheduler (default: 5 min)', 'white');
      log('   node scheduler.js once             # Ejecutar una vez', 'white');
      log('   node scheduler.js config            # Mostrar opciones', 'white');
      log('   node scheduler.js help              # Mostrar ayuda', 'white');
      log('\n💡 Ejemplos:', 'cyan');
      log('   node scheduler.js start 1           # Cada 1 minuto', 'white');
      log('   node scheduler.js start 10          # Cada 10 minutos', 'white');
      log('   node scheduler.js once              # Ejecutar ahora', 'white');
      break;
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runMonitoring, setupScheduler };
