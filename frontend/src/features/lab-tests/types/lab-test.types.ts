export interface LabTest {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface TestOrderItem {
  labTestId: number | null;  // null = custom test không có trong DB
  testName: string;
  note?: string;
}

export interface TestOrder {
  id: number;
  appointmentId: number;
  note?: string | null;
  createdAt: string;
  items: TestOrderItem[];
}

export interface CreateTestOrderDto {
  appointmentId: number;
  items: TestOrderItem[];
  note?: string;
}
