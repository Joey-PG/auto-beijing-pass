import {
  ArrowLeftOutlined,
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
  Radio,
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
  SelectableTripProfileMode,
  TripProfile,
  TripProfileUpdateInput,
} from '../types';
import { TripProfileFields, tripProfileToInput } from './trip-profile-fields';

interface AccountPageProps {
  accounts: Account[];
  defaultTripProfile: TripProfile;
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
    values: TripProfileUpdateInput,
  ) => Promise<void>;
}

function DefaultTripProfileSummary({ profile }: { profile: TripProfile }) {
  return (
    <div className="default-trip-profile-summary">
      <div>
        <span>在京地址</span>
        <strong>{profile.in_beijing_address.address}</strong>
      </div>
      <div>
        <span>进京目的地</span>
        <strong>{profile.destination.address}</strong>
      </div>
      <div>
        <span>目的地区县 / 进京目的</span>
        <strong>{profile.destination.area} · {profile.purpose.name}</strong>
      </div>
    </div>
  );
}

function TripProfileModeSelector({
  defaultTripProfile,
}: {
  defaultTripProfile: TripProfile;
}) {
  const form = Form.useFormInstance();
  const mode = Form.useWatch('tripProfileMode', form) as SelectableTripProfileMode;
  return (
    <>
      <Form.Item
        label="出行配置"
        name="tripProfileMode"
        rules={[{ required: true, message: '请选择出行配置方式' }]}
      >
        <Radio.Group className="trip-profile-mode-group">
          <Radio value="default">
            <strong>使用系统默认配置（推荐）</strong>
            <span>直接使用当前系统预设的在京地址、进京目的地和进京目的</span>
          </Radio>
          <Radio value="custom">
            <strong>自定义出行配置</strong>
            <span>为这个账号单独设置地址、目的地和进京目的</span>
          </Radio>
        </Radio.Group>
      </Form.Item>
      {mode === 'default' ? (
        <DefaultTripProfileSummary profile={defaultTripProfile} />
      ) : null}
    </>
  );
}

