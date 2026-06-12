import { useState, useEffect } from 'react';
import { medicineApi } from '../api/medicine.api';
import type { Medicine } from '../types/medicine.types';

/** Fetch toàn bộ danh sách thuốc */
export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    medicineApi.getAll()
      .then(setMedicines)
      .catch(() => setMedicines([]))
      .finally(() => setLoading(false));
  }, []);

  return { medicines, loading };
}
