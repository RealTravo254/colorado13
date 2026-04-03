import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

interface IpLocationData {
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [ipLocation, setIpLocation] = useState<IpLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const fetchLocation = useCallback(async () => {
    if (requested) return;
    setRequested(true);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-location");
      if (fnError) throw fnError;
      if (data) {
        setIpLocation(data);
        if (data.latitude && data.longitude) {
          setPosition({ latitude: data.latitude, longitude: data.longitude });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to get location");
    } finally {
      setLoading(false);
    }
  }, [requested]);

  const requestLocation = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  const forceRequestLocation = useCallback(async () => {
    setRequested(false);
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-location");
      if (fnError) throw fnError;
      if (data) {
        setIpLocation(data);
        if (data.latitude && data.longitude) {
          setPosition({ latitude: data.latitude, longitude: data.longitude });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to get location");
    } finally {
      setLoading(false);
      setRequested(true);
    }
  }, []);

  return {
    position,
    ipLocation,
    error,
    loading,
    permissionDenied: false, // No longer applicable with IP geolocation
    requestLocation,
    forceRequestLocation,
  };
};

// Helper function to calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
