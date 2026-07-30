"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  /** Numbers align right and set tabular figures. */
  numeric?: boolean;
  width?: string;
  render: (row: T) => ReactNode;
}

/**
 * The console table. Text left, numbers right and tabular, a sticky head,
 * wrapping cells. No ellipsis: a value the user needs is never cut.
 */
export function ConsoleTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing matches this view yet.",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) return <p className="vck-quiet">{empty}</p>;

  return (
    <div className="vck-table-wrap">
      <table className="vck-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                data-numeric={column.numeric ? "true" : undefined}
                style={column.width ? { width: column.width } : undefined}
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
              data-clickable={onRowClick ? "true" : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} data-numeric={column.numeric ? "true" : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
