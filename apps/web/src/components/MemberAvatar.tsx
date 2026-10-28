import type { Member } from '@pm/shared';
import { Avatar, Space, Tooltip, Typography } from 'antd';
import { avatarColor, initials } from '../utils/format';

interface Props {
  member: Pick<Member, 'id' | 'name'> | null | undefined;
  showName?: boolean;
  size?: 'small' | 'medium' | 'large' | number;
}

export function MemberAvatar({
  member,
  showName = true,
  size = 'small',
}: Props) {
  if (!member) {
    return <Typography.Text type="secondary">Unassigned</Typography.Text>;
  }
  const avatar = (
    <Avatar
      size={size}
      style={{ backgroundColor: avatarColor(member.id), flexShrink: 0 }}
    >
      {initials(member.name)}
    </Avatar>
  );
  if (!showName) return <Tooltip title={member.name}>{avatar}</Tooltip>;
  return (
    <Space size={6}>
      {avatar}
      <span>{member.name}</span>
    </Space>
  );
}
