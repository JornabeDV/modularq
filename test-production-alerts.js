#!/usr/bin/env node

/**
 * Script para probar alertas en producción (usando endpoint público)
 * Uso: node test-production-alerts.js
 */

const https = require('https');

const PRODUCTION_URL = 'https://modularq.vercel.app';
const TEST_ALERTS_ENDPOINT = `${PRODUCTION_URL}/api/test-alerts-public`;
const HEALTH_ENDPOINT = `${PRODUCTION_URL}/api/health`;

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ModularQ-Test-Script/1.0',
        ...options.headers
      }
    };

    if (options.body) {
      const bodyString = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testHealthCheck() {
  log('\n🔍 Testing Health Check...', 'blue');
  
  try {
    const response = await makeRequest(HEALTH_ENDPOINT);
    
    if (response.statusCode === 200) {
      log('✅ Health Check: PASSED', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Response Time: ${response.data.responseTime}`, 'green');
      log(`   Environment: ${response.data.environment}`, 'green');
      
      if (response.data.checks) {
        log('   Checks:', 'green');
        Object.entries(response.data.checks).forEach(([key, check]) => {
          log(`     ${key}: ${check.status}`, 'green');
        });
      }
      
      return true;
    } else {
      log(`❌ Health Check: FAILED (${response.statusCode})`, 'red');
      log(`   Response: ${response.rawData}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health Check: ERROR - ${error.message}`, 'red');
    return false;
  }
}

async function testAlert(alertData) {
  log(`\n📧 Testing Alert: ${alertData.alertType} (${alertData.severity})`, 'blue');
  
  try {
    const response = await makeRequest(TEST_ALERTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-test-token': 'test-token-123'
      },
      body: alertData
    });
    
    if (response.statusCode === 200) {
      log('✅ Alert Sent: SUCCESS', 'green');
      log(`   Message ID: ${response.data.emailResult?.messageId || 'N/A'}`, 'green');
      log(`   Recipients: ${response.data.emailResult?.recipients?.join(', ') || 'N/A'}`, 'green');
      log(`   Simulated: ${response.data.emailResult?.simulated ? 'Yes' : 'No'}`, 'green');
      
      if (response.data.emailResult?.error) {
        log(`   ⚠️  Warning: ${response.data.emailResult.error}`, 'yellow');
      }
      
      return true;
    } else {
      log(`❌ Alert Failed: ${response.statusCode}`, 'red');
      log(`   Response: ${response.rawData}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Alert Error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 ModularQ Production Alert Testing (Public Endpoint)', 'bold');
  log('=====================================================', 'bold');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  
  if (!healthOk) {
    log('\n❌ Health check failed. Stopping tests.', 'red');
    process.exit(1);
  }
  
  // Test 2: Different alert types
  const testAlerts = [
    {
      alertType: 'Production Test (Public)',
      severity: 'info',
      message: 'Testing info alert via public endpoint',
      details: {
        environment: 'production',
        timestamp: new Date().toISOString(),
        test: true,
        endpoint: 'public'
      }
    },
    {
      alertType: 'Security Test',
      severity: 'warning',
      message: 'Testing security alert via public endpoint',
      details: {
        endpoint: 'public',
        security: true,
        environment: 'production'
      }
    }
  ];
  
  let successCount = 0;
  let totalCount = testAlerts.length;
  
  for (const alert of testAlerts) {
    const success = await testAlert(alert);
    if (success) successCount++;
    
    // Esperar un poco entre alertas para no saturar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen final
  log('\n📊 Test Results Summary', 'bold');
  log('========================', 'bold');
  log(`✅ Successful: ${successCount}/${totalCount}`, successCount === totalCount ? 'green' : 'yellow');
  log(`❌ Failed: ${totalCount - successCount}/${totalCount}`, totalCount - successCount > 0 ? 'red' : 'green');
  
  if (successCount === totalCount) {
    log('\n🎉 All tests passed! Check your email for alerts.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the logs above.', 'yellow');
  }
  
  log('\n📧 Expected emails:', 'blue');
  log('   - jorgebejarosa@gmail.com', 'blue');
  log('   - Subject: 🚨 ModularQ Alert - [SEVERITY]: [ALERT_TYPE]', 'blue');
  
  log('\n🔒 Security Note:', 'yellow');
  log('   - Public endpoint used for testing only', 'yellow');
  log('   - Production alerts require admin authentication', 'yellow');
}

// Ejecutar tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testHealthCheck, testAlert, runAllTests };
