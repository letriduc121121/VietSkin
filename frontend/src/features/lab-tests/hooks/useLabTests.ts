import { useState, useEffect, useCallback } from 'react';
import { labTestApi } from '../api/lab-test.api';
import type { LabTest } from '../types/lab-test.types';

/** Danh sách xét nghiệm — fallback về static list nếu API chưa có */
export function useLabTests(staticFallback: LabTest[] = []) {
  const [labTests, setLabTests] = useState<LabTest[]>(staticFallback);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    labTestApi.getAll()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setLabTests(data);
        // else keep staticFallback already set in state
      })
      .catch(() => { /* keep staticFallback */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { labTests, loading, reload: load };
}
