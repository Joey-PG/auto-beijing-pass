import {
  CarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';

interface LoginPageProps {
  error: string;
  loading: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
}

interface LoginValues {
  password: string;
  username: string;
}

export function LoginPage({ error, loading, onSubmit }: LoginPageProps) {
  const [form] = Form.useForm<LoginValues>();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <main className="login-shell">
      <section className="login-brand-panel" aria-label="Auto Beijing Pass">
        <div className="login-brand-content">
          <div className="login-brand-mark"><CarOutlined /></div>
          <p className="login-eyebrow">AUTO BJ PASS</p>
          <h1>让每一次进京，<br />都从容有序。</h1>
          <p className="login-brand-description">
            集中管理车辆、账号与续签计划，关键状态一目了然。
          </p>
          <div className="login-security-note">
            <SafetyCertificateOutlined />
            <span>
              <strong>安全连接</strong>
              登录信息仅通过当前 HTTPS 连接传输
            </span>
          </div>
        </div>
        <div className="login-brand-orbit login-brand-orbit-one" />
        <div className="login-brand-orbit login-brand-orbit-two" />
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <div className="login-brand-mark"><CarOutlined /></div>
            <strong>AUTO BJ PASS</strong>
          </div>
          <div className="login-heading">
            <span>管理后台</span>
            <h2>欢迎回来</h2>
            <p>请输入管理员账号和密码继续访问</p>
          </div>

          {error ? <Alert className="login-alert" message={error} showIcon type="error" /> : null}

          <Form
            autoComplete="on"
            form={form}
            layout="vertical"
            onFinish={({ password, username }) => onSubmit(username, password)}
            requiredMark={false}
          >
            <Form.Item
              label="管理员账号"
              name="username"
              rules={[{ message: '请输入管理员账号', required: true }]}
            >
              <Input
                autoComplete="username"
                autoFocus
                disabled={loading}
                placeholder="请输入账号"
                prefix={<UserOutlined />}
                size="large"
              />
            </Form.Item>
            <Form.Item
              label="登录密码"
              name="password"
              rules={[{ message: '请输入登录密码', required: true }]}
            >
              <Input.Password
                autoComplete="current-password"
                disabled={loading}
                iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onPressEnter={() => form.submit()}
                placeholder="请输入密码"
                prefix={<LockOutlined />}
                size="large"
                visibilityToggle={{
                  onVisibleChange: setPasswordVisible,
                  visible: passwordVisible,
                }}
              />
            </Form.Item>
            <Button
              block
              className="login-submit"
              htmlType="submit"
              loading={loading}
              size="large"
              type="primary"
            >
              登录管理后台
            </Button>
          </Form>

          <p className="login-help">账号由服务器部署配置提供，忘记密码请联系系统管理员。</p>
        </div>
      </section>
    </main>
  );
}
