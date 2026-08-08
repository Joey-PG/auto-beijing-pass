import {
  CarOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Badge,
  Button,
  Layout,
  Menu,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dashboardApi } from './api';
import { AddVehicleModal } from './components/add-vehicle-modal';
import {
  AccountsPage,
  AuditPage,
  SystemPage,
} from './components/secondary-pages';
import { VehicleDrawer } from './components/vehicle-drawer';
import { VehiclePage } from './components/vehicle-page';
import type {
  Account,
  AppView,
  AuditPageData,
  AuditQuery,
  Dashboard,
  Vehicle,
} from './types';

const { Content, Header, Sider } = Layout;

export function App() {
  return (
    <AntApp>
      <Application />
    </AntApp>
  );
}

function Application() {
  const { message } = AntApp.useApp();
  const [activeView, setActiveView] = useState<AppView>('vehicles');
  const [addOpen, setAddOpen] = useState(false);
  const [audit, setAudit] = useState<AuditPageData>({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const auditRequestId = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const initializedSelection = useRef(false);

  const findVehicle = useCallback((data: Dashboard, current: Vehicle) => {
    return (
      data.accounts
        .flatMap((account) => account.vehicles)
        .find(
          (vehicle) =>
            vehicle.accountId === current.accountId &&
            vehicle.vehicleId === current.vehicleId,
        ) || null
    );
  }, []);

  const loadData = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const nextDashboard = await dashboardApi.getDashboard();
        setDashboard(nextDashboard);
        setSelectedVehicle((current) => {
          if (current) return findVehicle(nextDashboard, current);
          if (!initializedSelection.current && window.innerWidth >= 1200) {
            initializedSelection.current = true;
            return nextDashboard.accounts.flatMap((account) => account.vehicles)[0] || null;
          }
          return null;
        });
      } catch (error) {
        console.error(error);
        message.error(error instanceof Error ? error.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    },
    [findVehicle, message],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadAudit = useCallback(
    async (query: AuditQuery) => {
      const requestId = auditRequestId.current + 1;
      auditRequestId.current = requestId;
      setAuditLoading(true);
      try {
        const nextAudit = await dashboardApi.getAudit(query);
        if (requestId === auditRequestId.current) setAudit(nextAudit);
      } catch (error) {
        if (requestId === auditRequestId.current) {
          console.error(error);
          message.error(error instanceof Error ? error.message : '运行记录加载失败');
        }
      } finally {
        if (requestId === auditRequestId.current) setAuditLoading(false);
      }
    },
    [message],
  );

  const selectedAccount = useMemo(() => {
    if (!dashboard || !selectedVehicle) return null;
    return (
      dashboard.accounts.find(
        (account) => account.id === selectedVehicle.accountId,
      ) || null
    );
  }, [dashboard, selectedVehicle]);

  const handleMutation = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setMutationLoading(true);
      try {
        await action();
        message.success(successMessage);
        await loadData({ quiet: true });
      } catch (error) {
        console.error(error);
        message.error(error instanceof Error ? error.message : '操作失败');
        throw error;
      } finally {
        setMutationLoading(false);
      }
    },
    [loadData, message],
  );

  const handleAddVehicle = async (values: Record<string, string>) => {
    await handleMutation(
      () => dashboardApi.addVehicle(values),
      `车辆 ${values.licenseNumber} 添加成功`,
    );
    setAddOpen(false);
  };

  const handleUpdateAccount = async (
    accountId: string,
    values: Record<string, boolean | string>,
    successMessage: string,
  ) => {
    await handleMutation(
      () => dashboardApi.updateAccount(accountId, values),
      successMessage,
    );
  };

  const handleToggleAutoRenew = async (account: Account, checked: boolean) => {
    await handleUpdateAccount(
      account.id,
      { autoRenew: checked },
      checked ? '自动续签已开启' : '自动续签已关闭',
    );
  };

  const handleRenewVehicle = async (vehicle: Vehicle) => {
    setMutationLoading(true);
    try {
      const result = await dashboardApi.renewVehicle(
        vehicle.accountId,
        vehicle.licenseNumber,
      );
      message.success(result.message || '检查完成');
      await loadData({ quiet: true });
    } catch (error) {
      console.error(error);
      message.error(error instanceof Error ? error.message : '续签执行失败');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    await handleMutation(
      () => dashboardApi.deleteVehicle(vehicle.accountId, vehicle.vehicleId),
      `车辆 ${vehicle.licenseNumber} 已删除`,
    );
    setSelectedVehicle(null);
  };

  const menuItems = [
    { icon: <CarOutlined />, key: 'vehicles', label: '车辆管理' },
    { icon: <FileTextOutlined />, key: 'audit', label: '运行记录' },
    { icon: <TeamOutlined />, key: 'accounts', label: '账号配置' },
    { icon: <SettingOutlined />, key: 'system', label: '系统设置' },
  ];

  const renderContent = () => {
    if (!dashboard) {
      return (
        <div className="initial-loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      );
    }
    if (activeView === 'audit') {
      return (
        <AuditPage
          accounts={dashboard.accounts}
          data={audit}
          loading={auditLoading}
          onQuery={loadAudit}
        />
      );
    }
    if (activeView === 'accounts') {
      return (
        <AccountsPage
          accounts={dashboard.accounts}
          loading={mutationLoading}
          onToggle={handleToggleAutoRenew}
        />
      );
    }
    if (activeView === 'system') return <SystemPage dashboard={dashboard} />;
    return (
      <VehiclePage
        dashboard={dashboard}
        loading={loading}
        onAdd={() => setAddOpen(true)}
        onRefresh={() => loadData()}
        onSelect={setSelectedVehicle}
        onToggleAutoRenew={handleToggleAutoRenew}
        selectedVehicleId={selectedVehicle?.vehicleId || null}
      />
    );
  };

  return (
    <Layout className="app-layout">
      <Sider
        breakpoint="lg"
        className="app-sider"
        collapsed={collapsed}
        collapsedWidth={72}
        onBreakpoint={setCollapsed}
        trigger={null}
        width={208}
      >
        <div className="brand-lockup">
          <div className="brand-icon"><CarOutlined /></div>
          {!collapsed ? (
            <div>
              <strong>AUTO BJ PASS</strong>
              <span>车辆续签管理</span>
            </div>
          ) : null}
        </div>
        <Menu
          className="side-menu"
          items={menuItems}
          mode="inline"
          onClick={({ key }) => {
            setActiveView(key as AppView);
            if (key !== 'vehicles') setSelectedVehicle(null);
          }}
          selectedKeys={[activeView]}
          theme="dark"
        />
        <button
          aria-label={collapsed ? '展开菜单' : '收起菜单'}
          className="collapse-button"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!collapsed ? <span>收起菜单</span> : null}
        </button>
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space className="header-breadcrumb" size={8}>
            <Typography.Text type="secondary">
              {menuItems.find((item) => item.key === activeView)?.label}
            </Typography.Text>
            {activeView === 'vehicles' ? (
              <>
                <span>/</span>
                <Typography.Text>车辆续签管理</Typography.Text>
              </>
            ) : null}
          </Space>
          <Space size={20}>
            <Badge status="success" text="服务在线" />
            <Space size={8}>
              <Avatar icon={<UserOutlined />} size="small" />
              <span className="operator-name">运营管理员</span>
            </Space>
          </Space>
        </Header>
        <Content
          className={`app-content ${
            selectedVehicle && activeView === 'vehicles' ? 'has-detail' : ''
          }`}
        >
          {renderContent()}
        </Content>
      </Layout>

      {dashboard ? (
        <AddVehicleModal
          accounts={dashboard.accounts}
          loading={mutationLoading}
          onCancel={() => setAddOpen(false)}
          onSubmit={handleAddVehicle}
          open={addOpen}
        />
      ) : null}
      <VehicleDrawer
        account={selectedAccount}
        loading={mutationLoading}
        onClose={() => setSelectedVehicle(null)}
        onDelete={handleDeleteVehicle}
        onRenew={handleRenewVehicle}
        onUpdate={handleUpdateAccount}
        open={Boolean(selectedVehicle) && activeView === 'vehicles'}
        vehicle={selectedVehicle}
      />
    </Layout>
  );
}
