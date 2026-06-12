import { useState, useEffect, useCallback } from 'react';
import { workDayApi } from '../api/work-day.api';
import type { WorkDay } from '../types/work-day.types';

export function useWorkDays(params?: { month?: string; doctorId?: number }, deps: any[] = []) {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    workDayApi.getAll(params)
      .then(data => setWorkDays(Array.isArray(data) ? data : []))
      .catch(() => setWorkDays([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { workDays, setWorkDays, loading, reload: load };
}
