import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { type Task, TASK_STATUS_LABELS, TaskStatus } from '@pm/shared';
import {
  Badge,
  Button,
  Card,
  Flex,
  Progress,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { useState } from 'react';
import { useUpdateTaskStatus } from '../api/hooks';
import { formatDate } from '../utils/format';
import { MemberAvatar } from './MemberAvatar';
import { PriorityTag, TASK_STATUS_HEX } from './tags';

interface Props {
  tasks: Task[];
  showProject?: boolean;
  onEdit: (task: Task) => void;
  onAdd?: (status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, showProject, onEdit, onAdd }: Props) {
  const { token } = theme.useToken();
  const updateStatus = useUpdateTaskStatus();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const drop = (status: TaskStatus, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(null);
    const id = Number(event.dataTransfer.getData('text/plain'));
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) updateStatus.mutate({ id, status });
  };

  return (
    <div className="kanban">
      {Object.values(TaskStatus).map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className={`kanban-column${dragOver === status ? ' drag-over' : ''}`}
            style={{ background: token.colorFillQuaternary }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => drop(status, e)}
          >
            <Flex
              justify="space-between"
              align="center"
              style={{ padding: '4px 4px 12px' }}
            >
              <Badge
                color={TASK_STATUS_HEX[status]}
                text={
                  <Typography.Text strong>
                    {TASK_STATUS_LABELS[status]}{' '}
                    <Typography.Text type="secondary">
                      ({columnTasks.length})
                    </Typography.Text>
                  </Typography.Text>
                }
              />
              {onAdd && (
                <Tooltip title="Add task">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => onAdd(status)}
                  />
                </Tooltip>
              )}
            </Flex>
            {columnTasks.map((task) => (
              <Card
                key={task.id}
                size="small"
                className="kanban-card"
                hoverable
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData('text/plain', String(task.id))
                }
                onClick={() => onEdit(task)}
                style={{
                  borderLeft: `3px solid ${TASK_STATUS_HEX[task.status]}`,
                }}
              >
                {showProject && task.project && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {task.project.code}
                  </Typography.Text>
                )}
                <Typography.Paragraph
                  strong
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 8 }}
                >
                  {task.title}
                </Typography.Paragraph>
                <Flex justify="space-between" align="center" gap={8}>
                  <PriorityTag priority={task.priority} />
                  <MemberAvatar member={task.assignee} showName={false} />
                </Flex>
                <Typography.Text
                  type={task.isOverdue ? 'danger' : 'secondary'}
                  style={{ fontSize: 12, display: 'block', marginTop: 8 }}
                >
                  <CalendarOutlined /> Due {formatDate(task.dueDate)}
                </Typography.Text>
                <Progress
                  percent={task.progress}
                  size="small"
                  style={{ margin: 0 }}
                  status={task.isOverdue ? 'exception' : undefined}
                />
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
