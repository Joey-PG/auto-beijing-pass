import {
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
  TripProfileInput,
} from '../types';
import { TripProfileFields, tripProfileToInput } from './trip-profile-fields';

interface AccountPageProps {
  accounts: Account[];
  loading: boolean;
  onAdd: (values: AccountCreateInput) => Promise<void>;
  onDelete: (account: Account) => Promise<void>;
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
  onAdd,
  onDelete,
  onRelogin,
  onToggle,
  onUpdate,
  onUpdateTripProfile,
}: AccountPageProps) {
  const [addForm] = Form.useForm<AccountCreateInput>();
  const [editForm] = Form.useForm<AccountUpdateInput>();
  const [loginForm] = Form.useForm<{ password: string }>();
  const [tripForm] = Form.useForm<TripProfileInput>();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [loginAccount, setLoginAccount] = useState<Account | null>(null);
  const [tripAccount, setTripAccount] = useState<Account | null>(null);

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
      key: 'autoRenew',
      render: (_, account) => (
        <Switch
          checked={account.autoRenew}
          disabled={loading}
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
      width: 420,
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1>账号管理</h1>
          <p>管理北京通业务账号和自动续签配置</p>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)} type="primary">
          添加账号
        </Button>
      </div>
      <Alert
        className="page-alert"
        message="北京通密码仅通过 HTTPS 发送到当前服务器；登录失败不会覆盖已有凭据。"
        showIcon
        type="info"
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
          initialValues={{ autoRenew: false, entryType: '六环外' }}
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
          <TripProfileFields />
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
