export interface MedicalRecordImage {
  id: number;
  medicalRecordId: number;
  imageUrl: string;
  publicId: string;
  note?: string | null;
  createdAt: string;
}
