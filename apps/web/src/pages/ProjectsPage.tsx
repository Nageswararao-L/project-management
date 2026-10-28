import {
  BarsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ScheduleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  CLOSED_PROJECT_STATUSES,
  PRIORITY_LABELS,
  type Project,
  ProjectStatus,
} from '@pm/shared';
import {
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ProjectFilters,
  useDeleteProject,
  useMembers,
  useProjects,
} from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { GanttChart } from '../components/GanttChart';
import { MemberAvatar } from '../components/MemberAvatar';
import { ProjectFormDrawer } from '../components/ProjectFormDrawer';
import {
  HEALTH_OPTIONS,
  HealthBadge,
  PRIORITY_OPTIONS,
  PriorityTag,
  PROJECT_STATUS_HEX,
  PROJECT_STATUS_OPTIONS,
  ProjectStatusTag,
} from '../components/tags';
import dayjs from 'dayjs';
import { durationDays, formatDate, relativeDays } from '../utils/format';
import { useDebounced } from '../utils/useDebounced';

const PRIORITY_ORDER = Object.keys(PRIORITY_LABELS);

export function ProjectsPage() {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const [drawer, setDrawer] = useState<{ open: boolean; project?: Project }>({
    open: false,
  });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const { data: projects = [], isLoading } = useProjects({
    ...filters,
    search: debouncedSearch,
  });
  const { data: members = [] } = useMembers();
  const deleteProject = useDeleteProject();

  const update = (patch: Partial<ProjectFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const allColumns: ColumnsType<Project> = [
    {
      title: 'Project',
      dataIndex: 'name',
      fixed: 'left',
      width: 205,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, p) => (
        <Flex vertical>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {p.code}
            {p.client && ` · ${p.client}`}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      width: 160,
      render: (m) => <MemberAvatar member={m} />,
    },
    {
      title: 'Start',
      dataIndex: 'startDate',
      width: 130,
      sorter: (a, b) => a.startDate.localeCompare(b.startDate),
      render: formatDate,
    },
    {
      title: 'End',
      dataIndex: 'endDate',
      width: 125,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.endDate.localeCompare(b.endDate),
      render: (end: string, p) => (
        <Flex vertical>
          <Tooltip title={`${durationDays(p.startDate, p.endDate)} days`}>
            <span>{formatDate(end)}</span>
          </Tooltip>
          {!CLOSED_PROJECT_STATUSES.includes(p.status) && (
            <Typography.Text
              type={end < dayjs().format('YYYY-MM-DD') ? 'danger' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {relativeDays(end)}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (s) => <ProjectStatusTag status={s} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 110,
      sorter: (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      render: (p) => <PriorityTag priority={p} />,
    },
    {
      title: 'Health',
      dataIndex: 'health',
      width: 110,
      render: (h) => <HealthBadge health={h} />,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      width: 150,
      sorter: (a, b) => a.progress - b.progress,
      render: (progress: number, p) => (
        <Tooltip
          title={`${p.completedTaskCount} of ${p.taskCount} tasks done${p.overdueTaskCount ? `, ${p.overdueTaskCount} overdue` : ''}`}
        >
          <Flex vertical>
            <Progress percent={progress} size="small" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {p.completedTaskCount}/{p.taskCount} tasks
            </Typography.Text>
          </Flex>
        </Tooltip>
      ),
    },
    {
      key: 'actions',
      width: 90,
      fixed: 'right',
      align: 'right',
      render: (_, p) => (
        <Space size={0} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setDrawer({ open: true, project: p })}
            />
          </Tooltip>
          <Popconfirm
            title={`Delete ${p.code}?`}
            description="This also deletes all of its tasks."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteProject.mutateAsync(p.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const columns = isManager
    ? allColumns
    : allColumns.filter((c) => c.key !== 'actions');

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isManager ? 'Projects' : 'My projects'}
        </Typography.Title>
        <Space wrap>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'table', icon: <BarsOutlined />, label: 'List' },
              {
                value: 'timeline',
                icon: <ScheduleOutlined />,
                label: 'Timeline',
              },
            ]}
          />
          {isManager && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setDrawer({ open: true })}
            >
              New project
            </Button>
          )}
        </Space>
      </Flex>

      <Card size="small">
        <Flex wrap gap={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search code, name or client"
            style={{ width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Status"
            style={{ minWidth: 200 }}
            options={PROJECT_STATUS_OPTIONS}
            onChange={(status: ProjectStatus[]) => update({ status })}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Priority"
            style={{ minWidth: 160 }}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => update({ priority })}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Health"
            style={{ minWidth: 160 }}
            options={HEALTH_OPTIONS}
            onChange={(health) => update({ health })}
          />
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Manager"
            style={{ minWidth: 180 }}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
            onChange={(managerId?: number) => update({ managerId })}
          />
        </Flex>
      </Card>

      {view === 'table' ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={projects}
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          onRow={(p) => ({
            onClick: () => navigate(`/projects/${p.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      ) : (
        <Card>
          <GanttChart
            items={projects.map((p) => ({
              id: p.id,
              label: (
                <Flex vertical>
                  <Typography.Text strong ellipsis>
                    {p.name}
                  </Typography.Text>
                  <HealthBadge health={p.health} />
                </Flex>
              ),
              start: p.startDate,
              end: p.endDate,
              progress: p.progress,
              color: PROJECT_STATUS_HEX[p.status],
              tooltip: (
                <strong>
                  {p.code} · {p.name}
                </strong>
              ),
              onClick: () => navigate(`/projects/${p.id}`),
            }))}
          />
        </Card>
      )}

      <ProjectFormDrawer
        open={drawer.open}
        project={drawer.project}
        onClose={() => setDrawer({ open: false })}
        onSaved={(p) => !drawer.project && navigate(`/projects/${p.id}`)}
      />
    </Flex>
  );
}
