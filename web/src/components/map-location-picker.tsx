import {
  EnvironmentFilled,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  loadAMap,
  type AMapGeocode,
  type AMapGeocoder,
  type AMapMap,
} from '../amap';
import type { MapConfig } from '../types';

export interface MapLocation {
  address: string;
  adcode: string;
  district: string;
  latitude: string;
  longitude: string;
}

interface MapLocationPickerProps {
  config: MapConfig;
  initialLocation?: Partial<MapLocation>;
  onCancel: () => void;
  onConfirm: (location: MapLocation) => boolean | void;
  open: boolean;
  title: string;
}

const PINGGU_CENTURY_SQUARE: [number, number] = [117.107614, 40.143807];

function toPosition(location?: Partial<MapLocation>): [number, number] {
  const longitude = Number(location?.longitude);
  const latitude = Number(location?.latitude);
  if (
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  ) {
    return [longitude, latitude];
  }
  return PINGGU_CENTURY_SQUARE;
}

function isGeocodeResult(result: AMapGeocode | string | object): result is object {
  return typeof result === 'object' && result !== null;
}

export function MapLocationPicker({
  config,
  initialLocation,
  onCancel,
  onConfirm,
  open,
  title,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const geocoderRef = useRef<AMapGeocoder | null>(null);
  const requestIdRef = useRef(0);
  const [candidate, setCandidate] = useState<MapLocation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  const reverseGeocode = useCallback((longitude: number, latitude: number) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError('');
    geocoder.getAddress([longitude, latitude], (status, result) => {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
      if (status !== 'complete' || !isGeocodeResult(result)) {
        setCandidate(null);
        setError('没有识别到这个位置的详细地址，请移动地图后重试');
        return;
      }
      const regeocode = 'regeocode' in result ? result.regeocode : undefined;
      const address = regeocode?.formattedAddress?.trim();
      if (!address) {
        setCandidate(null);
        setError('没有识别到这个位置的详细地址，请移动地图后重试');
        return;
      }
      setCandidate({
        address,
        adcode: regeocode?.addressComponent?.adcode || '',
        district: regeocode?.addressComponent?.district || '',
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      });
    });
  }, []);

  useEffect(() => {
    if (!open || !config.enabled) return undefined;
    let active = true;
    setCandidate(null);
    setError('');
    setSearchText(initialLocation?.address || '平谷世纪广场');
    setLoading(true);

    void loadAMap(config)
      .then((AMap) => {
        if (!active || !containerRef.current) return;
        const center = toPosition(initialLocation);
        const geocoder = new AMap.Geocoder({ city: '北京市' });
        const map = new AMap.Map(containerRef.current, {
          center,
          resizeEnable: true,
          zoom: 16,
        });
        geocoderRef.current = geocoder;
        mapRef.current = map;
        map.on('moveend', () => {
          const current = map.getCenter();
          reverseGeocode(current.getLng(), current.getLat());
        });
        map.on('click', ({ lnglat }) => {
          map.setCenter([lnglat.getLng(), lnglat.getLat()]);
        });
        reverseGeocode(center[0], center[1]);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setLoading(false);
        setError(loadError instanceof Error ? loadError.message : '地图加载失败');
      });

    return () => {
      active = false;
      requestIdRef.current += 1;
      mapRef.current?.destroy();
      mapRef.current = null;
      geocoderRef.current = null;
    };
  }, [config, initialLocation, open, reverseGeocode]);

  const handleSearch = () => {
    const keyword = searchText.trim();
    const geocoder = geocoderRef.current;
    const map = mapRef.current;
    if (!keyword || !geocoder || !map) return;
    setSearching(true);
    setError('');
    geocoder.getLocation(keyword, (status, result) => {
      setSearching(false);
      if (
        status !== 'complete' ||
        !isGeocodeResult(result) ||
        !('geocodes' in result) ||
        !result.geocodes?.[0]?.location
      ) {
        setError('没有找到这个地址，请补充区县、道路或门牌号后重试');
        return;
      }
      const location = result.geocodes[0].location;
      map.setZoomAndCenter(17, [location.getLng(), location.getLat()]);
    });
  };

  return (
    <Modal
      centered
      destroyOnClose
      okButtonProps={{ disabled: !candidate || loading }}
      okText="使用这个位置"
      onCancel={onCancel}
      onOk={() => {
        if (candidate && onConfirm(candidate) !== false) onCancel();
      }}
      open={open}
      title={title}
      width={820}
    >
      {!config.enabled ? (
        <Alert
          message="地图服务尚未配置，请联系管理员配置高德地图 Key"
          showIcon
          type="warning"
        />
      ) : (
        <>
          <Space.Compact className="map-search" block>
            <Input
              onChange={(event) => setSearchText(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="搜索地点，例如：平谷区莲花潭村"
              value={searchText}
            />
            <Button
              icon={<SearchOutlined />}
              loading={searching}
              onClick={handleSearch}
              type="primary"
            >
              搜索
            </Button>
          </Space.Compact>
          <div className="map-picker-shell">
            <div className="map-picker-canvas" ref={containerRef} />
            <EnvironmentFilled className="map-center-pin" />
            {loading ? (
              <div className="map-loading"><Spin /></div>
            ) : null}
          </div>
          <Typography.Paragraph className="map-picker-hint" type="secondary">
            拖动地图或点击目标位置，让蓝色图钉落在准确地点上。
          </Typography.Paragraph>
          {error ? <Alert message={error} showIcon type="warning" /> : null}
          {candidate ? (
            <div className="map-location-result">
              <strong>{candidate.address}</strong>
              <span>
                {candidate.district || '区县待识别'} · {candidate.longitude}, {candidate.latitude}
              </span>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}
