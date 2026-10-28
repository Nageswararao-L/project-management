import { Empty, Flex, Tooltip, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { type ReactNode, useMemo } from 'react';
import { formatDate } from '../utils/format';

export interface GanttItem {
  id: number;
  label: ReactNode;
  start: string;
  end: string;
  /** 0-100 */
  progress: number;
  color: string;
  tooltip?: ReactNode;
  onClick?: () => void;
}

/** Lightweight Gantt-style timeline: one bar per item, month grid and a "today" marker. */
export function GanttChart({ items }: { items: GanttItem[] }) {
  const { token } = theme.useToken();

  const range = useMemo(() => {
    if (!items.length) return null;
    const today = dayjs().startOf('day');
    let min = dayjs(items[0].start);
    let max = dayjs(items[0].end);
    for (const item of items) {
      if (dayjs(item.start).isBefore(min)) min = dayjs(item.start);
      if (dayjs(item.end).isAfter(max)) max = dayjs(item.end);
    }
    // Keep "today" visible when it is close to the planned range.
    if (today.isBefore(min) && min.diff(today, 'day') < 60) min = today;
    if (today.isAfter(max) && today.diff(max, 'day') < 60) max = today;
    const start = min.startOf('month');
    const end = max.endOf('month').add(1, 'day').startOf('day');
    const totalDays = end.diff(start, 'day');
    const months: { label: string; left: number; width: number }[] = [];
    for (let m = start; m.isBefore(end); m = m.add(1, 'month')) {
      const days = m.daysInMonth();
      months.push({
        label: m.format(totalDays > 400 ? 'MMM YY' : 'MMM YYYY'),
        left: (m.diff(start, 'day') / totalDays) * 100,
        width: (days / totalDays) * 100,
      });
    }
    const todayOffset = today.diff(start, 'day');
    return {
      start,
      totalDays,
      months,
      today:
        todayOffset >= 0 && todayOffset <= totalDays
          ? (todayOffset / totalDays) * 100
          : null,
    };
  }, [items]);

  if (!range) return <Empty description="Nothing scheduled yet" />;

  const position = (startDate: string, endDate: string) => {
    const left = dayjs(startDate).diff(range.start, 'day');
    const width = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    return {
      left: `${(left / range.totalDays) * 100}%`,
      width: `max(${(width / range.totalDays) * 100}%, 6px)`,
    };
  };

  const grid = (
    <>
      {range.months.map((m) => (
        <div
          key={m.left}
          className="gantt-gridline"
          style={{ left: `${m.left}%`, background: token.colorBorderSecondary }}
        />
      ))}
      {range.today !== null && (
        <div className="gantt-today" style={{ left: `${range.today}%` }} />
      )}
    </>
  );

  return (
    <div className="gantt">
      <div
        className="gantt-row"
        style={{ borderBottom: `1px solid ${token.colorBorder}` }}
      >
        <div />
        <div className="gantt-track" style={{ height: 28 }}>
          {range.months.map((m) => (
            <Typography.Text
              key={m.left}
              type="secondary"
              style={{
                position: 'absolute',
                left: `${m.left}%`,
                width: `${m.width}%`,
                paddingLeft: 6,
                fontSize: 12,
                lineHeight: '28px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </Typography.Text>
          ))}
        </div>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="gantt-row"
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <div className="gantt-label">{item.label}</div>
          <div className="gantt-track">
            {grid}
            <Tooltip
              title={
                <Flex vertical>
                  {item.tooltip}
                  <span>
                    {formatDate(item.start)} – {formatDate(item.end)}
                  </span>
                  <span>{item.progress}% complete</span>
                </Flex>
              }
            >
              <div
                className="gantt-bar"
                style={{
                  ...position(item.start, item.end),
                  background: item.color,
                }}
                onClick={item.onClick}
              >
                <div
                  className="gantt-bar-fill"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </Tooltip>
          </div>
        </div>
      ))}
      <Flex gap={16} style={{ marginTop: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 2,
              background: '#ff4d4f',
              verticalAlign: 'middle',
            }}
          />{' '}
          Today
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Darker part of a bar = completed work
        </Typography.Text>
      </Flex>
    </div>
  );
}
