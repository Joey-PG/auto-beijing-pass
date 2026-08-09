import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

import { formatDateTime, getLatestRecord, getVehicleStatus } from '../status';
import type { Account, Dashboard, Vehicle } from '../types';

interface VehiclePageProps {
  dashboard: Dashboard;
  loading: boolean;
  onAdd: () => void;
  onRefresh: () => void;
  onSelect: (vehicle: Vehicle) => void;
  onToggleAutoRenew: (account: Account, checked: boolean) => Promise<void>;
  selectedVehicleId: string | null;
}

export function VehiclePage({
  dashboard,
  loading,
  onAdd,
  onRefresh,
  onSelect,
  onToggleAutoRenew,
  selectedVehicleId,
}: VehiclePageProps) {
  const [accountFilter, setAccountFilter] = useState<string>();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const vehicles = useMemo(
    () => dashboard.accounts.flatMap((account) => account.vehicles),
    [dashboard.accounts],
  );
  const accountMap = useMemo(
    () => new Map(dashboard.accounts.map((account) => [account.id, account])),
    [dashboard.accounts],
  );
  const filteredVehicles = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery =
        !keyword ||
        vehicle.licenseNumber.toLowerCase().includes(keyword) ||
        vehicle.accountName.toLowerCase().includes(keyword);
      const matchesAccount = !accountFilter || vehicle.accountId === accountFilter;
      const matchesStatus =
        !statusFilter || getVehicleStatus(vehicle).key === statusFilter;
      return matchesQuery && matchesAccount && matchesStatus;
    });
  }, [accountFilter, query, statusFilter, vehicles]);

  const activeCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle).key === 'active',
  ).length;
  const pendingCount = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle).key === 'pending',
  ).length;
  const attentionVehicles = vehicles.filter(
    (vehicle) => getVehicleStatus(vehicle).key === 'attention',
  );

  const columns: ColumnsType<Vehicle> = [
    {
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
      render: (licenseNumber: string, vehicle) => (
        <Space size={8}>
          <strong className="plate-number">{licenseNumber}</strong>
          {vehicle.preferred ? <Tag color="blue">首选</Tag> : null}
        </Space>
      ),
      title: '车牌号',
      width: 110,
    },
    {
      dataIndex: 'accountName',
      key: 'accountName',
      render: (accountName: string, vehicle) => {
        const account = accountMap.get(vehicle.accountId);
        return (
          <div className="account-cell">
            <strong>{accountName}</strong>
            <span>{account?.phone || '—'}</span>
          </div>
        );
      },
      title: '所属账号',
      width: 105,
    },
    {
      key: 'status',
      render: (_, vehicle) => {
        const status = getVehicleStatus(vehicle);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
      title: '证件状态',
      width: 115,
    },
    {
      key: 'validity',
      render: (_, vehicle) => {
        const record = getLatestRecord(vehicle);
        return record ? (
          <div className="validity-cell">
            <span>{record.validFrom || '—'}</span>
            <span>至 {record.validTo || '—'}</span>
          </div>
        ) : (
          '—'
        );
      },
      title: '有效期',
      width: 120,
    },
    {
      dataIndex: 'remainingTimes',
      key: 'remainingTimes',
      render: (remainingTimes: string) => remainingTimes || '—',
      title: '剩余次数',
      width: 65,
    },
    {
      key: 'autoRenew',
      render: (_, vehicle) => {
        const account = accountMap.get(vehicle.accountId);
        if (!account) return '—';
        return (
          <Tooltip title="此开关对所属账号生效">
            <span onClick={(event) => event.stopPropagation()}>
              <Switch
                checked={account.autoRenew}
                onChange={(checked) => onToggleAutoRenew(account, checked)}
                size="small"
              />
            </span>
          </Tooltip>
        );
      },
      title: '自动续签',
      width: 75,
    },
    {
      key: 'lastExecution',
      render: (_, vehicle) => (
        <div className="last-run-cell">
          <span>{formatDateTime(vehicle.lastExecution?.timestamp)}</span>
          {vehicle.lastExecution ? (
            <small>{vehicle.lastExecution.result === 'failure' ? '执行失败' : '执行完成'}</small>
          ) : null}
        </div>
      ),
      title: '最近执行',
      width: 95,
    },
    {
      fixed: 'right',
      key: 'action',
      render: (_, vehicle) => (
        <Button onClick={() => onSelect(vehicle)} type="link">
          查看
        </Button>
      ),
      title: '操作',
      width: 55,
    },
  ];

  const metrics = [
    { color: 'blue', icon: <CarOutlined />, label: '全部车辆', value: vehicles.length },
    { color: 'green', icon: <CheckCircleOutlined />, label: '证件有效', value: activeCount },
    { color: 'orange', icon: <ClockCircleOutlined />, label: '待生效', value: pendingCount },
    { color: 'red', icon: <ExclamationCircleOutlined />, label: '需处理', value: attentionVehicles.length },
  ];

  return (
    <div className="page-shell vehicle-page">
      <div className="page-heading">
        <div>
          <h1>车辆续签管理</h1>
          <p>集中查看车辆证件状态，并在需要时执行续签</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
            刷新
          </Button>
          <Button icon={<PlusOutlined />} onClick={onAdd} type="primary">
            添加车辆
          </Button>
        </Space>
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <Card className={`metric-card metric-${metric.color}`} key={metric.label}>
            <div className="metric-icon">{metric.icon}</div>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </Card>
        ))}
      </div>

      <Card className="vehicle-table-card" styles={{ body: { padding: 0 } }}>
        <div className="table-toolbar">
          <Input
            allowClear
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索车牌 / 账号"
            prefix={<SearchOutlined />}
            value={query}
          />
          <Select
            allowClear
            onChange={(value) => setAccountFilter(value || undefined)}
            options={[
              { label: '全部账号', value: '' },
              ...dashboard.accounts.map((account) => ({
                label: account.name,
                value: account.id,
              })),
            ]}
            placeholder="全部账号"
            value={accountFilter}
          />
          <Select
            allowClear
            onChange={(value) => setStatusFilter(value || undefined)}
            options={[
              { label: '全部状态', value: '' },
              { label: '证件有效', value: 'active' },
              { label: '待生效 / 审核中', value: 'pending' },
              { label: '需要处理', value: 'attention' },
            ]}
            placeholder="全部状态"
            value={statusFilter}
          />
          <Button
            onClick={() => {
              setQuery('');
              setAccountFilter(undefined);
              setStatusFilter(undefined);
            }}
          >
            重置
          </Button>
        </div>
        <Table<Vehicle>
          columns={columns}
          dataSource={filteredVehicles}
          loading={loading}
          onRow={(vehicle) => ({
            onClick: () => onSelect(vehicle),
          })}
          pagination={{
            hideOnSinglePage: true,
            pageSize: 20,
            showTotal: (total) => `共 ${total} 辆`,
          }}
          rowClassName={(vehicle) =>
            vehicle.vehicleId === selectedVehicleId ? 'selected-vehicle-row' : ''
          }
          rowKey={(vehicle) => `${vehicle.accountId}-${vehicle.vehicleId}`}
          scroll={{ x: 740 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
