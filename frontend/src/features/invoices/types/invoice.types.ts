// ─── Core ────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: number;
  invoiceCode: string;
  appointmentId: number;
  patientName: string;
  description: string;
  amount: string;
  status: string;
  method: string;
  note?: string | null;
  paidAt?: string;
  createdAt: string;
  appointment?: {
    id?: number;
    date: string;
    time: string;
    status?: string;
    patientPhone?: string;
    symptoms?: string;
    doctor?: { user: { name: string }; consultationFee?: string };
    service?: { name: string } | null;
  } | null;
  receiver?: { name: string } | null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

// Khớp với dữ liệu thật từ GET /api/invoices/stats (InvoiceService.getStats)
export interface InvoiceStats {
  monthly: { month: string; revenue: number }[]; // 6 tháng gần nhất, month = "yyyy-MM"
  byMethod: Record<string, number>;              // doanh thu theo phương thức thanh toán
  todayTotal: number;
  monthTotal: number;
  grandTotal: number;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateInvoiceDto {
  appointmentId: number;
  patientName: string;
  description: string;
  amount: number;
  method: string;
  note?: string;
}
