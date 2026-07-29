"use client";

import { ReactNode } from "react";

export interface Column<Row> {
  key: string;
  header: string;
  /** Right-aligns and applies tabular figures. Use for all numbers. */
  numeric?: boolean;
  /** Hide below the sm breakpoint when the column is secondary. */
  hideOnMobile?: boolean;
  width?: string;
  render: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  /** Rendered inside the table frame when there are no rows. */
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

/**
 * The workspace table. Text left, numbers right on tabular figures,
 * hairline rows, sticky header. Scrollable in x only when the content
 * genuinely exceeds the frame, and never clipping a label.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  caption,
  className = ""
}: DataTableProps<Row>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={`app-card overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[var(--app-rule)] bg-[var(--app-surface-2)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground ${
                    column.numeric ? "text-right" : "text-left"
                  } ${column.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-[var(--app-rule)] last:border-b-0 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-[var(--app-surface-2)] transition-colors"
                    : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle text-sm ${
                      column.numeric
                        ? "app-num text-right whitespace-nowrap"
                        : "text-left"
                    } ${column.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
