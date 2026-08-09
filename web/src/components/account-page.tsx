import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  KeyOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

import type {
  Account,
  AccountCreateInput,
  AccountUpdateInput,
  MapConfig,
  MembershipUpdateInput,
  TripProfileInput,
} from '../types';
import { TripProfileFields, tripProfileToInput } from './trip-profile-fields';

interface AccountPageProps {
  accounts: Account[];
  loading: boolean;
  mapConfig: MapConfig;
  onAdd: (values: AccountCreateInput) => Promise<void>;
  onDelete: (account: Account) => Promise<void>;
  onExtendMembership: (account: Account, values: MembershipUpdateInput) => Promise<void>;
  onRelogin: (account: Account, password: string) => Promise<void>;
  onToggle: (account: Account, checked: boolean) => Promise<void>;
  onUpdate: (account: Account, values: AccountUpdateInput) => Promise<void>;
  onUpdateTripProfile: (
    account: Account,
    values: TripProfileInput,
  ) => Promise<void>;
}

export function AccountPage({
  accounts,
  loading,
  mapConfig,
  onAdd,
  onDelete,
  onExtendMembership,
  onRelogin,
  onToggle,
  onUpdate,
  onUpdateTripProfile,
}: AccountPageProps) {
  const [addForm] = Form.useForm<AccountCreateInput>();
  const [editForm] = Form.useForm<AccountUpdateInput>();
  const [loginForm] = Form.useForm<{ password: string }>();
  const [membershipForm] = Form.useForm<MembershipUpdateInput>();
  const [tripForm] = Form.useForm<TripProfileInput>();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [loginAccount, setLoginAccount] = useState<Account | null>(null);
  const [membershipAccount, setMembershipAccount] = useState<Account | null>(null);
  const [tripAccount, setTripAccount] = useState<Account | null>(null);
  const addMembershipTerm = Form.useWatch('membershipTerm', addForm);
  const membershipTerm = Form.useWatch('membershipTerm', membershipForm);

  const membershipMeta = {
    active: { color: 'success', label: '有效' },
    expired: { color: 'error', label: '已到期' },
    expiring_soon: { color: 'warning', label: '即将到期' },
    permanent: { color: 'blue', label: '长期有效' },
  } as const;

  useEffect(() => {
    if (editAccount) {
      editForm.setFieldsValue({
        autoRenew: editAccount.autoRenew,
        entryType: editAccount.entryType,
        name: editAccount.name,
      });
    }
  }, [editAccount, editForm]);

  useEffect(() => {
    if (tripAccount) {
      tripForm.setFieldsValue(tripProfileToInput(tripAccount.tripProfile));
    }
  }, [tripAccount, tripForm]);

  const columns: ColumnsType<Account> = [
    { dataIndex: 'name', key: 'name', title: '账号名称' },
    { dataIndex: 'phone', key: 'phone', title: '手机号' },
    {
      key: 'login',
      render: (_, account) =>
        account.error ? <Tag color="error">状态异常</Tag> : <Tag color="success">已登录</Tag>,
      title: '登录状态',
    },
    { dataIndex: 'entryType', key: 'entryType', title: '进京证类型' },
    {
      key: 'tripProfile',
      render: (_, account) => account.tripProfileConfigured
        ? <Tag color="success">已配置</Tag>
        : <Tag color="warning">待配置</Tag>,
      title: '出行配置',
    },
    {
      key: 'vehicles',
      render: (_, account) => `${account.vehicles.length} 辆`,
      title: '关联车辆',
    },
    {
      filters: [
        { text: '有效', value: 'active' },
        { text: '即将到期', value: 'expiring_soon' },
        { text: '已到期', value: 'expired' },
        { text: '长期有效', value: 'permanent' },
      ],
      key: 'membership',
      onFilter: (value, account) => account.membershipStatus === value,
      render: (_, account) => {
        const meta = membershipMeta[account.membershipStatus];
        return (
          <div className="membership-cell">
            <Tag color={meta.color}>{meta.label}</Tag>
            <small>
              {account.membershipPermanent
                ? '不设到期日'
                : `至 ${account.membershipExpiresOn || '—'}`}
            </small>
          </div>
        );
      },
      title: '服务有效期',
      width: 170,
    },
    {
      key: 'autoRenew',
      render: (_, account) => (
        <Switch
          checked={account.autoRenew}
          disabled={loading || account.membershipStatus === 'expired'}
          onChange={(checked) => onToggle(account, checked)}
          size="small"
        />
      ),
      title: '自动续签',
    },
    {
      fixed: 'right',
      key: 'actions',
      render: (_, account) => (
        <Space size={4} wrap>
          <Button
            icon={<CalendarOutlined />}
            onClick={() => {
              membershipForm.setFieldsValue({ membershipTerm: '1y' });
              setMembershipAccount(account);
            }}
            size="small"
            type="text"
          >
            续费
          </Button>
          <Button
            icon={<EnvironmentOutlined />}
            onClick={() => setTripAccount(account)}
            size="small"
            type="text"
          >
            出行配置
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditAccount(account)}
            size="small"
            type="text"
          >
            编辑
          </Button>
          <Button
            icon={<KeyOutlined />}
            onClick={() => setLoginAccount(account)}
            size="small"
            type="text"
          >
            修改京通密码
          </Button>
          <Popconfirm
            description="删除后，该账号及关联车辆将从本管理后台移除，但不会删除北京交管平台中的车辆和进京证记录。重新添加账号后，车辆会再次显示。"
            disabled={loading}
            okButtonProps={{ danger: true, loading }}
            okText="确认删除"
            onConfirm={() => onDelete(account)}
            title={`删除账号 ${account.name}？`}
          >
            <Button danger icon={<DeleteOutlined />} size="small" type="text">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: '操作',
      width: 500,
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1>账号管理</h1>
          <p>管理北京通业务账号、服务有效期和自动续签配置</p>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)} type="primary">
          添加账号
        </Button>
      </div>
      <Alert
        className="page-alert"
        message={accounts.some((account) => account.membershipStatus === 'expired')
          ? `有 ${accounts.filter((account) => account.membershipStatus === 'expired').length} 个账号服务已到期，自动续签已停止。`
          : '服务到期前 30、7、1 天及到期当天会提醒；到期次日起停止自动续签。'}
        showIcon
        type={accounts.some((account) => account.membershipStatus === 'expired') ? 'warning' : 'info'}
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={accounts}
          locale={{ emptyText: '尚未添加北京通账号' }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1280 }}
        />
      </Card>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="登录并添加"
        onCancel={() => setAddOpen(false)}
        onOk={() => addForm.submit()}
        open={addOpen}
        title="添加北京通账号"
      >
        <Form
          form={addForm}
          initialValues={{ autoRenew: false, entryType: '六环外', membershipTerm: '1y' }}
          layout="vertical"
          onFinish={async (values) => {
            await onAdd(values);
            addForm.resetFields();
            setAddOpen(false);
          }}
          preserve={false}
        >
          <Form.Item label="账号名称" name="name">
            <Input maxLength={40} placeholder="例如：赵xx（留空使用手机号）" />
          </Form.Item>
          <Form.Item
            label="北京通手机号"
            name="phone"
            normalize={(value) => String(value || '').trim()}
            rules={[
              { required: true, message: '请输入北京通手机号' },
              { pattern: /^1\d{10}$/, message: '请输入有效的 11 位手机号' },
            ]}
          >
            <Input autoComplete="username" inputMode="numeric" maxLength={11} />
          </Form.Item>
          <Form.Item
            label="北京通密码"
            name="password"
            rules={[{ required: true, message: '请输入北京通密码' }]}
          >
            <Input.Password autoComplete="new-password" maxLength={256} />
          </Form.Item>
          <Form.Item label="进京证类型" name="entryType">
            <Select options={['六环外', '六环内'].map((value) => ({ value }))} />
          </Form.Item>
          <Form.Item
            extra="现有账号和新账号默认均为一年；到期日当天仍可使用。"
            label="服务有效期"
            name="membershipTerm"
          >
            <Select options={[
              { label: '1 个月', value: '1m' },
              { label: '3 个月', value: '3m' },
              { label: '1 年（默认）', value: '1y' },
              { label: '自定义到期日', value: 'custom' },
              { label: '长期有效', value: 'permanent' },
            ]} />
          </Form.Item>
          {addMembershipTerm === 'custom' ? (
            <Form.Item
              label="服务到期日"
              name="membershipExpiresOn"
              rules={[{ required: true, message: '请选择服务到期日' }]}
            >
              <Input min={new Date().toISOString().slice(0, 10)} type="date" />
            </Form.Item>
          ) : null}
          <Form.Item label="自动续签" name="autoRenew" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="确认续费"
        onCancel={() => setMembershipAccount(null)}
        onOk={() => membershipForm.submit()}
        open={Boolean(membershipAccount)}
        title={`服务续费 · ${membershipAccount?.name || ''}`}
      >
        <p className="modal-description">
          当前有效期：{membershipAccount?.membershipPermanent
            ? '长期有效'
            : membershipAccount?.membershipExpiresOn || '—'}。未到期会从原到期日顺延，已到期则从今天计算。
        </p>
        <Form
          form={membershipForm}
          initialValues={{ membershipTerm: '1y' }}
          layout="vertical"
          onFinish={async (values) => {
            if (!membershipAccount) return;
            await onExtendMembership(membershipAccount, values);
            membershipForm.resetFields();
            setMembershipAccount(null);
          }}
          preserve={false}
        >
          <Form.Item label="续费时长" name="membershipTerm">
            <Select options={[
              { label: '续费 1 个月', value: '1m' },
              { label: '续费 3 个月', value: '3m' },
              { label: '续费 1 年', value: '1y' },
              { label: '设置自定义到期日', value: 'custom' },
              { label: '设为长期有效', value: 'permanent' },
            ]} />
          </Form.Item>
          {membershipTerm === 'custom' ? (
            <Form.Item
              label="服务到期日"
              name="membershipExpiresOn"
              rules={[{ required: true, message: '请选择服务到期日' }]}
            >
              <Input min={new Date().toISOString().slice(0, 10)} type="date" />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="保存为默认配置"
        onCancel={() => setTripAccount(null)}
        onOk={() => tripForm.submit()}
        open={Boolean(tripAccount)}
        title={`出行配置 · ${tripAccount?.name || ''}`}
        width={720}
      >
        <Alert
          className="modal-inline-alert"
          message="定时续签会直接使用这里保存的信息；手动执行时仍可临时修改。"
          showIcon
          type={tripAccount?.tripProfileConfigured ? 'info' : 'warning'}
        />
        <Form
          className="trip-profile-form"
          form={tripForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!tripAccount) return;
            await onUpdateTripProfile(tripAccount, values);
            setTripAccount(null);
          }}
          preserve={false}
        >
          <TripProfileFields mapConfig={mapConfig} />
        </Form>
      </Modal>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="保存修改"
        onCancel={() => setEditAccount(null)}
        onOk={() => editForm.submit()}
        open={Boolean(editAccount)}
        title="编辑账号"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editAccount) return;
            await onUpdate(editAccount, values);
            setEditAccount(null);
          }}
          preserve={false}
        >
          <Form.Item
            label="账号名称"
            name="name"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item label="手机号">
            <Input disabled value={editAccount?.phone} />
          </Form.Item>
          <Form.Item label="进京证类型" name="entryType">
            <Select options={['六环外', '六环内'].map((value) => ({ value }))} />
          </Form.Item>
          <Form.Item label="自动续签" name="autoRenew" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText="确认修改"
        onCancel={() => setLoginAccount(null)}
        onOk={() => loginForm.submit()}
        open={Boolean(loginAccount)}
        title={`修改京通密码 · ${loginAccount?.name || ''}`}
      >
        <p className="modal-description">
          手机号：{loginAccount?.phone}。新密码验证成功后才会替换当前凭据。
        </p>
        <Form
          form={loginForm}
          layout="vertical"
          onFinish={async ({ password }) => {
            if (!loginAccount) return;
            await onRelogin(loginAccount, password);
            loginForm.resetFields();
            setLoginAccount(null);
          }}
          preserve={false}
        >
          <Form.Item
            label="北京通密码"
            name="password"
            rules={[{ required: true, message: '请输入北京通密码' }]}
          >
            <Input.Password autoComplete="current-password" maxLength={256} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
