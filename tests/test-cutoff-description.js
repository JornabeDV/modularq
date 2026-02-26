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

// Función para mostrar ejemplos de descripciones
function showCutoffDescriptionExamples() {
  log('\n📝 Ejemplos de Descripciones de Corte Automático:', 'blue');
  
  const examples = [
    {
      task: 'Crear botón de login',
      estimated: 1,
      worked: 1.5,
      description: 'Corte automático: Tarea excedió límite de tiempo (1.20h). Trabajado: 1.50h. Sistema completó automáticamente.'
    },
    {
      task: 'Desarrollar módulo completo',
      estimated: 8,
      worked: 10,
      description: 'Corte automático: Tarea excedió límite de tiempo (9.60h). Trabajado: 10.00h. Sistema completó automáticamente.'
    },
    {
      task: 'Tarea sin estimación',
      estimated: null,
      worked: 2.5,
      description: 'Corte automático: Tarea excedió límite de tiempo (2.00h). Trabajado: 2.50h. Sistema completó automáticamente.'
    }
  ];
  
  examples.forEach((example, index) => {
    log(`\n${index + 1}. ${example.task}`, 'white');
    log(`   Estimado: ${example.estimated || 'N/A'} horas`, 'white');
    log(`   Trabajado: ${example.worked} horas`, 'white');
    log(`   Descripción:`, 'cyan');
    log(`   "${example.description}"`, 'yellow');
  });
}

// Función para mostrar qué se actualiza en la base de datos
function showDatabaseUpdates() {
  log('\n🗄️ Actualizaciones en Base de Datos:', 'blue');
  
  log('\n📋 Tabla: time_entries', 'cyan');
  log('   ✅ end_time = timestamp actual', 'green');
  log('   ✅ hours = horas de la sesión', 'green');
  log('   ✅ description = "Corte automático: Tarea excedió límite..."', 'green');
  log('   ✅ updated_at = timestamp actual', 'green');
  
  log('\n📋 Tabla: project_tasks', 'cyan');
  log('   ✅ status = "completed"', 'green');
  log('   ✅ end_date = timestamp actual', 'green');
  log('   ✅ actual_hours = horas totales trabajadas', 'green');
  log('   ✅ progress_percentage = 100', 'green');
  log('   ✅ updated_at = timestamp actual', 'green');
}

// Función para mostrar cómo verificar en la base de datos
function showDatabaseVerification() {
  log('\n🔍 Cómo Verificar en Base de Datos:', 'blue');
  
  log('\n📊 Query para verificar time_entries:', 'cyan');
  log('   SELECT id, task_id, start_time, end_time, hours, description', 'white');
  log('   FROM time_entries', 'white');
  log('   WHERE task_id = \'tu-task-id\' AND end_time IS NOT NULL;', 'white');
  
  log('\n📊 Query para verificar project_tasks:', 'cyan');
  log('   SELECT id, task_id, status, end_date, actual_hours, progress_percentage', 'white');
  log('   FROM project_tasks', 'white');
  log('   WHERE task_id = \'tu-task-id\' AND status = \'completed\';', 'white');
  
  log('\n📊 Query para verificar corte automático:', 'cyan');
  log('   SELECT te.description, pt.status, pt.actual_hours', 'white');
  log('   FROM time_entries te', 'white');
  log('   JOIN project_tasks pt ON te.task_id = pt.task_id', 'white');
  log('   WHERE te.description LIKE \'%Corte automático%\'', 'white');
  log('   AND pt.status = \'completed\';', 'white');
}

// Función para mostrar el flujo completo
function showCompleteFlow() {
  log('\n🔄 Flujo Completo del Corte Automático:', 'blue');
  
  log('\n1️⃣ Detección:', 'cyan');
  log('   - Cron job ejecuta cada 5 minutos', 'white');
  log('   - Verifica sesiones activas', 'white');
  log('   - Calcula tiempo trabajado', 'white');
  log('   - Compara con límite (estimado + 20%)', 'white');
  
  log('\n2️⃣ Corte Automático:', 'cyan');
  log('   - Si excede límite: CORTE AUTOMÁTICO', 'white');
  log('   - Actualiza project_tasks como completada', 'white');
  log('   - Finaliza time_entries con descripción', 'white');
  log('   - Registra razón del corte', 'white');
  
  log('\n3️⃣ Resultado:', 'cyan');
  log('   - Tarea marcada como completada', 'white');
  log('   - Sesión terminada con descripción', 'white');
  log('   - Operario no puede continuar', 'white');
  log('   - Trazabilidad completa del corte', 'white');
}

// Función para mostrar ventajas de la descripción
function showDescriptionBenefits() {
  log('\n✅ Ventajas de la Descripción:', 'blue');
  
  log('\n🔍 Trazabilidad:', 'cyan');
  log('   - Saber exactamente por qué se cortó', 'white');
  log('   - Ver límite vs tiempo trabajado', 'white');
  log('   - Identificar si fue automático o manual', 'white');
  
  log('\n📊 Auditoría:', 'cyan');
  log('   - Historial completo de cortes', 'white');
  log('   - Análisis de patrones de tiempo', 'white');
  log('   - Identificar tareas problemáticas', 'white');
  
  log('\n🎯 Mejora Continua:', 'cyan');
  log('   - Ajustar estimaciones si es necesario', 'white');
  log('   - Identificar tareas que siempre exceden', 'white');
  log('   - Optimizar procesos de trabajo', 'white');
}

// Función principal
async function runDescriptionDemo() {
  log('📝 ModulArq - Descripción del Corte Automático', 'bold');
  log('==============================================', 'bold');
  
  // 1. Mostrar ejemplos de descripciones
  showCutoffDescriptionExamples();
  
  // 2. Mostrar actualizaciones en BD
  showDatabaseUpdates();
  
  // 3. Mostrar cómo verificar
  showDatabaseVerification();
  
  // 4. Mostrar flujo completo
  showCompleteFlow();
  
  // 5. Mostrar ventajas
  showDescriptionBenefits();
  
  // Resumen
  log('\n📊 Resumen:', 'bold');
  log('==========', 'bold');
  
  log('✅ Descripción agregada al campo "description" de time_entries', 'green');
  log('✅ Formato: "Corte automático: Tarea excedió límite de tiempo (X.XXh). Trabajado: Y.YYh. Sistema completó automáticamente."', 'green');
  log('✅ Trazabilidad completa del corte automático', 'green');
  log('✅ Auditoría y análisis de patrones de tiempo', 'green');
  
  log('\n🎯 Próximos Pasos:', 'blue');
  log('   1. Probar con tarea real que exceda límite', 'white');
  log('   2. Verificar descripción en time_entries', 'white');
  log('   3. Confirmar que project_tasks se completó', 'white');
  log('   4. Analizar patrones de corte automático', 'white');
}

// Ejecutar
if (require.main === module) {
  runDescriptionDemo().catch(error => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDescriptionDemo, showCutoffDescriptionExamples };
