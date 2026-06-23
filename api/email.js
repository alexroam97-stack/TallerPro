import { getTicket, getSettings } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, email } = req.body || {};
  console.log('[Email API] Request received:', { id, email });

  if (!id || !email) {
    console.log('[Email API] Missing parameters:', { id, email });
    return res.status(400).json({ error: 'ID de la orden y correo electrónico de destino son obligatorios' });
  }

  try {
    const ticket = await getTicket(id);
    if (!ticket) {
      console.log(`[Email API] Ticket with ID "${id}" was not found in DB.`);
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    console.log('[Email API] Ticket found in DB:', { id: ticket.id, client: ticket.client, email: ticket.email });

    // Fetch workshop details
    let settings = {
      name: 'TallerPro',
      phone: '526633040096',
      address: 'Av. de la Reforma 123, Ciudad de México'
    };
    try {
      const saved = await getSettings(ticket.workshopId);
      if (saved) settings = { ...settings, ...saved };
    } catch {
      // Fallback
    }

    const items = ticket.items || [];
    const subtotal = items.reduce((sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0);
    const ivaRate = ticket.billingInfo?.ivaRate !== undefined ? ticket.billingInfo.ivaRate : 16;
    const iva = subtotal * (ivaRate / 100);
    const total = subtotal + iva;

    const trackerUrl = `${req.headers.origin || 'https://taller-pro-mu.vercel.app'}/tracker/${id}`;

    // Generate table concepts HTML
    const conceptsRowsHtml = items.length > 0 
      ? items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-size: 13px; color: #333;">${item.desc}</td>
            <td style="padding: 10px; font-size: 13px; color: #555; text-align: center;">${item.qty}</td>
            <td style="padding: 10px; font-size: 13px; color: #555; text-align: right;">$${(item.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px; font-size: 13px; color: #005f73; font-weight: bold; text-align: right;">$${((item.qty || 1) * (item.price || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="4" style="padding: 20px; text-align: center; color: #999; font-size: 13px;">No hay conceptos cargados en este presupuesto.</td>
          </tr>
        `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Presupuesto de Servicio - ${settings.name}</title>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 20px; margin: 0;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; border-collapse: collapse;">
            <!-- Header -->
            <tr style="background-color: #005f73;">
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">${settings.name.toUpperCase()}</h1>
                <p style="color: #cae9e0; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1px;">PRESUPUESTO DE SERVICIO DE MANTENIMIENTO</p>
              </td>
            </tr>
            
            <!-- Body Content -->
            <tr>
              <td style="padding: 30px; color: #333333;">
                <h2 style="color: #005f73; margin-top: 0; font-size: 18px; font-weight: bold;">Estimado(a) ${ticket.client},</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #555555; margin-bottom: 20px;">
                  Le enviamos el presupuesto detallado para la reparación y mantenimiento de su vehículo **${ticket.vehicle}** (Folio de Orden: **${id}**).
                </p>

                <!-- Vehicle Details Card -->
                <table width="100%" style="background-color: #f8fafc; border-radius: 6px; padding: 15px; margin-bottom: 25px; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 13px; color: #666; padding: 3px 0;"><strong>Vehículo:</strong> ${ticket.vehicle}</td>
                    <td style="font-size: 13px; color: #666; padding: 3px 0; text-align: right;"><strong>Tipo de Servicio:</strong> ${ticket.serviceType || 'Mecánica'}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #666; padding: 3px 0;"><strong>Folio:</strong> ${id}</td>
                    <td style="font-size: 13px; color: #666; padding: 3px 0; text-align: right;"><strong>Fecha Registro:</strong> ${new Date(ticket.createdAt).toLocaleDateString('es-MX')}</td>
                  </tr>
                </table>

                <h3 style="font-size: 14px; color: #005f73; border-bottom: 2px solid #005f73; padding-bottom: 5px; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; font-weight: bold;">Conceptos del Presupuesto</h3>
                
                <!-- Concepts Table -->
                <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr style="background-color: #f4f7f6; border-bottom: 2px solid #dddddd;">
                      <th align="left" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase;">Descripción</th>
                      <th align="center" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase; width: 10%;">Cant</th>
                      <th align="right" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase; width: 20%;">P. Unitario</th>
                      <th align="right" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase; width: 20%;">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${conceptsRowsHtml}
                  </tbody>
                </table>

                <!-- Totals -->
                <table width="40%" align="right" style="border-collapse: collapse; margin-top: 10px; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #666;">Subtotal:</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; color: #333; font-weight: bold;">$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #666; border-bottom: 1px solid #ddd;">IVA (${ivaRate}%):</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; color: #333; font-weight: bold; border-bottom: 1px solid #ddd;">$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 0 0; font-size: 15px; color: #005f73; font-weight: bold;">TOTAL:</td>
                    <td align="right" style="padding: 10px 0 0 0; font-size: 16px; color: #005f73; font-weight: bold;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
                <div style="clear: both;"></div>

                <!-- Call to Action -->
                <table align="center" style="margin-top: 30px; margin-bottom: 30px;">
                  <tr>
                    <td align="center" style="background-color: #005f73; border-radius: 25px;">
                      <a href="${trackerUrl}" target="_blank" style="padding: 12px 35px; font-size: 14px; font-family: sans-serif; color: #ffffff; text-decoration: none; font-weight: bold; display: inline-block;">
                        Ver Estatus y Autorizar en Vivo
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 13px; line-height: 1.5; color: #666666; text-align: center; margin-top: 20px;">
                  Haciendo clic en el botón podrá autorizar o declinar los trabajos de forma directa y ver el avance fotográfico en tiempo real de su vehículo.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr style="background-color: #eceff1; border-top: 1px solid #e0e0e0;">
              <td style="padding: 20px; text-align: center; font-size: 11px; color: #777777;">
                <p style="margin: 0 0 5px 0;"><strong>${settings.name}</strong></p>
                <p style="margin: 0 0 5px 0;">${settings.address} &bull; Tel: ${settings.phone}</p>
                <p style="margin: 10px 0 0 0; font-size: 9px; color: #aaaaaa;">Este es una simulación de envío de correo generada en el entorno sandbox de TallerPro. No se realiza ningún cargo o envío SMTP real.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Simulated email log to server terminal
    console.log(`\n============================================================`);
    console.log(`[SIMULATION: EMAIL SENT SUCCESSFULLY]`);
    console.log(`------------------------------------------------------------`);
    console.log(`FROM: notifications@tallerpro.mx (${settings.name})`);
    console.log(`TO: ${email}`);
    console.log(`SUBJECT: Presupuesto y Cotización de Servicio - Folio ${id}`);
    console.log(`TRACKING URL: ${trackerUrl}`);
    console.log(`TOTAL AMOUNT: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`);
    console.log(`============================================================\n`);

    return res.status(200).json({
      success: true,
      email,
      ticketId: id,
      message: 'Correo simulado enviado y registrado en los logs del servidor.',
      previewHtml: emailHtml
    });
  } catch (err) {
    console.error('[Email API Error]:', err.message);
    return res.status(500).json({ error: 'Error al simular el envío del correo' });
  }
}
