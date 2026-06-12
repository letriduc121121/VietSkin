import { useState, useEffect } from 'react';
import { serviceApi } from '../api/service.api';
import type { Service } from '../types/service.types';

/** Fetch danh sách dịch vụ */
export function useServices(params?: { all?: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceApi.getAll(params)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { services, setServices, loading };
}
