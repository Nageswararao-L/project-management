import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsISO8601, Matches } from 'class-validator';

/** Validates a `YYYY-MM-DD` calendar date. */
export function IsIsoDate(): PropertyDecorator {
  return (target, key) => {
    IsISO8601({ strict: true })(target, key);
    Matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: `${String(key)} must be a date in YYYY-MM-DD format`,
    })(target, key);
  };
}

export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Turns `?status=A,B` or `?status=A&status=B` into an array. */
export const ToArray = () =>
  Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map((v) => String(v).trim()).filter(Boolean);
  });

export function assertDateRange(
  start: string,
  end: string,
  startLabel: string,
  endLabel: string,
) {
  if (end < start) {
    throw new BadRequestException(
      `${endLabel} (${end}) cannot be before ${startLabel} (${start})`,
    );
  }
}
