const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const getLatestPayment = (bill) => {
  const payments = Array.isArray(bill?.payments) ? bill.payments : []
  if (payments.length === 0) return null

  return [...payments].sort((a, b) => {
    const aDate = a?.paidAt ? new Date(a.paidAt).getTime() : 0
    const bDate = b?.paidAt ? new Date(b.paidAt).getTime() : 0
    return bDate - aDate
  })[0]
}

const buildReceiptHtml = (bill, payment) => {
  const receiptNumber = `RCPT-${bill?.invoiceNumber || 'NA'}-${payment?.id || 'NA'}`

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Payment Receipt</title>
    <style>
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 24px;
        color: #111827;
        background: #f8fafc;
      }
      .receipt {
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }
      .head {
        padding: 18px 22px;
        background: #0f766e;
        color: #ffffff;
      }
      .title {
        margin: 0;
        font-size: 22px;
      }
      .subtitle {
        margin: 6px 0 0;
        opacity: 0.92;
        font-size: 13px;
      }
      .section {
        padding: 16px 22px;
        border-top: 1px solid #f1f5f9;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 24px;
      }
      .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #64748b;
        margin-bottom: 4px;
      }
      .value {
        font-size: 14px;
        color: #0f172a;
        font-weight: 600;
      }
      .amount {
        font-size: 26px;
        color: #0f766e;
        font-weight: 700;
      }
      .footer {
        padding: 16px 22px 22px;
        color: #475569;
        font-size: 12px;
      }
      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }
        .receipt {
          border: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <header class="head">
        <h1 class="title">Prime Medical - Payment Receipt</h1>
        <p class="subtitle">Receipt No: ${escapeHtml(receiptNumber)}</p>
      </header>

      <section class="section">
        <div class="grid">
          <div>
            <div class="label">Patient</div>
            <div class="value">${escapeHtml(bill?.patientName || '-')}</div>
          </div>
          <div>
            <div class="label">Invoice Number</div>
            <div class="value">${escapeHtml(bill?.invoiceNumber || '-')}</div>
          </div>
          <div>
            <div class="label">Payment Date</div>
            <div class="value">${escapeHtml(formatDateTime(payment?.paidAt || new Date().toISOString()))}</div>
          </div>
          <div>
            <div class="label">Payment Method</div>
            <div class="value">${escapeHtml(payment?.paymentMethod || '-')}</div>
          </div>
          <div>
            <div class="label">Reference</div>
            <div class="value">${escapeHtml(payment?.paymentReference || 'N/A')}</div>
          </div>
          <div>
            <div class="label">Processed By</div>
            <div class="value">${escapeHtml(payment?.processedByName || '-')}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="label">Amount Paid</div>
        <div class="amount">LKR ${escapeHtml(formatMoney(payment?.amount || bill?.netAmount || 0))}</div>
      </section>

      <section class="section">
        <div class="grid">
          <div>
            <div class="label">Invoice Total</div>
            <div class="value">LKR ${escapeHtml(formatMoney(bill?.netAmount || 0))}</div>
          </div>
          <div>
            <div class="label">Current Bill Status</div>
            <div class="value">${escapeHtml(bill?.status || '-')}</div>
          </div>
        </div>
      </section>

      <footer class="footer">
        This is a system-generated receipt from Prime Medical.
      </footer>
    </main>
  </body>
</html>`
}

export const printBillReceipt = (bill, paymentInput) => {
  if (!bill) return { ok: false, reason: 'No bill details available' }

  const payment = paymentInput || getLatestPayment(bill)
  if (!payment && !bill?.netAmount) {
    return { ok: false, reason: 'No payment details available' }
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) {
    return { ok: false, reason: 'Popup blocked by browser' }
  }

  printWindow.document.open()
  printWindow.document.write(buildReceiptHtml(bill, payment))
  printWindow.document.close()

  // Delay print slightly to ensure styles render in slower browsers.
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }

  return { ok: true }
}
