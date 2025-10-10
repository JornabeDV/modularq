// Endpoint público para testing de alertas (solo desarrollo)
// app/api/test-alerts-public/route.ts

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configuración del transporter de email
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL_FROM || 'jorgebejarosa@gmail.com',
      pass: process.env.ALERT_EMAIL_PASSWORD || 'bjtb anak rhoz zern'
    }
  });
};

// Función para enviar alerta por email REAL
const sendEmailAlert = async (alertType: string, severity: string, message: string, details: any = {}) => {
  try {
    const transporter = createEmailTransporter();
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [];
    
    if (!recipients || recipients.length === 0) {
      throw new Error('No hay destinatarios configurados para email');
    }

    const mailOptions = {
      from: process.env.ALERT_EMAIL_FROM || 'ModularQ Alerts <jorgebejarosa@gmail.com>',
      to: recipients.join(', '),
      subject: `🚨 ModularQ Alert - ${severity.toUpperCase()}: ${alertType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">🚨 ModularQ Alert</h2>
            <p style="margin: 10px 0 0 0; color: #6c757d;">Sistema de Monitoreo</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">Detalles del Alerta</h3>
            
            <div style="margin-bottom: 15px;">
              <strong>Tipo:</strong> ${alertType}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Severidad:</strong> 
              <span style="padding: 4px 8px; border-radius: 4px; color: white; background: ${
                severity === 'critical' ? '#dc3545' : 
                severity === 'warning' ? '#ffc107' : '#17a2b8'
              };">${severity.toUpperCase()}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Mensaje:</strong> ${message}
            </div>
            
            ${details && Object.keys(details).length > 0 ? `
              <div style="margin-bottom: 15px;">
                <strong>Detalles:</strong>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>
              </div>
            ` : ''}
            
            <div style="margin-bottom: 15px;">
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>Este es un mensaje automático del sistema de monitoreo ModularQ</p>
          </div>
        </div>
      `,
      text: `
🚨 ModularQ Alert - ${severity.toUpperCase()}: ${alertType}

Mensaje: ${message}

${details && Object.keys(details).length > 0 ? `Detalles: ${JSON.stringify(details, null, 2)}` : ''}

Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'production'}

---
Sistema de Monitoreo ModularQ
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 EMAIL REAL ENVIADO:', {
      to: recipients.join(', '),
      subject: mailOptions.subject,
      messageId: result.messageId
    });
    
    return { 
      success: true, 
      messageId: result.messageId,
      simulated: false,
      recipients: recipients
    };
    
  } catch (error) {
    console.error('❌ Error enviando email real:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o con token especial
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authToken = request.headers.get('x-test-token');
    const validToken = process.env.TEST_ALERTS_TOKEN || 'test-token-123';
    
    if (!isDevelopment && authToken !== validToken) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development or with valid test token' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alertType, severity, message, details } = body;

    // Validar parámetros requeridos
    if (!alertType || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: alertType, severity, message' },
        { status: 400 }
      );
    }

    // Validar severidad
    const validSeverities = ['info', 'warning', 'critical'];
    if (!validSeverities.includes(severity.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be: info, warning, or critical' },
        { status: 400 }
      );
    }

    // Enviar alerta por email
    const emailResult = await sendEmailAlert(alertType, severity, message, details);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email alert', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert sent successfully',
      emailResult
    });

  } catch (error) {
    console.error('Error in test-alerts endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Alerts API (Public)',
    usage: {
      method: 'POST',
      endpoint: '/api/test-alerts-public',
      headers: {
        'Content-Type': 'application/json',
        'x-test-token': 'test-token-123 (required in production)'
      },
      body: {
        alertType: 'string (required)',
        severity: 'info|warning|critical (required)',
        message: 'string (required)',
        details: 'object (optional)'
      }
    },
    examples: [
      {
        alertType: 'Performance Alert',
        severity: 'warning',
        message: 'Response time is above threshold',
        details: { responseTime: 6000, threshold: 5000 }
      },
      {
        alertType: 'Memory Alert',
        severity: 'critical',
        message: 'Memory usage is critically high',
        details: { memoryUsage: 0.95, threshold: 0.9 }
      }
    ],
    note: 'This is a public endpoint for testing. Use /api/test-alerts for production with proper authentication.'
  });
}