export function AccountPage({
  accounts,
  defaultTripProfile,
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
  const [tripForm] = Form.useForm<TripProfileUpdateInput>();
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<'account' | 'trip'>('account');
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [loginAccount, setLoginAccount] = useState<Account | null>(null);
  const [membershipAccount, setMembershipAccount] = useState<Account | null>(null);
  const [tripAccount, setTripAccount] = useState<Account | null>(null);
  const addMembershipTerm = Form.useWatch('membershipTerm', addForm);
  const addTripProfileMode = Form.useWatch('tripProfileMode', addForm);
  const membershipTerm = Form.useWatch('membershipTerm', membershipForm);
  const tripProfileMode = Form.useWatch('tripProfileMode', tripForm);

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
      tripForm.setFieldsValue({
        ...tripProfileToInput(
          tripAccount.tripProfileMode === 'custom' ? tripAccount.tripProfile : null,
        ),
        tripProfileMode: tripAccount.tripProfileMode === 'default'
          ? 'default'
          : 'custom',
      });
    }
  }, [tripAccount, tripForm]);

  const closeAddModal = () => {
    addForm.resetFields();
    setAddStep('account');
    setAddOpen(false);
  };

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
      render: (_, account) => account.tripProfileMode === 'default'
        ? <Tag color="blue">系统默认</Tag>
        : account.tripProfileConfigured
          ? <Tag color="success">自定义</Tag>
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
          <Button
            danger
            disabled={loading}
            icon={<DeleteOutlined />}
            onClick={() => setDeleteAccount(account)}
            size="small"
            type="text"
          >
            删除
          </Button>
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
        cancelButtonProps={{ disabled: loading }}
        cancelText="取消"
        centered
        className="account-delete-modal"
        closable={!loading}
        destroyOnClose
        keyboard={!loading}
        maskClosable={!loading}
        okButtonProps={{ danger: true, loading }}
        okText="确认删除账号"
        onCancel={() => setDeleteAccount(null)}
        onOk={async () => {
          if (!deleteAccount) return;
          await onDelete(deleteAccount);
          setDeleteAccount(null);
        }}
        open={Boolean(deleteAccount)}
        title={(
          <Space size={10}>
            <DeleteOutlined className="account-delete-modal-icon" />
            <span>确认删除账号？</span>
          </Space>
        )}
        width={520}
      >
        <Alert
          description="删除后，该账号的自动续签将立即停止。"
          message="这是一个重要操作，请确认账号信息"
          showIcon
          type="error"
        />
        <div className="account-delete-summary">
          <div>
            <span>账号名称</span>
            <strong>{deleteAccount?.name || '—'}</strong>
          </div>
          <div>
            <span>手机号</span>
            <strong>{deleteAccount?.phone || '—'}</strong>
          </div>
          <div>
            <span>关联车辆</span>
            <strong>{deleteAccount?.vehicles.length || 0} 辆</strong>
          </div>
        </div>
        <p className="account-delete-note">
          账号及关联车辆会从本管理后台移除，但不会删除北京交管平台中的车辆和进京证记录。重新添加账号后，车辆会再次显示。
        </p>
      </Modal>

      <Modal
        centered
        destroyOnClose
        maskClosable={!loading}
        okButtonProps={{ loading }}
        okText={addStep === 'account' && addTripProfileMode === 'custom'
          ? '下一步：填写出行信息'
          : '登录并添加'}
        onCancel={closeAddModal}
        onOk={async () => {
          if (addStep === 'account' && addTripProfileMode === 'custom') {
            await addForm.validateFields();
            addForm.setFieldsValue({ purposeCode: '06', purposeName: '其它' });
            setAddStep('trip');
            return;
          }
          addForm.submit();
        }}
        open={addOpen}
        title={addStep === 'trip' ? '填写自定义出行信息' : '添加北京通账号'}
        width={addStep === 'trip' ? 720 : 600}
      >
        <Form
          className={addStep === 'trip' ? 'trip-profile-form' : undefined}
          form={addForm}
          initialValues={{ tripProfileMode: 'default' }}
          layout="vertical"
          onFinish={async (values) => {
            await onAdd(values);
            closeAddModal();
          }}
        >
          {addStep === 'account' ? (
            <>
              <Form.Item
                extra="填写账号使用人的姓名，留空时使用北京通手机号。"
                label="账号名称（选填）"
                name="name"
              >
                <Input maxLength={40} placeholder="例如：张三" />
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
              <Form.Item
                extra="到期日当天仍可使用；到期次日起停止自动续签。"
                label="服务有效期"
                name="membershipTerm"
                rules={[{ required: true, message: '请选择服务有效期' }]}
              >
                <Select placeholder="请选择服务有效期" options={[
                  { label: '1 个月', value: '1m' },
                  { label: '3 个月', value: '3m' },
                  { label: '1 年', value: '1y' },
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
              <TripProfileModeSelector defaultTripProfile={defaultTripProfile} />
              <Alert
                message="账号添加成功后将默认开启自动续签，进京证类型使用六环外；之后可在账号管理中修改。"
                showIcon
                type="info"
              />
            </>
          ) : (
            <>
              <Button
                className="trip-profile-back"
                icon={<ArrowLeftOutlined />}
                onClick={() => setAddStep('account')}
                type="link"
              >
                返回账号信息
              </Button>
              <Alert
                className="modal-inline-alert"
                message="该出行信息仅用于当前账号，保存后仍可在账号管理中修改或恢复系统默认。"
                showIcon
                type="info"
              />
              <TripProfileFields mapConfig={mapConfig} />
            </>
          )}
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
        okText="保存出行配置"
        onCancel={() => setTripAccount(null)}
        onOk={() => tripForm.submit()}
        open={Boolean(tripAccount)}
        title={`出行配置 · ${tripAccount?.name || ''}`}
        width={720}
      >
        <Alert
          className="modal-inline-alert"
          message="定时续签会使用当前选择的配置；手动执行时仍可临时修改。"
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
          <TripProfileModeSelector defaultTripProfile={defaultTripProfile} />
          {tripProfileMode === 'custom' ? (
            <TripProfileFields mapConfig={mapConfig} />
          ) : null}
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
