// API endpoint para probar alertas
// POST /api/test-alerts

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyApiAuth, requireAdmin, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/api-auth';

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
          <div style="background-color: ${severity === 'critical' ? '#dc3545' : severity === 'warning' ? '#ffc107' : '#17a2b8'}; color: white; padding: 20px; text-align: center;">
            <h1>🚨 ModularQ Alert</h1>
            <h2>Severity: ${severity.toUpperCase()}</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8f9fa;">
            <h3>Alert Details:</h3>
            <p><strong>Type:</strong> ${alertType}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            
            ${Object.keys(details).length > 0 ? `
              <h3>Additional Details:</h3>
              <pre style="background-color: #e9ecef; padding: 10px; border-radius: 5px;">${JSON.stringify(details, null, 2)}</pre>
            ` : ''}
          </div>
          
          <div style="padding: 20px; background-color: #e9ecef; text-align: center;">
            <p><small>This is a test alert from ModularQ monitoring system</small></p>
          </div>
        </div>
      `,
      text: `
ModularQ Alert - ${severity.toUpperCase()}

Type: ${alertType}
Message: ${message}
Timestamp: ${new Date().toISOString()}

${Object.keys(details).length > 0 ? `Additional Details:\n${JSON.stringify(details, null, 2)}` : ''}

This is a test alert from ModularQ monitoring system.
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
    // Verificar autenticación
    const authResult = await verifyApiAuth(request);
    if (!authResult.isAuthenticated) {
      return createUnauthorizedResponse(authResult.error);
    }

    // Verificar que sea admin
    if (!requireAdmin(authResult.user)) {
      return createForbiddenResponse('Only administrators can send alerts');
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
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be one of: info, warning, critical' },
        { status: 400 }
      );
    }

    // Enviar alerta
    const result = await sendEmailAlert(alertType, severity, message, details);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.simulated ? 'Alert simulated successfully (check console logs)' : 'Alert sent successfully',
        messageId: result.messageId,
        simulated: result.simulated,
        recipients: result.recipients,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send alert', details: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in test-alerts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Alerts API',
    usage: {
      method: 'POST',
      endpoint: '/api/test-alerts',
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
    ]
  });
}