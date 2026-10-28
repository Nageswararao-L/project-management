import {
  CheckSquareOutlined,
  DashboardOutlined,
  MoonOutlined,
  ProjectOutlined,
  RocketOutlined,
  SunOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Flex,
  Layout,
  Menu,
  Result,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { TasksPage } from '../pages/TasksPage';
import { TeamPage } from '../pages/TeamPage';

const NAV = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projects' },
  { key: '/tasks', icon: <CheckSquareOutlined />, label: 'Tasks' },
  { key: '/team', icon: <TeamOutlined />, label: 'Team' },
];

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function App({ darkMode, onToggleDarkMode }: Props) {
  const { pathname } = useLocation();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
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
            <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
              <Button
                type="text"
                aria-label="Toggle dark mode"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={onToggleDarkMode}
              />
            </Tooltip>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/team" element={<TeamPage />} />
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
