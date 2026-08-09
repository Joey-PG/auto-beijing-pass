import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

import { formatDateTime } from '../status';
import type {
  Account,
  AuditEvent,
  AuditOutcome,
  AuditPageData,
  AuditQuery,
  Dashboard,
} from '../types';

const eventLabels: Record<string, string> = {
  account_removed: '删除账号',
  account_reauthenticated: '账号重新登录',
  account_initialized: '账号初始化',
  account_updated: '账号更新',
  audit_queried: '查询审计日志',
  config_changed: '续签配置变更',
  cron_account_completed: '自动检查完成',
  cron_account_failed: '自动检查失败',
  cron_account_selected: '选中自动检查账号',
  cron_configuration_failed: '自动调度配置失败',
  cron_configured: '自动调度配置完成',
  cron_removal_failed: '移除自动调度失败',
  cron_removed: '自动调度已移除',
  cron_tick_completed: '定时检查完成',
  cron_tick_failed: '定时检查失败',
  cron_tick_skipped: '跳过定时检查',
  notification_channel_added: '添加通知渠道',
  notification_channel_removed: '移除通知渠道',
  notification_failed: '通知发送失败',
  notification_sent: '通知发送成功',
  notification_tested: '通知渠道测试',
  preferred_vehicle_changed: '首选车辆变更',
  renewal_check_started: '开始检查续签',
  renewal_dry_run: '续签预演',
  renewal_failed: '续签失败',
  renewal_skipped: '检查完成，无需续签',
  renewal_submitted: '已提交续签申请',
  trip_profile_changed: '出行配置变更',
  vehicle_added: '添加车辆',
  vehicle_plate_swapped: '车辆换牌',
  vehicle_removed: '删除车辆',
  web_started: '管理后台启动',
};

const reasonLabels: Record<string, string> = {
  already_run_today: '今天已经完成检查',
  another_tick_is_running: '已有定时检查正在运行',
  auto_renew_disabled: '账号未开启自动续签',
  not_due: '当前证件暂不需要续签',
  outside_random_window: '当前不在随机执行时段内',
};

const outcomePresentation: Record<
  AuditOutcome,
  { color: string; label: string }
> = {
  failure: { color: 'error', label: '失败' },
  in_progress: { color: 'processing', label: '进行中' },
  partial_failure: { color: 'warning', label: '部分失败' },
  skipped: { color: 'default', label: '已跳过' },
  success: { color: 'success', label: '成功' },
};

function getOutcome(item: AuditEvent): AuditOutcome {
  if (item.level === 'error' || item.result === 'failure') return 'failure';
  if (item.result === 'partial_failure') return 'partial_failure';
  if (item.result === 'skipped') return 'skipped';
  if (item.result === 'started' || item.result === 'selected') {
    return 'in_progress';
  }
  return 'success';
}

function getAuditDescription(item: AuditEvent) {
  const description = item.reason || item.error;
  return description ? reasonLabels[description] || description : '—';
}

interface AuditPageProps {
  accounts: Account[];
  data: AuditPageData;
  loading: boolean;
  onQuery: (query: AuditQuery) => Promise<void>;
}

