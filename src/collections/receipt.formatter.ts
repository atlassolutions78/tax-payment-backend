export class ReceiptFormatter {
  static receipt(data: {
    referenceNumber: string;
    collectedAt: string;
    method: string;
    businessName: string;
    tin: string;
    sector: string;
    period: string;
    taxType: string;
    filingDeadline: string;
    isLate: boolean;
    taxAmount: string;
    penalty: string | null;
    total: string;
    generatedAt: string;
  }): string {
    const row = (label: string, value: string) => `
      <tr>
        <td class="label">${label}</td>
        <td class="value">${value}</td>
      </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payment Receipt — ${data.referenceNumber}</title>
  <style>
    @page { size: A4; margin: 0; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #fff;
      padding: 40px 60px;
      width: 210mm;
      min-height: 297mm;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 28px;
    }
    .header-left .org { font-size: 18px; font-weight: 700; }
    .header-left .sub { font-size: 12px; color: #555; margin-top: 4px; }
    .header-right { text-align: right; }
    .header-right .receipt-title { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .header-right .ref { font-size: 12px; color: #555; margin-top: 6px; }

    /* ── Sections ── */
    .section { margin-bottom: 24px; }

    table { width: 100%; border-collapse: collapse; }
    table td { padding: 8px 0; vertical-align: top; }
    table td.label { width: 200px; color: #555; font-size: 12px; }
    table td.value { font-weight: 600; font-size: 13px; }

    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 4px 0; }

    /* ── Total ── */
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px solid #1a1a1a;
    }
    .total-box .total-label { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .total-box .total-amount { font-size: 20px; font-weight: 700; }

    /* ── Late badge ── */
    .badge {
      display: inline-block;
      background: #c0392b;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 2px;
      vertical-align: middle;
      margin-left: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #888;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { padding: 40px 60px; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="org">Direction Générale des Impôts</div>
      <div class="sub">Province du Nord-Kivu — République Démocratique du Congo</div>
    </div>
    <div class="header-right">
      <div class="receipt-title">Receipt</div>
      <div class="ref">${data.referenceNumber}</div>
    </div>
  </div>

  <div class="section">
    <table>
      ${row('Date Collected', data.collectedAt)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('Payment Method', data.method)}
    </table>
  </div>

  <div class="section">
    <table>
      ${row('Business Name', data.businessName)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('TIN', data.tin)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('Sector', data.sector)}
    </table>
  </div>

  <div class="section">
    <table>
      ${row('Tax Period', data.period)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('Tax Type', data.taxType)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('Filing Deadline', data.filingDeadline)}
      <tr><td colspan="2"><hr class="divider"/></td></tr>
      ${row('Late Filing', data.isLate ? 'Yes' : 'No')}
    </table>
  </div>

  <div class="section">
    <table>
      ${row('Tax Amount', data.taxAmount)}
      ${data.penalty ? `<tr><td colspan="2"><hr class="divider"/></td></tr>${row('Penalty (10%)', data.penalty)}` : ''}
    </table>

    <div class="total-box">
      <span class="total-label">Total Paid</span>
      <span class="total-amount">${data.total}</span>
    </div>
  </div>

  <div class="footer">
    <span>This is an official receipt issued by the DGI, Province du Nord-Kivu.</span>
    <span>Generated on ${data.generatedAt}</span>
  </div>

</body>
</html>`;
  }
}
