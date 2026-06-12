import { useState, useEffect, useCallback } from 'react';
import { roomApi } from '../api/room.api';
import type { Room } from '../types/room.types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    roomApi.getAll()
      .then(data => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { rooms, setRooms, loading, reload: load };
}
