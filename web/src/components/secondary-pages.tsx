import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
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
  SchedulerAccountInfo,
  SchedulerAccountStatus,
} from '../types';

const eventLabels: Record<string, string> = {
  account_removed: '删除账号',
  account_reauthenticated: '账号重新登录',
  account_initialized: '账号初始化',
  account_updated: '账号更新',
  membership_expiry_reminder: '服务到期提醒',
  membership_extended: '服务有效期变更',
  audit_queried: '查询审计日志',
  config_changed: '续签配置变更',
  cron_account_completed: '账号自动检查完成',
  cron_account_failed: '账号自动检查失败',
  cron_account_selected: '账号进入自动检查',
  cron_configuration_failed: '自动调度配置失败',
  cron_configured: '自动调度配置完成',
  cron_removal_failed: '移除自动调度失败',
  cron_removed: '自动调度已移除',
  cron_tick_completed: '定时调度轮询完成',
  cron_tick_failed: '定时调度轮询失败',
  cron_tick_skipped: '跳过定时调度轮询',
  notification_channel_added: '添加通知渠道',
  notification_channel_removed: '移除通知渠道',
  notification_failed: '通知发送失败',
  notification_sent: '通知发送成功',
  notification_tested: '通知渠道测试',
  preferred_vehicle_changed: '首选车辆变更',
  renewal_check_started: '开始检查续签',
  renewal_dry_run: '续签预演',
  renewal_failed: '续签失败',
  renewal_skipped: '续签检查完成（无需提交）',
  renewal_submitted: '续签申请已提交',
  trip_profile_changed: '出行配置变更',
  vehicle_added: '添加车辆',
  vehicle_plate_swapped: '车辆换牌',
  vehicle_removed: '删除车辆',
  web_login_blocked: '后台登录已拦截',
  web_login_failed: '后台登录失败',
  web_login_succeeded: '后台登录成功',
  web_logout: '退出后台',
  web_started: '管理后台启动',
};

const eventGroups = [
  {
    events: [
      'renewal_failed',
      'cron_account_failed',
      'cron_configuration_failed',
      'cron_removal_failed',
      'cron_tick_failed',
      'notification_failed',
      'web_login_failed',
      'web_login_blocked',
    ],
    label: '异常事件',
    value: 'group:attention',
  },
  {
    events: [
      'renewal_check_started',
      'renewal_dry_run',
      'renewal_failed',
      'renewal_skipped',
      'renewal_submitted',
    ],
    label: '续签结果',
    value: 'group:renewal',
  },
  {
    events: [
      'cron_account_selected',
      'cron_account_completed',
      'cron_account_failed',
    ],
    label: '自动检查',
    value: 'group:auto-check',
  },
  {
    events: [
      'account_updated',
      'config_changed',
      'membership_extended',
      'membership_expiry_reminder',
      'trip_profile_changed',
      'preferred_vehicle_changed',
      'cron_configured',
      'cron_removed',
      'notification_channel_added',
      'notification_channel_removed',
    ],
    label: '配置变更',
    value: 'group:configuration',
  },
  {
    events: [
      'account_removed',
      'account_reauthenticated',
      'account_initialized',
      'vehicle_added',
      'vehicle_plate_swapped',
      'vehicle_removed',
    ],
    label: '账号与车辆操作',
    value: 'group:account-vehicle',
  },
] as const;

const priorityEventKeys = [
  'renewal_failed',
  'renewal_submitted',
  'cron_account_failed',
  'renewal_skipped',
  'cron_account_completed',
  'web_login_failed',
  'config_changed',
  'account_removed',
  'vehicle_removed',
];

const priorityEventKeySet = new Set(priorityEventKeys);

const eventFilterOptions = [
  {
    label: '常用分类',
    options: eventGroups.map(({ label, value }) => ({ label, value })),
  },
  {
    label: '重点事件',
    options: priorityEventKeys.map((value) => ({
      label: eventLabels[value],
      value,
    })),
  },
  {
    label: '更多事件',
    options: Object.entries(eventLabels)
      .filter(([value]) => !priorityEventKeySet.has(value))
      .map(([value, label]) => ({ label, value })),
  },
];

const reasonLabels: Record<string, string> = {
  already_run_today: '今天已经完成检查',
  another_tick_is_running: '已有定时检查正在运行',
  auto_renew_disabled: '账号未开启自动续签',
  membership_expired: '服务有效期已到期',
  not_due: '当前证件暂不需要续签',
  outside_random_window: '当前不在随机执行时段内',
  invalid_credentials: '用户名或密码不正确',
  too_many_attempts: '登录失败次数过多',
};

