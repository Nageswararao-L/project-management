import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { MemberInput, MemberWithWorkload } from '@pm/shared';
import {
  Button,
  Card,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useDeleteMember, useMembers, useSaveMember } from '../api/hooks';
import { MemberAvatar } from '../components/MemberAvatar';

function MemberModal({
  member,
  open,
  onClose,
}: {
  member?: MemberWithWorkload;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<MemberInput>();
  const save = useSaveMember();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(member ?? { isActive: true });
  }, [open, member, form]);

  const submit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const saved = await save
      .mutateAsync({
        id: member?.id,
        data: { ...values, role: values.role || null },
      })
      .catch(() => null);
    if (saved) onClose();
  };

  return (
    <Modal
      title={member ? 'Edit team member' : 'Add team member'}
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={member ? 'Save' : 'Add'}
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="name"
          label="Full name"
          rules={[
            { required: true, whitespace: true, message: 'Enter a name' },
          ]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input maxLength={150} />
        </Form.Item>
        <Form.Item name="role" label="Role">
          <Input placeholder="e.g. Backend Developer" maxLength={100} />
        </Form.Item>
        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
          extra="Inactive members can't be assigned new tasks."
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function TeamPage() {
  const { data: members = [], isLoading } = useMembers();
  const deleteMember = useDeleteMember();
  const [modal, setModal] = useState<{
    open: boolean;
    member?: MemberWithWorkload;
  }>({ open: false });

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3} style={{ margin: 0 }}>
          Team
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModal({ open: true })}
        >
          Add member
        </Button>
      </Flex>
      <Card>
        <Table<MemberWithWorkload>
          rowKey="id"
          loading={isLoading}
          dataSource={members}
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              sorter: (a, b) => a.name.localeCompare(b.name),
              render: (_, m) => (
                <Space>
                  <MemberAvatar member={m} />
                  {!m.isActive && <Tag>Inactive</Tag>}
                </Space>
              ),
            },
            { title: 'Role', dataIndex: 'role', render: (r) => r ?? '—' },
            {
              title: 'Email',
              dataIndex: 'email',
              render: (e: string) => <a href={`mailto:${e}`}>{e}</a>,
            },
            {
              title: 'Open tasks',
              dataIndex: 'openTasks',
              width: 120,
              align: 'right',
              sorter: (a, b) => a.openTasks - b.openTasks,
            },
            {
              title: 'Overdue',
              dataIndex: 'overdueTasks',
              width: 110,
              align: 'right',
              sorter: (a, b) => a.overdueTasks - b.overdueTasks,
              render: (n: number) =>
                n ? (
                  <Typography.Text type="danger">
                    <WarningOutlined /> {n}
                  </Typography.Text>
                ) : (
                  0
                ),
            },
            {
              title: 'Managing',
              dataIndex: 'managedProjects',
              width: 110,
              align: 'right',
              render: (n: number) => `${n} project${n === 1 ? '' : 's'}`,
            },
            {
              key: 'actions',
              width: 90,
              align: 'right',
              render: (_, m) => (
                <Space size={0}>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => setModal({ open: true, member: m })}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={`Remove ${m.name}?`}
                    description="Their tasks and projects become unassigned."
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => deleteMember.mutateAsync(m.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <MemberModal
        open={modal.open}
        member={modal.member}
        onClose={() => setModal({ open: false })}
      />
    </Flex>
  );
}
