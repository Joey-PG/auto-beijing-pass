import type { MapConfig } from './types';

export interface AMapLngLat {
  getLat: () => number;
  getLng: () => number;
}

export interface AMapGeocode {
  addressComponent?: {
    adcode?: string;
    district?: string;
  };
  formattedAddress?: string;
  location?: AMapLngLat;
}

interface AMapGeocodeResult {
  geocodes?: AMapGeocode[];
  info?: string;
  regeocode?: AMapGeocode;
}

type GeocodeCallback = (
  status: string,
  result: AMapGeocodeResult | string,
) => void;

export interface AMapGeocoder {
  getAddress: (location: [number, number], callback: GeocodeCallback) => void;
  getLocation: (address: string, callback: GeocodeCallback) => void;
}

interface AMapMapEvent {
  lnglat: AMapLngLat;
}

export interface AMapMap {
  destroy: () => void;
  getCenter: () => AMapLngLat;
  on: {
    (event: 'click', handler: (event: AMapMapEvent) => void): void;
    (event: 'moveend', handler: () => void): void;
  };
  setCenter: (position: [number, number]) => void;
  setZoomAndCenter: (zoom: number, position: [number, number]) => void;
}

export interface AMapNamespace {
  Geocoder: new (options?: { city?: string }) => AMapGeocoder;
  Map: new (
    container: HTMLElement,
    options: { center: [number, number]; resizeEnable: boolean; zoom: number },
  ) => AMapMap;
}

declare global {
  interface Window {
    AMap?: AMapNamespace;
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

let loaderPromise: Promise<AMapNamespace> | null = null;

export function loadAMap(config: MapConfig): Promise<AMapNamespace> {
  if (!config.enabled || !config.key || !config.securityCode) {
    return Promise.reject(new Error('地图服务尚未配置'));
  }
  if (window.AMap) return Promise.resolve(window.AMap);
  if (loaderPromise) return loaderPromise;

  window._AMapSecurityConfig = { securityJsCode: config.securityCode };
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.key)}&plugin=AMap.Geocoder`;
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap);
      } else {
        loaderPromise = null;
        reject(new Error('高德地图加载失败'));
      }
    };
    script.onerror = () => {
      loaderPromise = null;
      script.remove();
      reject(new Error('高德地图加载失败，请检查网络或 Key 配置'));
    };
    document.head.appendChild(script);
  });
  return loaderPromise;
}
