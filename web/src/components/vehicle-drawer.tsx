import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Alert,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Modal,
  Select,
  Switch,
  Tabs,
  Tag,
  Timeline,
} from 'antd';
import { useEffect, useState } from 'react';

import { formatDateTime, getLatestRecord, getVehicleStatus } from '../status';
import type { Account, MapConfig, TripProfileInput, Vehicle } from '../types';
import { TripProfileFields, tripProfileToInput } from './trip-profile-fields';

type RenewalFormValues = TripProfileInput & { saveAsDefault?: boolean };

interface VehicleDrawerProps {
  account: Account | null;
  loading: boolean;
  mapConfig: MapConfig;
  onClose: () => void;
  onRenew: (
    vehicle: Vehicle,
    tripProfile: TripProfileInput,
    saveAsDefault: boolean,
  ) => Promise<boolean>;
  onUpdate: (
    accountId: string,
    values: Record<string, boolean | string>,
    successMessage: string,
  ) => Promise<void>;
  open: boolean;
  vehicle: Vehicle | null;
}

export function VehicleDrawer({
  account,
  loading,
  mapConfig,
  onClose,
  onRenew,
  onUpdate,
  open,
  vehicle,
}: VehicleDrawerProps) {
  const [renewForm] = Form.useForm<RenewalFormValues>();
  const [renewOpen, setRenewOpen] = useState(false);

  useEffect(() => {
    if (renewOpen) {
      renewForm.setFieldsValue({
        ...tripProfileToInput(account?.tripProfile || null),
        saveAsDefault: false,
      });
    }
  }, [account, renewForm, renewOpen]);

  if (!vehicle || !account) return null;

  const record = getLatestRecord(vehicle);
  const status = getVehicleStatus(vehicle);
  const profile = account.tripProfile;

  const overview = (
    <div className="drawer-tab-content">
      <section className="drawer-section drawer-status-section">
        <div className="section-title-row">
          <h3>当前证件状态</h3>
          <Tag color={status.color}>{status.label}</Tag>
        </div>
        <Descriptions column={2} colon={false} size="small">
          <Descriptions.Item label="进京证有效期">
            {record ? `${record.validFrom || '—'} 至 ${record.validTo || '—'}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="剩余申请次数">
            {vehicle.remainingTimes || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="号牌类型">
            {vehicle.licensePlateTypeName || vehicle.licensePlateType || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="本年度已办理">
            {vehicle.usedTimes}
          </Descriptions.Item>
          <Descriptions.Item label="发动机号">
            {vehicle.engineNumber || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="注册日期">
            {vehicle.registrationDate || '—'}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section className="drawer-section">
        <div className="section-title-row">
          <h3>续签配置</h3>
        </div>
        <div className="setting-row">
          <div>
            <strong>自动续签</strong>
            <span>该开关对所属账号生效</span>
          </div>
          <Switch
            checked={account.autoRenew}
            disabled={account.membershipStatus === 'expired'}
            loading={loading}
            onChange={(checked) =>
              onUpdate(
                account.id,
                { autoRenew: checked },
                checked ? '自动续签已开启' : '自动续签已关闭',
              )
            }
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>服务有效期</strong>
            <span>{account.membershipPermanent
              ? '长期有效'
              : `至 ${account.membershipExpiresOn || '—'}`}</span>
          </div>
          <Tag color={account.membershipStatus === 'expired' ? 'error' : 'success'}>
            {account.membershipStatus === 'expired' ? '已到期' : '有效'}
          </Tag>
        </div>
        <div className="setting-row">
          <div>
            <strong>进京证类型</strong>
            <span>下次提交时使用</span>
          </div>
          <Select
            onChange={(entryType) =>
              onUpdate(account.id, { entryType }, '进京证类型已更新')
            }
            options={[
              { label: '六环外', value: '六环外' },
              { label: '六环内', value: '六环内' },
            ]}
            value={account.entryType}
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>首选车辆</strong>
            <span>账号有多辆车时优先使用</span>
          </div>
          {vehicle.preferred ? (
            <Tag color="blue">当前首选</Tag>
          ) : (
            <Button
              loading={loading}
              onClick={() =>
                onUpdate(
                  account.id,
                  { preferredVehicle: vehicle.licenseNumber },
                  '首选车辆已更新',
                )
              }
              type="link"
            >
              设为首选
            </Button>
          )}
        </div>
      </section>

      <section className="drawer-section">
        <div className="section-title-row">
          <h3>出行配置</h3>
        </div>
        <Descriptions column={1} colon={false} size="small">
          <Descriptions.Item label="在京地址">
            {profile?.in_beijing_address.address || '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label="进京目的地">
            {profile?.destination.address || '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label="目的地区县">
            {profile?.destination.area || '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label="进京目的">
            {profile?.purpose.name || '未配置'}
          </Descriptions.Item>
        </Descriptions>
      </section>
    </div>
  );

  const history = (
    <div className="drawer-tab-content history-content">
      {vehicle.records.length === 0 ? (
        <Empty description="暂无续签历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          items={vehicle.records.map((item, index) => ({
            color: index === 0 ? 'green' : 'gray',
            dot: index === 0 ? <CheckCircleFilled /> : <ClockCircleOutlined />,
            children: (
              <div className="history-item">
                <div className="history-title-row">
                  <strong>{item.statusName || '状态未知'}</strong>
                  <Tag>{item.entryTypeName || account.entryType}</Tag>
                </div>
                <p>{item.validFrom || '—'} 至 {item.validTo || '—'}</p>
                <span>申请时间：{item.applyTime || '—'}</span>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );

  const configuration = (
    <div className="drawer-tab-content">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="所属账号">{account.name}</Descriptions.Item>
        <Descriptions.Item label="脱敏手机号">{account.phone}</Descriptions.Item>
        <Descriptions.Item label="账号续签类型">{account.entryType}</Descriptions.Item>
        <Descriptions.Item label="首选车辆">
          {account.preferredVehicle || '未设置'}
        </Descriptions.Item>
        <Descriptions.Item label="最近执行">
          {vehicle.lastExecution
            ? formatDateTime(vehicle.lastExecution.timestamp)
            : '暂无记录'}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );

  return (
    <>
      <Drawer
      className="vehicle-detail-drawer"
      destroyOnClose
      mask={false}
      onClose={onClose}
      open={open}
      title={
        <div className="drawer-title">
          <span>车辆详情</span>
          <strong>{vehicle.licenseNumber}</strong>
          <small>所属账号：{account.name} · {account.phone}</small>
        </div>
      }
      width={410}
    >
      <div className="drawer-primary-action">
        <Button
          block
          disabled={account.membershipStatus === 'expired'}
          icon={<ThunderboltOutlined />}
          loading={loading}
          onClick={() => setRenewOpen(true)}
          size="large"
          type="primary"
        >
          {account.membershipStatus === 'expired' ? '服务已到期' : '立即检查 / 续签'}
        </Button>
      </div>
      <Tabs
        items={[
          { children: overview, key: 'overview', label: '概览' },
          {
            children: history,
            key: 'history',
            label: `续签历史 (${vehicle.records.length})`,
          },
          { children: configuration, key: 'configuration', label: '配置' },
        ]}
      />
      </Drawer>
      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="确认检查并续签"
        onCancel={() => setRenewOpen(false)}
        onOk={() => renewForm.submit()}
        open={renewOpen}
        title={`确认本次出行信息 · ${vehicle.licenseNumber}`}
        width={720}
      >
        <Alert
          className="modal-inline-alert"
          message={account.tripProfileConfigured
            ? '以下内容已从账号默认配置带入，本次可以临时修改。'
            : '该账号尚未保存默认出行配置，请填写本次申请信息。'}
          showIcon
          type={account.tripProfileConfigured ? 'info' : 'warning'}
        />
        <Form
          className="trip-profile-form"
          form={renewForm}
          layout="vertical"
          onFinish={async ({ saveAsDefault = false, ...values }) => {
            if (await onRenew(vehicle, values, saveAsDefault)) {
              setRenewOpen(false);
            }
          }}
          preserve={false}
        >
          <TripProfileFields mapConfig={mapConfig} />
          <Form.Item name="saveAsDefault" valuePropName="checked">
            <Checkbox>同时保存为该账号的默认出行配置</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
