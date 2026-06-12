import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '../api/appointment.api';
import type { Appointment, AppointmentListParams } from '../types/appointment.types';

/** Fetch danh sách lịch hẹn với params tuỳ ý */
export function useAppointments(params?: AppointmentListParams, deps: any[] = []) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    appointmentApi.getList(params)
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { appointments, setAppointments, loading, reload: load };
}

/** Fetch lịch hẹn của bệnh nhân đang đăng nhập */
export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    appointmentApi.getMy()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { appointments, setAppointments, loading, reload: load };
}

/** Fetch chi tiết 1 lịch hẹn */
export function useAppointmentDetail(id: number | null) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    appointmentApi.getById(id)
      .then(setAppointment)
      .catch(() => setAppointment(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { appointment, loading };
}
