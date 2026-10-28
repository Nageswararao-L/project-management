import {
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Task, TaskStatus } from '@pm/shared';
import {
  Button,
  Card,
  Flex,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useState } from 'react';
import {
  type TaskFilters,
  useMembers,
  useProjects,
  useTasks,
} from '../api/hooks';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskFormDrawer } from '../components/TaskFormDrawer';
import { TaskTable } from '../components/TaskTable';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../components/tags';
import { useDebounced } from '../utils/useDebounced';

export function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [drawer, setDrawer] = useState<{
    open: boolean;
    task?: Task;
    status?: TaskStatus;
  }>({ open: false });
  const { data: tasks = [], isLoading } = useTasks({
    ...filters,
    search: debouncedSearch,
  });
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useMembers();

  const update = (patch: Partial<TaskFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const openTask = (task: Task) => setDrawer({ open: true, task });

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Tasks
        </Typography.Title>
        <Space wrap>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'list', icon: <BarsOutlined />, label: 'List' },
              { value: 'board', icon: <AppstoreOutlined />, label: 'Board' },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawer({ open: true })}
          >
            New task
          </Button>
        </Space>
      </Flex>

      <Card size="small">
        <Flex wrap gap={8} align="center">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search tasks"
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Project"
            style={{ minWidth: 220 }}
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.code} · ${p.name}`,
            }))}
            onChange={(projectId?: number) => update({ projectId })}
          />
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Assignee"
            style={{ minWidth: 170 }}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
            onChange={(assigneeId?: number) => update({ assigneeId })}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Status"
            style={{ minWidth: 180 }}
            options={TASK_STATUS_OPTIONS}
            onChange={(status) => update({ status })}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Priority"
            style={{ minWidth: 150 }}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => update({ priority })}
          />
          <Space>
            <Switch size="small" onChange={(overdue) => update({ overdue })} />
            <span>Overdue only</span>
          </Space>
        </Flex>
      </Card>

      {view === 'list' ? (
        <Card>
          <TaskTable
            tasks={tasks}
            loading={isLoading}
            showProject
            onEdit={openTask}
          />
        </Card>
      ) : (
        <KanbanBoard
          tasks={tasks}
          showProject
          onEdit={openTask}
          onAdd={(status) => setDrawer({ open: true, status })}
        />
      )}

      <TaskFormDrawer
        open={drawer.open}
        task={drawer.task}
        projectId={filters.projectId}
        defaultStatus={drawer.status}
        onClose={() => setDrawer({ open: false })}
      />
    </Flex>
  );
}
