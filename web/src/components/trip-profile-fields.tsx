import { EnvironmentOutlined } from '@ant-design/icons';
import { App, Button, Divider, Form, Input, Select } from 'antd';
import { useMemo, useState } from 'react';

import { getBeijingDistrict, TRIP_PURPOSES } from '../trip-options';
import type { MapConfig, TripProfile, TripProfileInput } from '../types';
import {
  MapLocationPicker,
  type MapLocation,
} from './map-location-picker';

const coordinateRules = (label: string, min: number, max: number) => [
  { required: true, message: `请选择${label}` },
  {
    validator: (_: unknown, value: string) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
        return Promise.reject(new Error(`${label}格式不正确`));
      }
      return Promise.resolve();
    },
  },
];

export function tripProfileToInput(
  profile: TripProfile | null,
): Partial<TripProfileInput> {
  if (!profile) {
    return { purposeCode: '06', purposeName: '其它' };
  }
  return {
    destinationAddress: profile.destination.address,
    destinationArea: profile.destination.area,
    destinationLatitude: profile.destination.latitude,
    destinationLongitude: profile.destination.longitude,
    districtCode: profile.destination.district_code,
    inBeijingAddress: profile.in_beijing_address.address,
    inBeijingLatitude: profile.in_beijing_address.latitude,
    inBeijingLongitude: profile.in_beijing_address.longitude,
    purposeCode: profile.purpose.code,
    purposeName: profile.purpose.name,
  };
}

interface TripProfileFieldsProps {
  mapConfig: MapConfig;
}

type LocationKind = 'destination' | 'inBeijing';

export function TripProfileFields({ mapConfig }: TripProfileFieldsProps) {
  const { message } = App.useApp();
  const form = Form.useFormInstance<TripProfileInput>();
  const [picker, setPicker] = useState<LocationKind | null>(null);
  const purposeCode = Form.useWatch('purposeCode', form);
  const purposeName = Form.useWatch('purposeName', form);

  const purposeOptions = useMemo(() => {
    const options = [...TRIP_PURPOSES];
    if (
      purposeCode &&
      purposeName &&
      !options.some((option) => option.code === purposeCode)
    ) {
      options.push({ code: purposeCode, name: purposeName });
    }
    return options.map((option) => ({
      label: `${option.name}（${option.code}）`,
      name: option.name,
      value: option.code,
    }));
  }, [purposeCode, purposeName]);

  const initialLocation = picker === 'inBeijing'
    ? {
        address: form.getFieldValue('inBeijingAddress'),
        latitude: form.getFieldValue('inBeijingLatitude'),
        longitude: form.getFieldValue('inBeijingLongitude'),
      }
    : {
        address: form.getFieldValue('destinationAddress'),
        district: form.getFieldValue('destinationArea'),
        latitude: form.getFieldValue('destinationLatitude'),
        longitude: form.getFieldValue('destinationLongitude'),
      };

  const selectLocation = (location: MapLocation) => {
    if (picker === 'inBeijing') {
      form.setFieldsValue({
        inBeijingAddress: location.address,
        inBeijingLatitude: location.latitude,
        inBeijingLongitude: location.longitude,
      });
      return true;
    }
    const district = getBeijingDistrict(location.district);
    if (!district) {
      message.error('进京目的地必须位于北京市行政区内');
      return false;
    }
    form.setFieldsValue({
      destinationAddress: location.address,
      destinationArea: district.name,
      destinationLatitude: location.latitude,
      destinationLongitude: location.longitude,
      districtCode: district.code,
    });
    return true;
  };

  const mapButton = (kind: LocationKind) => (
    <Button
      disabled={!mapConfig.enabled}
      icon={<EnvironmentOutlined />}
      onClick={() => setPicker(kind)}
      type="link"
    >
      地图选点
    </Button>
  );

  return (
    <>
      <Divider orientation="left" plain>当前在京地址</Divider>
      <Form.Item
        extra={mapConfig.enabled ? '搜索地址、点击地图或拖动地图精确选点' : '地图服务未配置，可手动填写'}
        label="在京地址"
        name="inBeijingAddress"
        rules={[{ required: true, message: '请选择当前在京地址' }]}
      >
        <Input
          addonAfter={mapButton('inBeijing')}
          maxLength={200}
          placeholder="请选择真实、完整的在京地址"
          readOnly={mapConfig.enabled}
        />
      </Form.Item>
      <div className="form-grid coordinate-grid">
        <Form.Item
          label="经度"
          name="inBeijingLongitude"
          rules={coordinateRules('在京地址经度', -180, 180)}
        >
          <Input inputMode="decimal" placeholder="地图选点后自动填写" readOnly={mapConfig.enabled} />
        </Form.Item>
        <Form.Item
          label="纬度"
          name="inBeijingLatitude"
          rules={coordinateRules('在京地址纬度', -90, 90)}
        >
          <Input inputMode="decimal" placeholder="地图选点后自动填写" readOnly={mapConfig.enabled} />
        </Form.Item>
      </div>

      <Divider orientation="left" plain>进京目的地</Divider>
      <Form.Item
        extra={mapConfig.enabled ? '选择后会自动识别区县，并填写交管区县代码' : '地图服务未配置，可手动填写'}
        label="目的地地址"
        name="destinationAddress"
        rules={[{ required: true, message: '请选择进京目的地' }]}
      >
        <Input
          addonAfter={mapButton('destination')}
          maxLength={200}
          placeholder="请选择本次常用进京目的地"
          readOnly={mapConfig.enabled}
        />
      </Form.Item>
      <div className="form-grid">
        <Form.Item
          label="目的地区县"
          name="destinationArea"
          rules={[{ required: true, message: '请选择目的地区县' }]}
        >
          <Input maxLength={40} placeholder="地图选点后自动填写" readOnly={mapConfig.enabled} />
        </Form.Item>
        <Form.Item
          extra="北京交管小程序使用的区县字典代码"
          label="区县代码"
          name="districtCode"
          rules={[{ required: true, message: '请选择目的地区县' }]}
        >
          <Input maxLength={20} placeholder="自动匹配" readOnly={mapConfig.enabled} />
        </Form.Item>
        <Form.Item
          label="经度"
          name="destinationLongitude"
          rules={coordinateRules('目的地经度', -180, 180)}
        >
          <Input inputMode="decimal" placeholder="地图选点后自动填写" readOnly={mapConfig.enabled} />
        </Form.Item>
        <Form.Item
          label="纬度"
          name="destinationLatitude"
          rules={coordinateRules('目的地纬度', -90, 90)}
        >
          <Input inputMode="decimal" placeholder="地图选点后自动填写" readOnly={mapConfig.enabled} />
        </Form.Item>
      </div>

      <Divider orientation="left" plain>进京目的</Divider>
      <Form.Item
        extra="名称和代码会作为一组保存，无需分别填写"
        label="进京目的"
        name="purposeCode"
        rules={[{ required: true, message: '请选择进京目的' }]}
      >
        <Select
          onChange={(code) => {
            const selected = purposeOptions.find((option) => option.value === code);
            form.setFieldValue('purposeName', selected?.name || '');
          }}
          options={purposeOptions}
          placeholder="请选择进京目的"
        />
      </Form.Item>
      <Form.Item hidden name="purposeName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <MapLocationPicker
        config={mapConfig}
        initialLocation={initialLocation}
        onCancel={() => setPicker(null)}
        onConfirm={selectLocation}
        open={Boolean(picker)}
        title={picker === 'inBeijing' ? '选择当前在京地址' : '选择进京目的地'}
      />
    </>
  );
}
