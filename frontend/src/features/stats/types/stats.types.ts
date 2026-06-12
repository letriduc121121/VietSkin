export interface MonthlyVisit {
  month: string; // "yyyy-MM"
  count: number;
}

export interface DoctorStat {
  doctorName: string;
  count: number;
}

export interface DiagnosisStat {
  diagnosis: string;
  count: number;
}

export interface PatientStats {
  totalPatients: number;
  newThisMonth: number;
  totalVisits: number;
  noShowRate: number; // phần trăm
  visitsByMonth: MonthlyVisit[];
  topDoctors: DoctorStat[];
  topDiagnoses: DiagnosisStat[];
  appointmentStatusDist: Record<string, number>;
}

// ─── Thống kê dịch vụ ───────────────────────────────────────────────────────

export interface ServiceStat {
  serviceName: string;
  count: number;   // số lượt khám hoàn thành có dùng dịch vụ này
  revenue: number; // doanh thu thu được từ dịch vụ này
}

export interface ServiceStats {
  totalServices: number;       // số dịch vụ đang hoạt động
  totalServiceVisits: number;  // tổng lượt khám có gắn dịch vụ
  totalServiceRevenue: number; // tổng doanh thu từ dịch vụ
  services: ServiceStat[];     // danh sách dịch vụ, đã sắp giảm dần theo doanh thu
}
