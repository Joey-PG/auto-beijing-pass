import { Divider, Form, Input } from 'antd';

import type { TripProfile, TripProfileInput } from '../types';

const coordinateRules = (label: string, min: number, max: number) => [
  { required: true, message: `请输入${label}` },
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

export function TripProfileFields() {
  return (
    <>
      <Divider orientation="left" plain>当前在京地址</Divider>
      <Form.Item
        label="在京地址"
        name="inBeijingAddress"
        rules={[{ required: true, message: '请输入当前在京地址' }]}
      >
        <Input maxLength={200} placeholder="请输入真实、完整的在京地址" />
      </Form.Item>
      <div className="form-grid">
        <Form.Item
          label="经度"
          name="inBeijingLongitude"
          rules={coordinateRules('在京地址经度', -180, 180)}
        >
          <Input inputMode="decimal" placeholder="例如：116.397128" />
        </Form.Item>
        <Form.Item
          label="纬度"
          name="inBeijingLatitude"
          rules={coordinateRules('在京地址纬度', -90, 90)}
        >
          <Input inputMode="decimal" placeholder="例如：39.916527" />
        </Form.Item>
      </div>

      <Divider orientation="left" plain>进京目的地</Divider>
      <Form.Item
        label="目的地地址"
        name="destinationAddress"
        rules={[{ required: true, message: '请输入进京目的地' }]}
      >
        <Input maxLength={200} placeholder="请输入本次常用进京目的地" />
      </Form.Item>
      <div className="form-grid">
        <Form.Item
          label="目的地区县"
          name="destinationArea"
          rules={[{ required: true, message: '请输入目的地区县' }]}
        >
          <Input maxLength={40} placeholder="例如：朝阳区" />
        </Form.Item>
        <Form.Item
          extra="北京交管小程序使用的区县字典代码"
          label="区县代码"
          name="districtCode"
          rules={[{ required: true, message: '请输入区县代码' }]}
        >
          <Input maxLength={20} placeholder="例如：014" />
        </Form.Item>
        <Form.Item
          label="经度"
          name="destinationLongitude"
          rules={coordinateRules('目的地经度', -180, 180)}
        >
          <Input inputMode="decimal" placeholder="例如：116.397128" />
        </Form.Item>
        <Form.Item
          label="纬度"
          name="destinationLatitude"
          rules={coordinateRules('目的地纬度', -90, 90)}
        >
          <Input inputMode="decimal" placeholder="例如：39.916527" />
        </Form.Item>
      </div>

      <Divider orientation="left" plain>进京目的</Divider>
      <div className="form-grid">
        <Form.Item
          label="目的名称"
          name="purposeName"
          rules={[{ required: true, message: '请输入进京目的' }]}
        >
          <Input maxLength={40} placeholder="例如：其它" />
        </Form.Item>
        <Form.Item
          extra="北京交管小程序使用的目的字典代码"
          label="目的代码"
          name="purposeCode"
          rules={[{ required: true, message: '请输入进京目的代码' }]}
        >
          <Input maxLength={20} placeholder="例如：06" />
        </Form.Item>
      </div>
    </>
  );
}
