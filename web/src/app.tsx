import {
  CarOutlined,
  FileTextOutlined,
  LogoutOutlined,
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
  Spin,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dashboardApi } from './api';
import { AccountPage } from './components/account-page';
import { LoginPage } from './components/login-page';
import {
  AuditPage,
  SystemPage,
} from './components/secondary-pages';
import { VehicleDrawer } from './components/vehicle-drawer';
import { VehiclePage } from './components/vehicle-page';
import type {
  Account,
  AccountCreateInput,
  AccountUpdateInput,
  AppView,
  AuditPageData,
  AuditQuery,
  Dashboard,
  MembershipUpdateInput,
  Vehicle,
} from './types';

const { Content, Header, Sider } = Layout;

const viewPaths: Record<AppView, string> = {
  accounts: '/accounts',
  audit: '/logs',
  system: '/system',
  vehicles: '/vehicles',
};

function getViewFromPathname(pathname: string): AppView {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPathname === '/audit') return 'audit';
  const matchedView = Object.entries(viewPaths).find(
    ([, path]) => path === normalizedPathname,
  );
  return (matchedView?.[0] as AppView | undefined) || 'accounts';
}

export function App() {
  return (
    <AntApp>
      <Application />
    </AntApp>
  );
}

function Application() {
  const { message } = AntApp.useApp();
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    let active = true;
    dashboardApi.getSession()
      .then((session) => {
        if (!active) return;
        setUsername(session.username);
        setAuthStatus(session.authenticated ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (active) setAuthStatus('unauthenticated');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUsername('');
      setLoginError('登录状态已失效，请重新登录');
      setAuthStatus('unauthenticated');
    };
    window.addEventListener('auto-bj-pass:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auto-bj-pass:unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = async (nextUsername: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const session = await dashboardApi.login(nextUsername, password);
      setUsername(session.username);
      window.history.replaceState(null, '', viewPaths.accounts);
      setAuthStatus('authenticated');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : '登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dashboardApi.logout();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '退出失败');
      return;
    }
    setUsername('');
    setLoginError('');
    setAuthStatus('unauthenticated');
  };

  if (authStatus === 'checking') {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark"><CarOutlined /></div>
        <Spin size="large" />
        <span>正在建立安全连接…</span>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <LoginPage
        error={loginError}
        loading={loginLoading}
        onSubmit={handleLogin}
      />
    );
  }

  return <DashboardApplication onLogout={handleLogout} username={username} />;
}

interface DashboardApplicationProps {
  onLogout: () => Promise<void>;
  username: string;
}

function DashboardApplication({ onLogout, username }: DashboardApplicationProps) {
  const { message } = AntApp.useApp();
  const [activeView, setActiveView] = useState<AppView>(() =>
    getViewFromPathname(window.location.pathname),
  );
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

  const navigateTo = useCallback((view: AppView, { replace = false } = {}) => {
    const path = viewPaths[view];
    if (window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
    }
    setActiveView(view);
  }, []);

  useEffect(() => {
    const initialView = getViewFromPathname(window.location.pathname);
    if (window.location.pathname !== viewPaths[initialView]) {
      navigateTo(initialView, { replace: true });
    }

    const handlePopState = () => {
      setActiveView(getViewFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateTo]);

  useEffect(() => {
    if (activeView !== 'vehicles') setSelectedVehicle(null);
  }, [activeView]);

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

  const handleAddAccount = async (values: AccountCreateInput) => {
    await handleMutation(
      () => dashboardApi.addAccount(values),
      `账号 ${values.name || values.phone} 添加成功`,
    );
  };

  const handleEditAccount = async (
    account: Account,
    values: AccountUpdateInput,
  ) => {
    await handleUpdateAccount(account.id, { ...values }, '账号配置已更新');
  };

  const handleReloginAccount = async (account: Account, password: string) => {
    await handleMutation(
      () => dashboardApi.reloginAccount(account.id, password),
      `账号 ${account.name} 的京通密码已更新`,
    );
  };

  const handleDeleteAccount = async (account: Account) => {
    await handleMutation(
      () => dashboardApi.deleteAccount(account.id),
      `账号 ${account.name} 已从本机配置删除`,
    );
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

  const handleExtendMembership = async (
    account: Account,
    values: MembershipUpdateInput,
  ) => {
    await handleMutation(
      () => dashboardApi.extendMembership(account.id, values),
      `账号 ${account.name} 的服务有效期已更新`,
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

  const menuItems = [
    { icon: <TeamOutlined />, key: 'accounts', label: '账号管理' },
    { icon: <CarOutlined />, key: 'vehicles', label: '车辆管理' },
    { icon: <FileTextOutlined />, key: 'audit', label: '运行记录' },
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
        <AccountPage
          accounts={dashboard.accounts}
          loading={mutationLoading}
          onAdd={handleAddAccount}
          onDelete={handleDeleteAccount}
          onExtendMembership={handleExtendMembership}
          onRelogin={handleReloginAccount}
          onToggle={handleToggleAutoRenew}
          onUpdate={handleEditAccount}
        />
      );
    }
    if (activeView === 'system') return <SystemPage dashboard={dashboard} />;
    return (
      <VehiclePage
        dashboard={dashboard}
        loading={loading}
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
            navigateTo(key as AppView);
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
            <Space className="operator-profile" size={8}>
              <Avatar icon={<UserOutlined />} size="small" />
              <span className="operator-name">{username || '运营管理员'}</span>
              <Button
                aria-label="退出登录"
                className="logout-button"
                icon={<LogoutOutlined />}
                onClick={() => void onLogout()}
                size="small"
                type="text"
              >
                退出
              </Button>
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

      <VehicleDrawer
        account={selectedAccount}
        loading={mutationLoading}
        onClose={() => setSelectedVehicle(null)}
        onRenew={handleRenewVehicle}
        onUpdate={handleUpdateAccount}
        open={Boolean(selectedVehicle) && activeView === 'vehicles'}
        vehicle={selectedVehicle}
      />
    </Layout>
  );
}