const sourceLabels: Record<string, string> = {
  cron: '定时任务',
  cron_tick: '定时调度',
  manual: '命令行',
  web: '管理后台',
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

function maskPlateForLookup(value: string) {
  return value.replace(
    /([京津冀晋蒙辽吉黑沪苏浙皖闽赣鲁豫鄂湘粤桂琼渝川贵云藏陕甘青宁新使领警学港澳][A-Z])[A-Z0-9]{5,6}/g,
    '$1*****',
  );
}

function getAuditActor(item: AuditEvent) {
  if (item.actor) return item.actor;
  if (item.source === 'cron' || item.source === 'cron_tick') {
    return '系统定时任务';
  }
  if (item.source === 'web') return '历史记录（未记录）';
  return '系统任务';
}

function getAuditVehicle(item: AuditEvent, accounts: Account[]) {
  if (!item.plate) return '—';
  if (!item.plate.includes('*')) return item.plate;
  const matchingAccounts = accounts.filter((account) =>
    [account.name, account.phone].includes(item.account || ''),
  );
  const candidates = (matchingAccounts.length > 0 ? matchingAccounts : accounts)
    .flatMap((account) => account.vehicles)
    .filter((vehicle) => maskPlateForLookup(vehicle.licenseNumber) === item.plate);
  return candidates.length === 1 ? candidates[0].licenseNumber : item.plate;
}

interface AuditPageProps {
  accounts: Account[];
  data: AuditPageData;
  loading: boolean;
  onQuery: (query: AuditQuery) => Promise<void>;
}

export function AuditPage({ accounts, data, loading, onQuery }: AuditPageProps) {
  const [account, setAccount] = useState<string>();
  const [event, setEvent] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [since, setSince] = useState<string | undefined>('30d');
  const [status, setStatus] = useState<AuditOutcome>();

  const selectedEventGroup = eventGroups.find((group) => group.value === event);
  const query: AuditQuery = {
    account: account || undefined,
    event: selectedEventGroup ? undefined : event || undefined,
    events: selectedEventGroup ? [...selectedEventGroup.events] : undefined,
    page,
    pageSize,
    since: since || '30d',
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
      dataIndex: 'actor',
      key: 'actor',
      render: (_, item) => getAuditActor(item),
      title: '操作人',
      width: 150,
    },
    {
      dataIndex: 'account',
      key: 'account',
      render: (value?: string) => value || '系统任务',
      title: '业务账号',
      width: 150,
    },
    {
      dataIndex: 'plate',
      key: 'plate',
      render: (_, item) => getAuditVehicle(item, accounts),
      title: '车辆',
      width: 120,
    },
    {
      dataIndex: 'event',
      key: 'event',
      render: (event: string) => eventLabels[event] || event,
      title: '事件',
      width: 220,
    },
    {
      dataIndex: 'source',
      key: 'source',
      render: (source?: string) => sourceLabels[source || ''] || source || '未知',
      title: '来源',
      width: 110,
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
            allowClear
            className="audit-account-filter"
            onChange={(value) => resetPage(() => setAccount(value || undefined))}
            options={[
              { label: '全部账号', value: '' },
              ...accounts.map((item) => ({ label: item.name, value: item.name })),
            ]}
            placeholder="全部账号"
            popupMatchSelectWidth={220}
            value={account}
          />
          <Select
            allowClear
            onChange={(value) => resetPage(() => setStatus(value || undefined))}
            options={[
              { label: '全部结果', value: '' },
              { label: '成功', value: 'success' },
              { label: '失败', value: 'failure' },
              { label: '部分失败', value: 'partial_failure' },
              { label: '已跳过', value: 'skipped' },
              { label: '进行中', value: 'in_progress' },
            ]}
            placeholder="全部结果"
            value={status}
          />
          <Select
            allowClear
            className="audit-event-filter"
            onChange={(value) => resetPage(() => setEvent(value || undefined))}
            options={eventFilterOptions}
            optionFilterProp="label"
            placeholder="全部事件"
            popupMatchSelectWidth={280}
            showSearch
            value={event}
          />
          <Select
            allowClear
            onChange={(value) => resetPage(() => setSince(value || undefined))}
            options={[
              { label: '最近 7 天', value: '7d' },
              { label: '最近 30 天', value: '30d' },
              { label: '最近 90 天', value: '90d' },
            ]}
            placeholder="最近 30 天"
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
          scroll={{ x: 1280 }}
        />
      </Card>
    </div>
  );
}

interface SystemPageProps {
  dashboard: Dashboard;
  loading: boolean;
  onRefresh: () => void;
  onViewLogs: () => void;
}

const schedulerAccountStatus: Record<
  SchedulerAccountStatus,
  { color: string; label: string }
> = {
  completed: { color: 'success', label: '今日已完成' },
  disabled: { color: 'default', label: '已关闭' },
  expired: { color: 'error', label: '服务已到期' },
  overdue: { color: 'error', label: '已超过计划时间' },
  pending: { color: 'default', label: '等待生成计划' },
  retrying: { color: 'warning', label: '等待重试' },
  scheduled: { color: 'processing', label: '等待执行' },
};

export function SystemPage({
  dashboard,
  loading,
  onRefresh,
  onViewLogs,
}: SystemPageProps) {
  const { schedule } = dashboard;
  const { scheduler, security } = dashboard;
  const health = scheduler.health === 'healthy'
    ? { color: 'success', label: '运行正常' }
    : scheduler.health === 'warning'
      ? { color: 'warning', label: '需要关注' }
      : { color: 'default', label: '未启用' };
  const accountColumns: ColumnsType<SchedulerAccountInfo> = [
    {
      dataIndex: 'name',
      key: 'name',
      title: '账号',
    },
    {
      key: 'status',
      render: (_, account) => {
        const meta = schedulerAccountStatus[account.status];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
      title: '今日状态',
      width: 150,
    },
    {
      key: 'plannedTime',
      render: (_, account) => account.plannedTime || '—',
      title: '计划时间',
      width: 110,
    },
    {
      key: 'lastActivity',
      render: (_, account) => formatDateTime(
        account.completedAt || account.lastAttemptAt || undefined,
      ),
      title: '最近执行',
      width: 150,
    },
    {
      key: 'retry',
      render: (_, account) => account.status === 'retrying'
        ? (
            <div className="scheduler-retry-cell">
              <span>第 {account.retryCount} 次 · {formatDateTime(account.nextRetryAt || undefined)}</span>
              {account.lastError ? <small title={account.lastError}>{account.lastError}</small> : null}
            </div>
          )
        : '—',
      title: '重试信息',
      width: 260,
    },
  ];
  return (
    <div className="page-shell system-page">
      <div className="page-heading">
        <div>
          <h1>系统状态</h1>
          <p>查看自动调度健康、运行环境与安全检查结果</p>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
          刷新状态
        </Button>
      </div>
      <div className="system-card-grid">
        <Card
          className="system-schedule-card"
          extra={<Button onClick={onViewLogs} type="link">查看调度日志</Button>}
          title={<Space><ClockCircleOutlined />自动调度</Space>}
        >
          <div className="system-schedule-heading">
            <div>
              <Tag color={health.color}>{health.label}</Tag>
              <span>{scheduler.healthMessage}</span>
            </div>
            <small>时区：{dashboard.runtime.timeZone}</small>
          </div>
          <div className="scheduler-metric-grid">
            <div className="scheduler-metric">
              <span>今日完成</span>
              <strong>{scheduler.counts.completed} / {scheduler.counts.eligible}</strong>
            </div>
            <div className="scheduler-metric">
              <span>等待执行</span>
              <strong>{scheduler.counts.scheduled + scheduler.counts.pending}</strong>
            </div>
            <div className="scheduler-metric scheduler-metric-warning">
              <span>重试 / 超时</span>
              <strong>{scheduler.counts.retrying + scheduler.counts.overdue}</strong>
            </div>
            <div className="scheduler-metric">
              <span>已关闭</span>
              <strong>{scheduler.counts.disabled} / 到期 {scheduler.counts.expired}</strong>
            </div>
          </div>
          <Descriptions column={1} colon={false}>
            <Descriptions.Item label="执行计划">
              {schedule.description || '尚未设置定时任务'}
            </Descriptions.Item>
            <Descriptions.Item label="最后心跳">
              {formatDateTime(scheduler.lastTickAt || undefined)}
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
            <Descriptions.Item label="交管接口最近成功访问">
              {formatDateTime(dashboard.runtime.businessApiLastSuccessAt || undefined)}
            </Descriptions.Item>
            <Descriptions.Item label="页面数据生成于">
              {formatDateTime(dashboard.generatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="服务器时区">{dashboard.runtime.timeZone}</Descriptions.Item>
          </Descriptions>
        </Card>
        <Card title={<Space><SafetyCertificateOutlined />安全检查</Space>}>
          <div className="security-check-list">
            {security.checks.map((check) => (
              <div className={`security-check security-check-${check.status}`} key={check.id}>
                {check.status === 'pass'
                  ? <CheckCircleOutlined />
                  : check.status === 'warning'
                    ? <WarningOutlined />
                    : <InfoCircleOutlined />}
                <div>
                  <strong>{check.label}</strong>
                  <span>{check.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          className="system-account-plan-card"
          title={<Space><CalendarOutlined />今日账号计划</Space>}
        >
          <Table
            columns={accountColumns}
            dataSource={scheduler.accounts}
            locale={{ emptyText: '尚未添加业务账号' }}
            pagination={false}
            rowKey="id"
            scroll={{ x: 850 }}
            size="small"
          />
        </Card>
      </div>
    </div>
  );
}
