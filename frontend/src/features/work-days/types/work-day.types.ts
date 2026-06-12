export interface WorkDay {
  id: number;
  doctorId: number;
  date: string;           // ISO date YYYY-MM-DD
  room?: string | null;
  doctor?: { user: { name: string } };
}

export interface CreateWorkDayDto {
  doctorId: number;
  date: string;
  room?: string;
}

export interface BulkCreateWorkDayDto {
  doctorId: number;
  dates: string[];
  room?: string;
}
