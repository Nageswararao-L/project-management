import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  HEALTH_LABELS,
  PROJECT_STATUS_LABELS,
  ProjectHealth,
  ProjectStatus,
  type Task,
  TASK_STATUS_LABELS,
  TaskStatus,
  type UpcomingDeadline,
} from '@pm/shared';
import {
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Result,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useDashboard } from '../api/hooks';
import { BarRows } from '../components/BarRows';
import { MemberAvatar } from '../components/MemberAvatar';
import { TaskFormDrawer } from '../components/TaskFormDrawer';
import {
  HEALTH_HEX,
  HealthBadge,
  PriorityTag,
  PROJECT_STATUS_HEX,
  TASK_STATUS_HEX,
} from '../components/tags';
import { formatDate, relativeDays } from '../utils/format';

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Task | null>(null);

  if (error) {
    return (
      <Result
        status="warning"
        title="Could not load the dashboard"
        subTitle={errorMessage(error)}
      />
    );
  }
  if (isLoading || !data) return <Skeleton active paragraph={{ rows: 12 }} />;

  const { totals } = data;
  const tiles = [
    {
      title: 'Projects',
      value: totals.projects,
      icon: <ProjectOutlined />,
      suffix: (
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          {totals.activeProjects} in progress
        </Typography.Text>
      ),
    },
    {
      title: 'Open tasks',
      value: totals.openTasks,
      icon: <FolderOpenOutlined />,
      suffix: (
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          of {totals.tasks}
        </Typography.Text>
      ),
    },
    {
      title: 'Overdue tasks',
      value: totals.overdueTasks,
      icon: <WarningOutlined />,
      danger: totals.overdueTasks > 0,
    },
    {
      title: 'Completed (last 30 days)',
      value: totals.completedTasksLast30Days,
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Dashboard
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {tiles.map((tile) => (
          <Col key={tile.title} xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title={
                  <Flex gap={8}>
                    {tile.icon}
                    {tile.title}
                  </Flex>
                }
                value={tile.value}
                suffix={tile.suffix}
                styles={
                  tile.danger ? { content: { color: '#cf1322' } } : undefined
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Projects by status" style={{ height: '100%' }}>
            <BarRows
              rows={Object.values(ProjectStatus).map((s) => ({
                key: s,
                label: PROJECT_STATUS_LABELS[s],
                value: data.projectsByStatus[s],
                color: PROJECT_STATUS_HEX[s],
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Schedule health" style={{ height: '100%' }}>
            <BarRows
              rows={Object.values(ProjectHealth).map((h) => ({
                key: h,
                label: HEALTH_LABELS[h],
                value: data.projectsByHealth[h],
                color: HEALTH_HEX[h],
              }))}
            />
            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}
            >
              At risk = on hold, has overdue tasks, or progress more than 15%
              behind the time elapsed.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tasks by status" style={{ height: '100%' }}>
            <BarRows
              rows={Object.values(TaskStatus).map((s) => ({
                key: s,
                label: TASK_STATUS_LABELS[s],
                value: data.tasksByStatus[s],
                color: TASK_STATUS_HEX[s],
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <>
                <WarningOutlined /> Overdue tasks
              </>
            }
            style={{ height: '100%' }}
          >
            <Table<Task>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.overdueTasks}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No overdue tasks 🎉"
                  />
                ),
              }}
              onRow={(task) => ({
                onClick: () => setEditing(task),
                style: { cursor: 'pointer' },
              })}
              scroll={{ x: 560 }}
              columns={[
                {
                  title: 'Task',
                  dataIndex: 'title',
                  render: (title, task) => (
                    <Flex vertical>
                      <Typography.Text>{title}</Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {task.project?.code} · {task.project?.name}
                      </Typography.Text>
                    </Flex>
                  ),
                },
                {
                  title: 'Priority',
                  dataIndex: 'priority',
                  width: 110,
                  render: (p) => <PriorityTag priority={p} />,
                },
                {
                  title: 'Assignee',
                  dataIndex: 'assignee',
                  width: 160,
                  render: (m) => <MemberAvatar member={m} />,
                },
                {
                  title: 'Due',
                  dataIndex: 'dueDate',
                  width: 130,
                  render: (d: string) => (
                    <Flex vertical>
                      <span>{formatDate(d)}</span>
                      <Typography.Text type="danger" style={{ fontSize: 12 }}>
                        {relativeDays(d)}
                      </Typography.Text>
                    </Flex>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title={
              <>
                <ClockCircleOutlined /> Upcoming deadlines (14 days)
              </>
            }
            style={{ height: '100%' }}
          >
            <Table<UpcomingDeadline>
              rowKey={(d) => `${d.type}-${d.id}`}
              size="small"
              pagination={false}
              showHeader={false}
              dataSource={data.upcomingDeadlines}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Nothing due in the next 14 days"
                  />
                ),
              }}
              onRow={(d) => ({
                onClick: () => navigate(`/projects/${d.projectId}`),
                style: { cursor: 'pointer' },
              })}
              columns={[
                {
                  dataIndex: 'title',
                  render: (title, d) => (
                    <Flex vertical>
                      <span>
                        <Tag
                          color={d.type === 'project' ? 'geekblue' : 'default'}
                        >
                          {d.type === 'project' ? 'Project end' : 'Task'}
                        </Tag>
                        {title}
                      </span>
                      {d.type === 'task' && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {d.projectName}
                        </Typography.Text>
                      )}
                    </Flex>
                  ),
                },
                {
                  dataIndex: 'dueDate',
                  width: 120,
                  align: 'right',
                  render: (date: string, d) => (
                    <Flex vertical>
                      <span>{formatDate(date)}</span>
                      <Typography.Text
                        type={d.daysLeft <= 2 ? 'warning' : 'secondary'}
                        style={{ fontSize: 12 }}
                      >
                        {relativeDays(date)}
                      </Typography.Text>
                    </Flex>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <>
                <WarningOutlined /> Projects needing attention
              </>
            }
            extra={<Link to="/projects">All projects</Link>}
          >
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.atRiskProjects}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="All open projects are on track"
                  />
                ),
              }}
              onRow={(p) => ({
                onClick: () => navigate(`/projects/${p.id}`),
                style: { cursor: 'pointer' },
              })}
              scroll={{ x: 520 }}
              columns={[
                {
                  title: 'Project',
                  dataIndex: 'name',
                  render: (name, p) => `${p.code} · ${name}`,
                },
                {
                  title: 'Health',
                  dataIndex: 'health',
                  width: 110,
                  render: (h) => <HealthBadge health={h} />,
                },
                {
                  title: 'Ends',
                  dataIndex: 'endDate',
                  width: 120,
                  render: formatDate,
                },
                {
                  title: 'Progress',
                  dataIndex: 'progress',
                  width: 150,
                  render: (v: number) => <Progress percent={v} size="small" />,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title="Team workload (open tasks)"
            extra={<Link to="/team">Team</Link>}
          >
            {data.workload.length ? (
              <BarRows
                rows={[...data.workload]
                  .sort((a, b) => b.openTasks - a.openTasks)
                  .map((m) => ({
                    key: m.id,
                    label: m.name,
                    value: m.openTasks,
                    color: '#1677ff',
                    note: m.overdueTasks ? (
                      <Typography.Text type="danger">
                        <WarningOutlined /> {m.overdueTasks} overdue
                      </Typography.Text>
                    ) : undefined,
                    tooltip: `${m.name}: ${m.openTasks} open, ${m.overdueTasks} overdue`,
                  }))}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No team members yet"
              />
            )}
          </Card>
        </Col>
      </Row>

      <TaskFormDrawer
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
    </Flex>
  );
}
