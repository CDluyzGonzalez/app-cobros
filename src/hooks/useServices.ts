import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Service } from '../types';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refresh: fetchServices,
    setServices
  };
};
