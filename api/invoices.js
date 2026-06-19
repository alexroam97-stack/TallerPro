import { getTicket, updateTicket, getSettings, checkAuth } from './db.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { id, download } = req.query;

  try {
    // ─── GET: Download Invoice Files (Public) ───────────────────────
    if (req.method === 'GET') {
      if (!id) {
        return res.status(400).json({ error: 'El ID de la orden es requerido' });
      }

      const ticket = await getTicket(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      const invoice = ticket.billingInfo?.invoice;
      if (!invoice) {
        return res.status(404).json({ error: 'Esta orden no cuenta con una factura timbrada' });
      }

      if (download === 'xml') {
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${id}.xml"`);
        return res.status(200).send(invoice.xmlString);
      }

      if (download === 'pdf') {
        // Retrieve workshop settings
        let settings = {
          name: 'TallerPro',
          address: 'Av. de la Reforma 123, Ciudad de México',
          rfc: 'TPRO120409AA1',
          phone: '526633040096'
        };
        try {
          const saved = await getSettings(ticket.workshopId);
          if (saved) settings = { ...settings, ...saved };
        } catch {
          // Fallback to defaults
        }

        // Calculate totals
        const items = ticket.items || [];
        const subtotal = items.reduce((sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0);
        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        // Render SAT style invoice HTML
        const satRegimes = {
          '601': 'General de Ley Personas Morales',
          '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
          '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
          '625': 'Régimen de Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
          '626': 'Régimen Simplificado de Confianza (RESICO)'
        };

        const satUsages = {
          'G03': 'Gastos en general',
          'I08': 'Otros instrumentos financieros',
          'D01': 'Honorarios médicos, dentales y gastos hospitalarios',
          'D02': 'Gastos médicos por incapacidad o discapacidad',
          'S01': 'Sin efectos fiscales'
        };

        const paymentForms = {
          '01': 'Efectivo',
          '02': 'Cheque nominativo',
          '03': 'Transferencia electrónica de fondos',
          '04': 'Tarjeta de crédito',
          '28': 'Tarjeta de débito'
        };

        const rfc = ticket.billingInfo?.rfc || '';
        const legalName = ticket.billingInfo?.legalName || ticket.client || '';
        const zip = ticket.billingInfo?.zip || '';
        const regimeName = satRegimes[ticket.billingInfo?.regime] || 'Sueldos y Salarios';
        const usageName = satUsages[ticket.billingInfo?.usage] || 'Gastos en general';
        const formName = paymentForms[ticket.billingInfo?.paymentForm || '03'] || 'Transferencia electrónica';

        const itemsHtml = items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 11px; font-weight: bold; color: #555;">${item.satKey || '78181500'}</td>
            <td style="padding: 10px 0; font-size: 11px;">${item.qty || 1}</td>
            <td style="padding: 10px 0; font-size: 11px;">${item.desc}</td>
            <td style="padding: 10px 0; font-size: 11px; text-align: right;">$${(item.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 0; font-size: 11px; text-align: right;">$${((item.qty || 1) * (item.price || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join('');

        const formattedDate = new Date(invoice.stampedAt).toLocaleString('es-MX', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Factura Fiscal - ${id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 25px; color: #333; line-height: 1.4; background: #fff; margin: 0; }
                .wrapper { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                .info-section { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .info-box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; background-color: #fafafa; }
                .table-concepts { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
                .table-concepts th { border-bottom: 2px solid #005f73; padding: 8px 0; font-size: 11px; text-transform: uppercase; color: #005f73; text-align: left; }
                .totals-table { width: 40%; margin-left: 60%; border-collapse: collapse; margin-top: 15px; }
                .totals-table td { padding: 6px 0; font-size: 12px; }
                .stamp-box { border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-top: 30px; background-color: #fafafa; font-size: 9px; word-break: break-all; color: #666; }
                .stamp-title { font-weight: bold; color: #005f73; margin-bottom: 3px; font-size: 10px; text-transform: uppercase; }
                .badge { background: #005f73; color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; display: inline-block; }
                .btn-print { background: #005f73; color: #fff; border: none; padding: 10px 20px; font-size: 13px; font-weight: bold; border-radius: 4px; cursor: pointer; }
                @media print {
                  .no-print { display: none; }
                  body { padding: 0; }
                  .wrapper { border: none; box-shadow: none; padding: 0; }
                }
              </style>
            </head>
            <body>
              <div style="text-align: right; max-width: 800px; margin: 0 auto 15px auto;" class="no-print">
                <button class="btn-print" onclick="window.print()">Imprimir Factura</button>
              </div>
              <div class="wrapper">
                <table class="header-table">
                  <tr>
                    <td style="width: 55%; vertical-align: top;">
                      <h2 style="margin: 0; color: #005f73; font-size: 22px;">${settings.name}</h2>
                      <p style="margin: 5px 0 0 0; font-size: 12px;"><strong>RFC:</strong> ${settings.rfc}</p>
                      <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">Régimen Fiscal: General de Ley Personas Morales (601)</p>
                      <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${settings.address}</p>
                    </td>
                    <td style="width: 45%; text-align: right; vertical-align: top;">
                      <div class="badge" style="margin-bottom: 8px;">FACTURA DIGITAL CFDI 4.0</div>
                      <h3 style="margin: 0; color: #005f73; font-size: 16px;">FOLIO FISCAL (UUID)</h3>
                      <p style="margin: 3px 0; font-family: monospace; font-size: 11px; font-weight: bold; color: #222;">${invoice.uuid}</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Serie/Folio:</strong> TPRO-${id.replace('TKT-', '')}</p>
                      <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;"><strong>Fecha Timbrado:</strong> ${formattedDate}</p>
                    </td>
                  </tr>
                </table>

                <table class="info-section">
                  <tr>
                    <td style="width: 48%; vertical-align: top; padding-right: 2%;">
                      <div class="info-box">
                        <div style="font-weight: bold; font-size: 12px; color: #005f73; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; text-transform: uppercase;">Receptor (Datos Fiscales)</div>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>Nombre:</strong> ${legalName}</p>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>RFC:</strong> ${rfc}</p>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>C.P.:</strong> ${zip}</p>
                        <p style="margin: 3px 0; font-size: 12px; color: #555;"><strong>Régimen:</strong> ${regimeName}</p>
                      </div>
                    </td>
                    <td style="width: 48%; vertical-align: top; padding-left: 2%;">
                      <div class="info-box" style="height: 100%;">
                        <div style="font-weight: bold; font-size: 12px; color: #005f73; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; text-transform: uppercase;">Detalles del CFDI</div>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>Uso del CFDI:</strong> ${usageName}</p>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>Forma de Pago:</strong> ${formName}</p>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>Método de Pago:</strong> Pago en una sola exhibición (PUE)</p>
                        <p style="margin: 3px 0; font-size: 12px;"><strong>Moneda:</strong> MXN - Peso Mexicano</p>
                      </div>
                    </td>
                  </tr>
                </table>

                <h3 style="margin: 20px 0 5px 0; color: #005f73; font-size: 13px; text-transform: uppercase;">Conceptos de la Factura</h3>
                <table class="table-concepts">
                  <thead>
                    <tr>
                      <th style="width: 15%;">Clave SAT</th>
                      <th style="width: 10%;">Cant</th>
                      <th style="width: 50%;">Descripción</th>
                      <th style="width: 12.5%; text-align: right;">P. Unitario</th>
                      <th style="width: 12.5%; text-align: right;">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <table class="totals-table">
                  <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td style="text-align: right;">$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td><strong>IVA (16%):</strong></td>
                    <td style="text-align: right;">$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="border-top: 1px solid #333; font-size: 14px; font-weight: bold;">
                    <td style="padding-top: 6px;">Total:</td>
                    <td style="text-align: right; padding-top: 6px; color: #005f73;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>

                <div style="display: flex; gap: 20px; margin-top: 35px; align-items: center;">
                  <div style="width: 110px; height: 110px; padding: 5px; border: 1px solid #ddd; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' + invoice.uuid + '&re=' + settings.rfc + '&rr=' + rfc + '&tt=' + total.toFixed(2))}" style="width: 100px; height: 100px;" alt="QR SAT" />
                  </div>
                  <div style="flex: 1;">
                    <div class="stamp-box" style="margin-top: 0; padding: 8px 12px;">
                      <div class="stamp-title">Folio Fiscal Digital (UUID)</div>
                      <div style="font-family: monospace; color: #333; margin-bottom: 4px;">${invoice.uuid}</div>
                      <div class="stamp-title">No. Serie Certificado SAT</div>
                      <div style="font-family: monospace; color: #333; margin-bottom: 4px;">00001000000504465028</div>
                      <div class="stamp-title">RFC Proveedor Certificación</div>
                      <div style="font-family: monospace; color: #333;">SAT970701NN3 (TallerPro PAC Sandbox)</div>
                    </div>
                  </div>
                </div>

                <div class="stamp-box">
                  <div class="stamp-title">Sello Digital del Emisor</div>
                  ${invoice.selloCFD}
                </div>

                <div class="stamp-box">
                  <div class="stamp-title">Sello Digital del SAT</div>
                  ${invoice.selloSAT}
                </div>

                <div class="stamp-box">
                  <div class="stamp-title">Cadena Original del Complemento de Certificación Digital del SAT</div>
                  ||1.1|${invoice.uuid}|${invoice.stampedAt}|SAT970701NN3|${invoice.selloCFD.substring(0, 40)}...|00001000000504465028||
                </div>

                <p style="font-size: 8px; color: #888; text-align: center; margin-top: 25px;">
                  Este documento es una representación impresa de un CFDI de pruebas generado en el ambiente Sandbox de TallerPro. No tiene validez fiscal real ante el SAT.
                </p>
              </div>
            </body>
          </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      }
    }

    // ─── POST: Stamp Invoicing Sandbox (Staff Protected) ────────────
    if (req.method === 'POST') {
      const auth = checkAuth(req, ['admin', 'mechanic']);
      if (!auth) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { id: bodyId, rfc, legalName, zip, regime, usage, paymentForm } = req.body || {};
      const targetId = id || bodyId;

      if (!targetId) {
        return res.status(400).json({ error: 'El ID de la orden es requerido' });
      }

      if (!rfc || !legalName || !zip) {
        return res.status(400).json({ error: 'El RFC, Razón Social y Código Postal son obligatorios' });
      }

      const ticket = await getTicket(targetId);
      if (!ticket) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      if (!ticket.items || ticket.items.length === 0) {
        return res.status(400).json({ error: 'No se puede facturar una orden sin conceptos agregados' });
      }

      // Check if already stamped
      if (ticket.billingInfo?.invoice) {
        return res.status(400).json({ error: 'Esta orden ya cuenta con una factura timbrada' });
      }

      // Retrieve workshop settings
      let settings = {
        name: 'TallerPro',
        rfc: 'TPRO120409AA1',
        phone: '526633040096',
        address: 'Av. de la Reforma 123, Ciudad de México'
      };
      try {
        const saved = await getSettings(ticket.workshopId);
        if (saved) settings = { ...settings, ...saved };
      } catch {
        // Fallback
      }

      // Stamping Generation
      const uuid = crypto.randomUUID ? crypto.randomUUID().toUpperCase() : crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5').toUpperCase();
      const stampedAt = new Date().toISOString();
      const shopRfc = settings.rfc;
      const shopName = settings.name;

      const subtotal = ticket.items.reduce((sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0);
      const iva = subtotal * 0.16;
      const total = subtotal + iva;

      // Mock signatures
      const selloCFD = crypto.createHash('sha256').update(uuid + stampedAt + 'emisor').digest('base64');
      const selloSAT = crypto.createHash('sha256').update(uuid + stampedAt + 'sat').digest('base64');

      // Generate CFDI 4.0 Mock XML String
      const conceptLines = ticket.items.map(item => `
    <cfdi:Concepto ClaveProdServ="${item.satKey || '78181500'}" Cantidad="${item.qty || 1}" ClaveUnidad="${item.type === 'Refacción' ? 'H87' : 'E48'}" Unidad="${item.type === 'Refacción' ? 'Pieza' : 'Servicio'}" Descripcion="${item.desc}" ValorUnitario="${(item.price || 0).toFixed(2)}" Importe="${((item.qty || 1) * (item.price || 0)).toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${((item.qty || 1) * (item.price || 0)).toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${((item.qty || 1) * (item.price || 0) * 0.16).toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`).join('');

      const xmlString = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="TPRO" Folio="${targetId.replace('TKT-', '')}" Fecha="${stampedAt.substring(0, 19)}" SubTotal="${subtotal.toFixed(2)}" Total="${total.toFixed(2)}" TipoDeComprobante="I" MetodoPago="PUE" FormaPago="${paymentForm || '03'}" LugarExpedicion="06000" Sello="${selloCFD}" NoCertificado="00001000000508821990">
  <cfdi:Emisor Rfc="${shopRfc}" Nombre="${shopName}" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${rfc}" Nombre="${legalName}" DomicilioFiscalReceptor="${zip}" RegimenFiscalReceptor="${regime}" UsoCFDI="${usage}"/>
  <cfdi:Conceptos>${conceptLines}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${uuid}" FechaTimbrado="${stampedAt}" SelloCFD="${selloCFD}" NoCertificadoSAT="00001000000504465028" SelloSAT="${selloSAT}" RfcProvCertif="SAT970701NN3"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

      // Combine billingInfo fields with the stamped invoice
      const updatedBilling = {
        rfc,
        legalName,
        zip,
        regime,
        usage,
        paymentForm: paymentForm || '03',
        invoice: {
          uuid,
          stampedAt,
          selloCFD,
          selloSAT,
          xmlString,
          pdfUrl: `/api/invoices?download=pdf&id=${targetId}`,
          xmlUrl: `/api/invoices?download=xml&id=${targetId}`
        }
      };

      // Save to DB
      const result = await updateTicket(targetId, { billingInfo: updatedBilling }, auth.workshopId);
      return res.status(200).json(result.billingInfo.invoice);
    }

    // ─── DELETE: Cancel stamped invoice (Staff Protected) ───────────
    if (req.method === 'DELETE') {
      const auth = checkAuth(req, ['admin']);
      if (!auth) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      if (!id) {
        return res.status(400).json({ error: 'El ID de la orden es requerido' });
      }

      const ticket = await getTicket(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      if (!ticket.billingInfo?.invoice) {
        return res.status(400).json({ error: 'Esta orden no cuenta con una factura timbrada para poder cancelarse' });
      }

      // Reset billingInfo but keep basic keys, set invoice to null
      const updatedBilling = {
        rfc: ticket.billingInfo.rfc || '',
        legalName: ticket.billingInfo.legalName || '',
        zip: ticket.billingInfo.zip || '',
        regime: ticket.billingInfo.regime || '601',
        usage: ticket.billingInfo.usage || 'G03',
        paymentForm: ticket.billingInfo.paymentForm || '03',
        invoice: null
      };

      await updateTicket(id, { billingInfo: updatedBilling }, auth.workshopId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[Invoices] Error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor de facturación' });
  }
}
