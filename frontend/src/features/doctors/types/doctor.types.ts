// ─── Core ────────────────────────────────────────────────────────────────────

export interface Doctor {
  id: number;
  specialty?: string | null;
  degree?: string | null;
  experience?: string | null;
  consultationFee: string;
  description?: string | null;
  userId?: number | null;
  active?: boolean;
  user: {
    id?: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    avatar: string | null;
    active?: boolean;
  };
}

/** Dành cho admin — active luôn có mặt */
export interface AdminDoctor extends Doctor {
  active: boolean;
}

export interface DoctorSlot {
  time: string;
  available: boolean;
}

export interface DoctorSlotData {
  date: string;
  workDay: { room: string } | null;
  slots: DoctorSlot[];
}

// ─── Lookup data ──────────────────────────────────────────────────────────────

export interface Specialty {
  id: number;
  name: string;
  description?: string | null;
}

export interface Degree {
  id: number;
  name: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface UpdateDoctorDto {
  specialty?: string | null;
  degree?: string | null;
  experience?: string | null;
  consultationFee?: string | number;
  description?: string | null;
  [key: string]: any;
}
