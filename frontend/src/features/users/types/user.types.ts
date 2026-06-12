export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  role: { code: string; name: string };
  patientProfile?: {
    dateOfBirth?: string | null;
    gender?: string | null;
    address?: string | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    citizenId?: string | null;
    ethnicity?: string | null;
    bloodType?: string | null;
    allergies?: string | null;
    medicalHistory?: string | null;
    emergencyContact?: string | null;
  } | null;
}

export interface UserRecord {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  active: boolean;
  role: { code: string; name: string };
  doctorProfile?: {
    id: number;
    specialty?: string | null;
    degree?: string | null;
    experience?: string | null;
    consultationFee?: number | null;
    description?: string | null;
  } | null;
}

export interface CreateStaffDto {
  name: string;
  phone: string;
  email?: string;
  password: string;
  roleCode: 'doctor' | 'receptionist' | 'admin';
  avatar?: string;
  specialty?: string;
  degree?: string;
  experience?: string;
  consultationFee?: string;
  description?: string;
}
