import { Tooltip, Typography, theme } from 'antd';
import { Fragment, type ReactNode } from 'react';

export interface BarRow {
  key: string | number;
  label: ReactNode;
  value: number;
  color: string;
  /** Optional text after the count, e.g. "2 overdue". */
  note?: ReactNode;
  tooltip?: ReactNode;
}

/**
 * Labeled horizontal bars (label · bar · value). Every bar carries its own text
 * label, so categories never depend on color alone.
 */
export function BarRows({ rows, max }: { rows: BarRow[]; max?: number }) {
  const { token } = theme.useToken();
  const scale = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(90px, 140px) 1fr auto',
        gap: '10px 12px',
        alignItems: 'center',
      }}
    >
      {rows.map((row) => (
        <Fragment key={row.key}>
          <Typography.Text ellipsis style={{ gridColumn: 1 }}>
            {row.label}
          </Typography.Text>
          <Tooltip
            title={
              row.tooltip ?? (
                <>
                  {row.label}: {row.value}
                </>
              )
            }
          >
            <div
              style={{
                gridColumn: 2,
                height: 10,
                borderRadius: 4,
                background: token.colorFillSecondary,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(row.value / scale) * 100}%`,
                  minWidth: row.value ? 4 : 0,
                  height: '100%',
                  borderRadius: 4,
                  background: row.color,
                }}
              />
            </div>
          </Tooltip>
          <Typography.Text
            style={{ gridColumn: 3, minWidth: 24, textAlign: 'right' }}
          >
            {row.value}
            {row.note && <> {row.note}</>}
          </Typography.Text>
        </Fragment>
      ))}
    </div>
  );
}
