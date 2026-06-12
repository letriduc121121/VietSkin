const METHOD_LABEL: Record<string, string> = {
  cash:          'Tiền mặt',
  qr_code:       'QR Code',
  bank_transfer: 'Chuyển khoản ngân hàng',
  card:          'Thẻ ngân hàng',
};

export function printInvoice(inv: {
  invoiceCode: string;
  patientName: string;
  description: string;
  amount: string | number;
  method: string;
  note?: string | null;
  paidAt?: string;
  createdAt?: string;
  appointment?: {
    date?: string;
    time?: string;
    doctor?: { user: { name: string } };
    service?: { name: string } | null;
  } | null;
  receiver?: { name: string } | null;
}) {
  const fmt  = (n: string | number) => Number(n).toLocaleString('vi-VN') + 'đ';
  const paid = inv.paidAt ?? inv.createdAt ?? '';
  const paidStr = paid ? new Date(paid).toLocaleString('vi-VN') : '';
  const aptDate = inv.appointment?.date
    ? new Date(inv.appointment.date).toLocaleDateString('vi-VN') : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hoá đơn ${inv.invoiceCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; background: #fff; padding: 32px; }
    .header { text-align: center; margin-bottom: 28px; }
    .clinic-name { font-size: 20px; font-weight: 700; color: #1a3a5c; letter-spacing: 1px; }
    .clinic-sub  { font-size: 11px; color: #666; margin-top: 4px; }
    .title { font-size: 17px; font-weight: 700; margin: 20px 0 6px; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
    .code  { text-align: center; font-size: 12px; color: #888; margin-bottom: 24px; }
    .divider { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
    .section-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 7px; }
    .row .label { color: #666; flex-shrink: 0; }
    .row .value { font-weight: 600; text-align: right; max-width: 60%; }
    .total-box { border: 2px solid #1a3a5c; border-radius: 8px; padding: 14px 18px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 14px; font-weight: 700; }
    .total-value { font-size: 22px; font-weight: 800; color: #1a3a5c; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; line-height: 1.6; }
    .stamp { display: inline-block; border: 2px solid #22c55e; color: #16a34a; border-radius: 6px; padding: 3px 14px; font-weight: 700; font-size: 13px; letter-spacing: 1px; margin-bottom: 6px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">PHÒNG KHÁM DA LIỄU VIETSKIN</div>
    <div class="clinic-sub">Địa chỉ: 123 Nguyễn Văn A, TP. Hồ Chí Minh &nbsp;|&nbsp; ĐT: 028 1234 5678</div>
  </div>

  <div class="title">Hoá đơn thanh toán</div>
  <div class="code">Mã hoá đơn: <strong>${inv.invoiceCode}</strong></div>

  <div class="section-label">Thông tin bệnh nhân</div>
  <div class="row"><span class="label">Họ tên</span><span class="value">${inv.patientName}</span></div>
  ${aptDate ? `<div class="row"><span class="label">Ngày khám</span><span class="value">${aptDate}${inv.appointment?.time ? ' · ' + inv.appointment.time : ''}</span></div>` : ''}
  ${inv.appointment?.doctor ? `<div class="row"><span class="label">Bác sĩ</span><span class="value">${inv.appointment.doctor.user.name}</span></div>` : ''}
  ${inv.appointment?.service ? `<div class="row"><span class="label">Dịch vụ</span><span class="value">${inv.appointment.service.name}</span></div>` : ''}

  <hr class="divider" />

  <div class="section-label">Chi tiết thanh toán</div>
  <div class="row"><span class="label">Mô tả</span><span class="value">${inv.description}</span></div>
  <div class="row"><span class="label">Phương thức</span><span class="value">${METHOD_LABEL[inv.method] ?? inv.method}</span></div>
  ${inv.note ? `<div class="row"><span class="label">Ghi chú</span><span class="value">${inv.note}</span></div>` : ''}
  ${inv.receiver ? `<div class="row"><span class="label">Thu ngân</span><span class="value">${inv.receiver.name}</span></div>` : ''}
  <div class="row"><span class="label">Thời gian</span><span class="value">${paidStr}</span></div>

  <div class="total-box">
    <span class="total-label">Tổng thanh toán</span>
    <span class="total-value">${fmt(inv.amount)}</span>
  </div>

  <div class="footer">
    <div class="stamp">ĐÃ THANH TOÁN</div><br/>
    Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của VietSkin.<br/>
    Mọi thắc mắc vui lòng liên hệ hotline: <strong>028 1234 5678</strong>
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=480,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}
