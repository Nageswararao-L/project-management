import { Priority, type Task, type TaskInput, TaskStatus } from '@pm/shared';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { useMembers, useProjects, useSaveTask } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { DATE_FORMAT, formatDate, toApiDate } from '../utils/format';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './tags';

interface FormValues extends Omit<TaskInput, 'startDate' | 'dueDate'> {
  schedule: [Dayjs, Dayjs];
}

interface Props {
  open: boolean;
  task?: Task | null;
  /** Pre-selects (and locks) the project when adding from a project page. */
  projectId?: number;
  /** Initial status, e.g. when adding from a Kanban column. */
  defaultStatus?: TaskStatus;
  onClose: () => void;
}

export function TaskFormDrawer({
  open,
  task,
  projectId,
  defaultStatus,
  onClose,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useMembers();
  const save = useSaveTask();
  const { isManager } = useAuth();
  // Users can open their own tasks but only change status and progress.
  const limited = !isManager;

  const selectedProjectId = Form.useWatch('projectId', form);
  const status = Form.useWatch('status', form);
  const project = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (task) {
      form.setFieldsValue({
        ...task,
        schedule: [dayjs(task.startDate), dayjs(task.dueDate)],
      });
    } else {
      form.setFieldsValue({
        projectId,
        status: defaultStatus ?? TaskStatus.Todo,
        priority: Priority.Medium,
        progress: 0,
      });
    }
  }, [open, task, projectId, defaultStatus, form]);

  const submit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const {
      schedule: [start, due],
      ...rest
    } = values;
    const saved = await save
      .mutateAsync({
        id: task?.id,
        ownTaskOnly: limited,
        data: {
          ...rest,
          description: rest.description || null,
          assigneeId: rest.assigneeId ?? null,
          estimatedHours: rest.estimatedHours ?? null,
          startDate: toApiDate(start),
          dueDate: toApiDate(due),
        },
      })
      .catch(() => null); // error toast is shown by the mutation
    if (saved) onClose();
  };

  const outsideProject = (date: Dayjs) =>
    !!project &&
    (date.isBefore(dayjs(project.startDate), 'day') ||
      date.isAfter(dayjs(project.endDate), 'day'));

  return (
    <Drawer
      title={limited ? 'Update my task' : task ? 'Edit task' : 'New task'}
      size={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={submit}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        disabled={limited}
      >
        {limited && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="You can update the status and progress of your task. Ask your manager to change anything else."
          />
        )}
        <Form.Item
          name="projectId"
          label="Project"
          rules={[{ required: true, message: 'Select a project' }]}
        >
          <Select
            disabled={!!task || !!projectId}
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Select a project"
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.code} · ${p.name}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, whitespace: true, message: 'Enter a task title' },
          ]}
        >
          <Input placeholder="What needs to be done?" maxLength={200} />
        </Form.Item>
        {project && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={`Project schedule: ${formatDate(project.startDate)} – ${formatDate(project.endDate)}`}
          />
        )}
        <Form.Item
          name="schedule"
          label="Start – due date"
          rules={[
            { required: true, message: 'Select the start and due dates' },
          ]}
        >
          <DatePicker.RangePicker
            format={DATE_FORMAT}
            style={{ width: '100%' }}
            disabledDate={outsideProject}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select
                disabled={false}
                options={TASK_STATUS_OPTIONS}
                onChange={(value: TaskStatus) => {
                  if (value === TaskStatus.Done)
                    form.setFieldValue('progress', 100);
                  if (value === TaskStatus.Todo)
                    form.setFieldValue('progress', 0);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true }]}
            >
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assigneeId" label="Assignee">
              <Select
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Unassigned"
                options={
                  members.length
                    ? members
                        .filter((m) => m.isActive || m.id === task?.assigneeId)
                        .map((m) => ({ value: m.id, label: m.name }))
                    : task?.assignee
                      ? [{ value: task.assignee.id, label: task.assignee.name }]
                      : []
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="estimatedHours" label="Estimate (hours)">
              <InputNumber
                min={0}
                max={999999}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="progress" label="Progress (%)">
          <Slider
            style={{ marginInline: 12 }}
            min={0}
            max={100}
            step={5}
            disabled={status === TaskStatus.Done}
            marks={{ 0: '0%', 50: '50%', 100: '100%' }}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={4}
            placeholder="Details, acceptance criteria, links…"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
