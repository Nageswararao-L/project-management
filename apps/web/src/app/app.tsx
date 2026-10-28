import {
  CheckSquareOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MoonOutlined,
  ProjectOutlined,
  RocketOutlined,
  SunOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { USER_ROLE_LABELS } from '@pm/shared';
import {
  Button,
  Dropdown,
  Flex,
  Layout,
  Menu,
  Result,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MemberAvatar } from '../components/MemberAvatar';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { TasksPage } from '../pages/TasksPage';
import { TeamPage } from '../pages/TeamPage';

const navItems = (isManager: boolean) => [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: isManager ? 'Projects' : 'My projects',
  },
  {
    key: '/tasks',
    icon: <CheckSquareOutlined />,
    label: isManager ? 'Tasks' : 'My tasks',
  },
  ...(isManager
    ? [{ key: '/team', icon: <TeamOutlined />, label: 'Team' }]
    : []),
];

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function App({ darkMode, onToggleDarkMode }: Props) {
  const { pathname } = useLocation();
  const { token } = theme.useToken();
  const { user, loading, isManager, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }
  if (!user) return <LoginPage />;

  const NAV = navItems(isManager);
  const selected =
    NAV.find((n) => pathname.startsWith(n.key))?.key ?? '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
      >
        <div className="app-logo">
          <RocketOutlined />
          {!collapsed && <span>ProjectPilot</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={NAV.map((n) => ({
            ...n,
            label: <Link to={n.key}>{n.label}</Link>,
          }))}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ height: '100%' }}
          >
            <Typography.Text type="secondary">
              Plan projects, schedule tasks and track progress
            </Typography.Text>
            <Space size={4}>
              <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                <Button
                  type="text"
                  aria-label="Toggle dark mode"
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  onClick={onToggleDarkMode}
                />
              </Tooltip>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: 'Sign out',
                      onClick: logout,
                    },
                  ],
                }}
              >
                <Button
                  type="text"
                  aria-label="Account menu"
                  style={{ height: 40 }}
                >
                  <Space>
                    <MemberAvatar member={user} />
                    <Tag
                      color={isManager ? 'gold' : 'blue'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {USER_ROLE_LABELS[user.role]}
                    </Tag>
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route
              path="/team"
              element={
                isManager ? <TeamPage /> : <Navigate to="/dashboard" replace />
              }
            />
            <Route
              path="*"
              element={
                <Result
                  status="404"
                  title="Page not found"
                  extra={<Link to="/dashboard">Go to dashboard</Link>}
                />
              }
            />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

export default App;
