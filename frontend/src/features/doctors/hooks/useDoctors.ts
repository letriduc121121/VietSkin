import { useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../api/doctor.api';
import type { Doctor, AdminDoctor, Degree, Specialty } from '../types/doctor.types';

/** Danh sách bác sĩ public */
export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    doctorApi.getAll()
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { doctors, setDoctors, loading, reload: load };
}

/** Toàn bộ bác sĩ kể cả inactive — dùng cho admin */
export function useAdminDoctors() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    doctorApi.getAdminAll()
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { doctors, setDoctors, loading, reload: load };
}

/** Specialties + Degrees song song — dùng cho form tạo / edit bác sĩ */
export function useDoctorLookup() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([doctorApi.getSpecialties(), doctorApi.getDegrees()])
      .then(([sp, dg]) => {
        setSpecialties(Array.isArray(sp) ? sp : []);
        setDegrees(Array.isArray(dg) ? dg : []);
      })
      .catch(() => { setSpecialties([]); setDegrees([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { specialties, degrees, loading, reload: load };
}
