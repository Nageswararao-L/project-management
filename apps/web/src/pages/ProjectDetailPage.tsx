import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  BarsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import {
  CLOSED_PROJECT_STATUSES,
  expectedProgress,
  ProjectHealth,
  type Task,
  TaskStatus,
} from '@pm/shared';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Popconfirm,
  Progress,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useDeleteProject, useProject, useTasks } from '../api/hooks';
import { GanttChart } from '../components/GanttChart';
import { KanbanBoard } from '../components/KanbanBoard';
import { MemberAvatar } from '../components/MemberAvatar';
import { ProjectFormDrawer } from '../components/ProjectFormDrawer';
import { TaskFormDrawer } from '../components/TaskFormDrawer';
import { TaskTable } from '../components/TaskTable';
import {
  HealthBadge,
  PriorityTag,
  ProjectStatusTag,
  TASK_STATUS_HEX,
} from '../components/tags';
import {
  durationDays,
  formatCurrency,
  formatDate,
  relativeDays,
} from '../utils/format';

export function ProjectDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    { projectId: id },
    Number.isFinite(id),
  );
  const deleteProject = useDeleteProject();
  const [editProject, setEditProject] = useState(false);
  const [taskDrawer, setTaskDrawer] = useState<{
    open: boolean;
    task?: Task;
    status?: TaskStatus;
  }>({ open: false });

  if (error) {
    return (
      <Result
        status="404"
        title="Project not found"
        subTitle={errorMessage(error)}
        extra={
          <Button onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        }
      />
    );
  }
  if (isLoading || !project)
    return <Skeleton active paragraph={{ rows: 10 }} />;

  const today = dayjs().format('YYYY-MM-DD');
  const closed = CLOSED_PROJECT_STATUSES.includes(project.status);
  const expected = expectedProgress(project.startDate, project.endDate, today);
  const openTask = (task: Task) => setTaskDrawer({ open: true, task });
  const addTask = (status?: TaskStatus) =>
    setTaskDrawer({ open: true, status });

  return (
    <Flex vertical gap={16}>
      <Link to="/projects">
        <ArrowLeftOutlined /> All projects
      </Link>

      <Flex justify="space-between" align="start" wrap gap={12}>
        <Flex vertical gap={8}>
          <Space wrap align="center">
            <Typography.Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Typography.Title>
            <Tag>{project.code}</Tag>
          </Space>
          <Space wrap>
            <ProjectStatusTag status={project.status} />
            <PriorityTag priority={project.priority} />
            <HealthBadge health={project.health} />
          </Space>
        </Flex>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => setEditProject(true)}>
            Edit project
          </Button>
          <Popconfirm
            title={`Delete ${project.code}?`}
            description="This also deletes all of its tasks."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              await deleteProject.mutateAsync(project.id);
              navigate('/projects');
            }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => addTask()}
          >
            Add task
          </Button>
        </Space>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card style={{ height: '100%' }}>
            <Descriptions
              column={{ xs: 1, sm: 2, lg: 3 }}
              size="small"
              items={[
                {
                  key: 'manager',
                  label: 'Manager',
                  children: <MemberAvatar member={project.manager} />,
                },
                {
                  key: 'client',
                  label: 'Client',
                  children: project.client ?? '—',
                },
                {
                  key: 'budget',
                  label: 'Budget',
                  children: formatCurrency(project.budget),
                },
                {
                  key: 'start',
                  label: 'Start date',
                  children: formatDate(project.startDate),
                },
                {
                  key: 'end',
                  label: 'End date',
                  children: (
                    <Space>
                      {formatDate(project.endDate)}
                      {!closed && (
                        <Typography.Text
                          type={
                            project.endDate < today ? 'danger' : 'secondary'
                          }
                        >
                          ({relativeDays(project.endDate)})
                        </Typography.Text>
                      )}
                    </Space>
                  ),
                },
                {
                  key: 'duration',
                  label: 'Duration',
                  children: `${durationDays(project.startDate, project.endDate)} days`,
                },
                {
                  key: 'description',
                  label: 'Description',
                  span: 'filled',
                  children: (
                    <Typography.Paragraph
                      style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                    >
                      {project.description || (
                        <Typography.Text type="secondary">
                          No description
                        </Typography.Text>
                      )}
                    </Typography.Paragraph>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card style={{ height: '100%' }}>
            <Flex gap={24} align="center" wrap>
              <Tooltip title="Average progress of all tasks">
                <Progress
                  type="circle"
                  percent={project.progress}
                  size={110}
                  status={
                    project.health === ProjectHealth.Overdue
                      ? 'exception'
                      : undefined
                  }
                />
              </Tooltip>
              <Flex vertical gap={8} style={{ flex: 1, minWidth: 160 }}>
                {!closed && (
                  <div>
                    <Typography.Text type="secondary">
                      Time elapsed
                    </Typography.Text>
                    <Progress
                      percent={expected}
                      size="small"
                      strokeColor="#8c8c8c"
                    />
                  </div>
                )}
                <Space size={24}>
                  <Statistic title="Tasks" value={project.taskCount} />
                  <Statistic title="Done" value={project.completedTaskCount} />
                  <Statistic
                    title="Overdue"
                    value={project.overdueTaskCount}
                    styles={
                      project.overdueTaskCount
                        ? { content: { color: '#cf1322' } }
                        : undefined
                    }
                  />
                </Space>
              </Flex>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="board"
          items={[
            {
              key: 'board',
              label: 'Board',
              icon: <AppstoreOutlined />,
              children: (
                <KanbanBoard tasks={tasks} onEdit={openTask} onAdd={addTask} />
              ),
            },
            {
              key: 'list',
              label: 'List',
              icon: <BarsOutlined />,
              children: (
                <TaskTable
                  tasks={tasks}
                  loading={tasksLoading}
                  onEdit={openTask}
                />
              ),
            },
            {
              key: 'timeline',
              label: 'Timeline',
              icon: <ScheduleOutlined />,
              children: (
                <GanttChart
                  items={tasks.map((t) => ({
                    id: t.id,
                    label: (
                      <Flex vertical>
                        <Typography.Text ellipsis>{t.title}</Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          ellipsis
                        >
                          {t.assignee?.name ?? 'Unassigned'}
                        </Typography.Text>
                      </Flex>
                    ),
                    start: t.startDate,
                    end: t.dueDate,
                    progress: t.progress,
                    color: TASK_STATUS_HEX[t.status],
                    tooltip: <strong>{t.title}</strong>,
                    onClick: () => openTask(t),
                  }))}
                />
              ),
            },
          ]}
        />
      </Card>

      <ProjectFormDrawer
        open={editProject}
        project={project}
        onClose={() => setEditProject(false)}
      />
      <TaskFormDrawer
        open={taskDrawer.open}
        task={taskDrawer.task}
        projectId={project.id}
        defaultStatus={taskDrawer.status}
        onClose={() => setTaskDrawer({ open: false })}
      />
    </Flex>
  );
}
