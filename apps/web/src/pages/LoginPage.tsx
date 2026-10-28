import { LockOutlined, MailOutlined, RocketOutlined } from '@ant-design/icons';
import type { LoginInput } from '@pm/shared';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
  theme,
} from 'antd';
import { useState } from 'react';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const { token } = theme.useToken();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: LoginInput) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(values);
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        padding: 16,
        background: token.colorBgLayout,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
          <RocketOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            ProjectPilot
          </Typography.Title>
          <Typography.Text type="secondary">
            Sign in to continue
          </Typography.Text>
        </Flex>
        {error && (
          <Alert
            type="error"
            showIcon
            title={error}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form<LoginInput>
          layout="vertical"
          onFinish={submit}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: 'email', message: 'Enter your email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              autoComplete="username"
              autoFocus
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Sign in
          </Button>
        </Form>
      </Card>
    </Flex>
  );
}
