import { ValueTransformer } from 'typeorm';

/**
 * SQL Server `date` columns come back as JS Dates at UTC midnight;
 * the API works with plain `YYYY-MM-DD` strings instead.
 */
export const dateTransformer: ValueTransformer = {
  to: (value?: string | null) => value ?? null,
  from: (value?: Date | string | null) => {
    if (value == null) return null;
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  },
};

/** `decimal` columns are returned as strings by the mssql driver. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value ?? null,
  from: (value?: string | number | null) =>
    value == null ? null : Number(value),
};
