export interface Service {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  duration?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: string | number;
  duration?: number;
  category?: string;
  imageUrl?: string;
  active?: boolean;
}
