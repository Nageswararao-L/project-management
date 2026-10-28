import {
  DeleteOutlined,
  EditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PRIORITY_LABELS, type Task, TaskStatus } from '@pm/shared';
import {
  Badge,
  Button,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { useDeleteTask, useUpdateTaskStatus } from '../api/hooks';
import { formatDate, relativeDays } from '../utils/format';
import { MemberAvatar } from './MemberAvatar';
import { PriorityTag, TASK_STATUS_OPTIONS, TASK_STATUS_HEX } from './tags';

const PRIORITY_ORDER = Object.keys(PRIORITY_LABELS);
const STATUS_ORDER = Object.values(TaskStatus);

interface Props {
  tasks: Task[];
  loading?: boolean;
  showProject?: boolean;
  onEdit: (task: Task) => void;
}

export function TaskTable({ tasks, loading, showProject, onEdit }: Props) {
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const columns: ColumnsType<Task> = [
    {
      title: 'Task',
      dataIndex: 'title',
      width: 300,
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title: string, task) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link onClick={() => onEdit(task)}>
            {title}
          </Typography.Link>
          {showProject && task.project && (
            <Link to={`/projects/${task.project.id}`}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {task.project.code} · {task.project.name}
              </Typography.Text>
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 160,
      sorter: (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      render: (status: TaskStatus, task) => (
        <Select
          size="small"
          value={status}
          variant="filled"
          style={{ width: 140 }}
          prefix={<Badge color={TASK_STATUS_HEX[status]} />}
          options={TASK_STATUS_OPTIONS}
          onChange={(value) =>
            updateStatus.mutate({ id: task.id, status: value })
          }
        />
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 120,
      sorter: (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      render: (priority) => <PriorityTag priority={priority} />,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      width: 180,
      sorter: (a, b) =>
        (a.assignee?.name ?? '~').localeCompare(b.assignee?.name ?? '~'),
      render: (assignee) => <MemberAvatar member={assignee} />,
    },
    {
      title: 'Start',
      dataIndex: 'startDate',
      width: 120,
      sorter: (a, b) => a.startDate.localeCompare(b.startDate),
      render: formatDate,
    },
    {
      title: 'Due',
      dataIndex: 'dueDate',
      width: 150,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.dueDate.localeCompare(b.dueDate),
      render: (dueDate: string, task) => (
        <Space orientation="vertical" size={0}>
          <span>{formatDate(dueDate)}</span>
          {task.status !== TaskStatus.Done && (
            <Typography.Text
              type={task.isOverdue ? 'danger' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {task.isOverdue && <WarningOutlined />} {relativeDays(dueDate)}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      width: 140,
      sorter: (a, b) => a.progress - b.progress,
      render: (progress: number, task) => (
        <Progress
          percent={progress}
          size="small"
          status={task.isOverdue ? 'exception' : undefined}
        />
      ),
    },
    {
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, task) => (
        <Space size={0}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(task)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this task?"
            description={task.title}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteTask.mutateAsync(task.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={tasks}
      loading={loading}
      scroll={{ x: 1100 }}
      pagination={{
        pageSize: 20,
        hideOnSinglePage: true,
        showSizeChanger: false,
      }}
    />
  );
}
