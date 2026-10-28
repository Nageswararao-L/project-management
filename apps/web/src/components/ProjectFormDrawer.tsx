import {
  Priority,
  type Project,
  type ProjectInput,
  ProjectStatus,
} from '@pm/shared';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { useMembers, useSaveProject } from '../api/hooks';
import { DATE_FORMAT, durationDays, toApiDate } from '../utils/format';
import { PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from './tags';

interface FormValues extends Omit<ProjectInput, 'startDate' | 'endDate'> {
  schedule: [Dayjs, Dayjs];
}

interface Props {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}

export function ProjectFormDrawer({ open, project, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { data: members = [] } = useMembers();
  const save = useSaveProject();
  const schedule = Form.useWatch('schedule', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (project) {
      form.setFieldsValue({
        ...project,
        schedule: [dayjs(project.startDate), dayjs(project.endDate)],
      });
    } else {
      form.setFieldsValue({
        status: ProjectStatus.Planning,
        priority: Priority.Medium,
      });
    }
  }, [open, project, form]);

  const submit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const {
      schedule: [start, end],
      ...rest
    } = values;
    const saved = await save
      .mutateAsync({
        id: project?.id,
        data: {
          ...rest,
          description: rest.description || null,
          client: rest.client || null,
          managerId: rest.managerId ?? null,
          startDate: toApiDate(start),
          endDate: toApiDate(end),
        },
      })
      .catch(() => null); // error toast is shown by the mutation
    if (!saved) return;
    onSaved?.(saved);
    onClose();
  };

  return (
    <Drawer
      title={project ? `Edit ${project.code}` : 'New project'}
      size={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={submit}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="code"
              label="Code"
              rules={[
                { required: true, message: 'Enter a project code' },
                {
                  pattern: /^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/,
                  message: '2-20 letters, numbers, - or _',
                },
              ]}
              normalize={(v?: string) => v?.toUpperCase()}
            >
              <Input placeholder="CRM-01" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Project name"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Enter a project name',
                },
              ]}
            >
              <Input placeholder="Customer Portal Revamp" maxLength={150} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="schedule"
          label="Schedule (start – end date)"
          rules={[
            { required: true, message: 'Select the start and end dates' },
          ]}
          extra={
            schedule?.[0] && schedule?.[1]
              ? `${durationDays(toApiDate(schedule[0]), toApiDate(schedule[1]))} days`
              : undefined
          }
        >
          <DatePicker.RangePicker
            format={DATE_FORMAT}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select options={PROJECT_STATUS_OPTIONS} />
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
            <Form.Item name="managerId" label="Project manager">
              <Select
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Select a manager"
                options={members.map((m) => ({ value: m.id, label: m.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="client" label="Client">
              <Input placeholder="Acme Corp" maxLength={150} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={4}
            placeholder="Goals, scope and key deliverables"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
