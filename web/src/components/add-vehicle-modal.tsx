import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';

import type { Account } from '../types';

interface AddVehicleModalProps {
  accounts: Account[];
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  open: boolean;
}

export function AddVehicleModal({
  accounts,
  loading,
  onCancel,
  onSubmit,
  open,
}: AddVehicleModalProps) {
  const [form] = Form.useForm<Record<string, string>>();

  useEffect(() => {
    if (open && accounts[0]) {
      form.setFieldValue('accountId', accounts[0].id);
    }
  }, [accounts, form, open]);

  const handleFinish = async (values: Record<string, string>) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      centered
      destroyOnClose
      maskClosable={!loading}
      okButtonProps={{ loading }}
      okText="确认添加"
      onCancel={onCancel}
      onOk={() => form.submit()}
      open={open}
      title="添加续签车辆"
      width={640}
    >
      <p className="modal-description">
        车辆信息会直接提交到所选账号，不会写入本地数据库。
      </p>
      <Form
        className="vehicle-form"
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
      >
        <Form.Item
          label="所属账号"
          name="accountId"
          rules={[{ required: true, message: '请选择所属账号' }]}
        >
          <Select
            options={accounts.map((account) => ({
              label: `${account.name} · ${account.phone}`,
              value: account.id,
            }))}
          />
        </Form.Item>
        <div className="form-grid">
          <Form.Item
            label="车牌号码"
            name="licenseNumber"
            normalize={(value) => String(value || '').trim().toUpperCase()}
            rules={[{ required: true, message: '请输入车牌号码' }]}
          >
            <Input maxLength={8} placeholder="京A12345" />
          </Form.Item>
          <Form.Item
            label="发动机号后 6 位"
            name="engineNumber"
            rules={[{ required: true, message: '请输入发动机号后 6 位' }]}
          >
            <Input maxLength={32} placeholder="A12B34" />
          </Form.Item>
          <Form.Item
            extra="交管接口绑定车辆时必填，管理列表不展示"
            label="品牌型号"
            name="brand"
            rules={[{ required: true, message: '请输入品牌型号' }]}
          >
            <Input maxLength={64} placeholder="例如：TESLA" />
          </Form.Item>
          <Form.Item
            label="注册日期"
            name="registrationDate"
            rules={[{ required: true, message: '请选择注册日期' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            initialValue="02"
            label="号牌类型"
            name="licensePlateType"
          >
            <Select
              options={[
                { label: '小型汽车', value: '02' },
                { label: '小型新能源汽车', value: '52' },
                { label: '大型汽车', value: '01' },
                { label: '大型新能源汽车', value: '51' },
                { label: '外籍汽车', value: '06' },
                { label: '低速车', value: '13' },
              ]}
            />
          </Form.Item>
          <Form.Item initialValue="01" label="车辆类型" name="vehicleType">
            <Select
              options={[
                { label: '客车', value: '01' },
                { label: '货车', value: '02' },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
