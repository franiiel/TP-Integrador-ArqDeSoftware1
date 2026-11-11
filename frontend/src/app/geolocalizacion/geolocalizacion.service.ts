import { Injectable } from '@angular/core';

/** Ubicación del dispositivo (componente `geolocalizacion`). Es opcional: si falla, devuelve `null`. */
@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {
  /** Devuelve `"lat,lon"` (por ejemplo `-34.603700,-58.381600`) o `null` si no se pudo obtener. */
  obtener(): Promise<string | null> {
    if (!('geolocation' in navigator)) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(`${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
      );
    });
  }
}
