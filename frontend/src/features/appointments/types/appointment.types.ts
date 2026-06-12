export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  patientName: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  symptoms?: string | null;
  queueNumber?: number | null;
  patientId?: number | null;
  patient?: {
    id: number;
    name: string;
    phone: string;
    patientProfile?: {
      patientCode?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      bloodType?: string | null;
      allergies?: string | null;
      medicalHistory?: string | null;
      province?: string | null;
      address?: string | null;
    } | null;
  } | null;
  doctor: {
    id?: number;
    user: { name: string; avatar?: string | null };
    consultationFee?: string;
  };
  service?: { name: string; price?: string } | null;
  invoice?: { status: string; amount: string } | null;
  medicalRecord?: { id: number } | null;
  prescription?: {
    note?: string | null;
    items: {
      medicineName: string;
      dosage?: string | null;
      frequency?: string | null;
      duration?: string | null;
      quantity?: number | null;
      note?: string | null;
    }[];
  } | null;
}

export interface CreateAppointmentDto {
  patientName: string;
  patientPhone: string;
  patientId?: number | null;
  doctorId: number;
  serviceId?: number | null;
  date: string;
  time: string;
  symptoms?: string;
}

export interface AppointmentListParams {
  date?: string;
  doctorId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