export function AuditPage({ accounts, data, loading, onQuery }: AuditPageProps) {
  const [account, setAccount] = useState('');
  const [event, setEvent] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [since, setSince] = useState('30d');
  const [status, setStatus] = useState<AuditOutcome | ''>('');

  const query: AuditQuery = {
    account: account || undefined,
    event: event || undefined,
    page,
    pageSize,
    since,
    status: status || undefined,
  };

  useEffect(() => {
    void onQuery(query);
  }, [account, event, onQuery, page, pageSize, since, status]);

  const resetPage = (update: () => void) => {
    setPage(1);
    update();
  };

  const columns: ColumnsType<AuditEvent> = [
    {
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => formatDateTime(timestamp),
      title: '执行时间',
      width: 150,
    },
    {
      dataIndex: 'account',
      key: 'account',
      render: (value?: string) => value || '系统任务',
      title: '账号',
      width: 150,
    },
    {
      dataIndex: 'event',
      key: 'event',
      render: (event: string) => eventLabels[event] || event,
      title: '事件',
      width: 220,
    },
    {
      dataIndex: 'reason',
      key: 'reason',
      render: (_, item) => getAuditDescription(item),
      title: '说明',
    },
    {
      key: 'result',
      render: (_, item) => {
        const presentation = outcomePresentation[getOutcome(item)];
        return <Tag color={presentation.color}>{presentation.label}</Tag>;
      },
      title: '结果',
      width: 90,
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1>运行记录</h1>
          <p>查询最近 30 天的自动检查、续签和配置操作</p>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => onQuery(query)}>
          刷新
        </Button>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <div className="table-toolbar">
          <Select
            onChange={(value) => resetPage(() => setAccount(value))}
            options={[
              { label: '全部账号', value: '' },
              ...accounts.map((item) => ({ label: item.name, value: item.name })),
            ]}
            value={account}
          />
          <Select
            onChange={(value) => resetPage(() => setStatus(value))}
            options={[
              { label: '全部结果', value: '' },
              { label: '成功', value: 'success' },
              { label: '失败', value: 'failure' },
              { label: '部分失败', value: 'partial_failure' },
              { label: '已跳过', value: 'skipped' },
              { label: '进行中', value: 'in_progress' },
            ]}
            value={status}
          />
          <Select
            onChange={(value) => resetPage(() => setEvent(value))}
            options={[
              { label: '全部事件', value: '' },
              ...Object.entries(eventLabels).map(([value, label]) => ({
                label,
                value,
              })),
            ]}
            showSearch
            value={event}
          />
          <Select
            onChange={(value) => resetPage(() => setSince(value))}
            options={[
              { label: '最近 7 天', value: '7d' },
              { label: '最近 30 天', value: '30d' },
              { label: '最近 90 天', value: '90d' },
            ]}
            value={since}
          />
        </div>
        <Table
          columns={columns}
          dataSource={data.items}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无运行记录" /> }}
          pagination={{
            current: data.page,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize === pageSize ? nextPage : 1);
              setPageSize(nextPageSize);
            },
            pageSize: data.pageSize,
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            total: data.total,
          }}
          rowKey={(item) =>
            `${item.run_id || 'event'}-${item.timestamp}-${item.event}-${item.account || ''}`
          }
          scroll={{ x: 760 }}
        />
      </Card>
    </div>
  );
}

interface SystemPageProps {
  dashboard: Dashboard;
}

export function SystemPage({ dashboard }: SystemPageProps) {
  const { schedule } = dashboard;
  return (
    <div className="page-shell system-page">
      <div className="page-heading">
        <div>
          <h1>系统设置</h1>
          <p>查看当前无数据库运行模式与自动调度状态</p>
        </div>
      </div>
      <div className="system-card-grid">
        <Card title={<Space><ClockCircleOutlined />自动调度</Space>}>
          <div className="system-status-row">
            <Tag color={schedule.active ? 'success' : 'default'}>
              {schedule.active ? '运行中' : '未启用'}
            </Tag>
          </div>
          <Descriptions column={1} colon={false}>
            <Descriptions.Item label="执行计划">
              {schedule.description || '尚未设置定时任务'}
            </Descriptions.Item>
            <Descriptions.Item label="随机时段">
              {schedule.randomWindow || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="重启补偿">
              {schedule.catchUpEnabled ? '已启用' : '未启用'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Card title={<Space><CloudServerOutlined />运行模式</Space>}>
          <Descriptions column={1} colon={false}>
            <Descriptions.Item label="数据存储">本地配置文件 + JSONL 日志</Descriptions.Item>
            <Descriptions.Item label="业务数据">实时读取北京交管接口</Descriptions.Item>
            <Descriptions.Item label="最近同步">
              {formatDateTime(dashboard.generatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Card title={<Space><SafetyCertificateOutlined />安全状态</Space>}>
          <Space direction="vertical" size={12}>
            <span><CheckCircleOutlined className="success-icon" /> 北京通密码仅通过 HTTPS 提交</span>
            <span><CheckCircleOutlined className="success-icon" /> 业务 token 不返回浏览器</span>
            <span><CheckCircleOutlined className="success-icon" /> 磁盘日志保持敏感信息脱敏</span>
            <span><ExclamationCircleOutlined className="warning-icon" /> 公网访问必须配置 HTTPS</span>
          </Space>
        </Card>
      </div>
    </div>
  );
}
