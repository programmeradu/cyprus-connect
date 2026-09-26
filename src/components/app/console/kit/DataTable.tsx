"use client";

import { ReactNode } from "react";

export interface Column<Row> {
  key: string;
  header: string;
  /** Right-aligns and applies tabular figures. Use for all numbers. */
  numeric?: boolean;
  /** Hides the column below 640px when it is secondary. */
  hideOnMobile?: boolean;
  width?: string;
  render: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  /** Rendered in place of the table when there are no rows. */
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

/**
 * The workspace table, drawn on a console plate. Text left, numbers right
 * on tabular figures, hairline rows, a sticky head, wrapping cells.
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
  if (rows.length === 0) {
    return <>{empty ?? <p className="vck-quiet">Nothing matches this view yet.</p>}</>;
  }

  return (
    <div className={`vck-plate vck-plate-flush ${className}`}>
      <div className="vck-plate-body">
        <div className="vck-table-wrap">
          <table className="vck-table">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    data-numeric={column.numeric ? "true" : undefined}
                    data-hide-sm={column.hideOnMobile ? "true" : undefined}
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
                    <td
                      key={column.key}
                      data-numeric={column.numeric ? "true" : undefined}
                      data-hide-sm={column.hideOnMobile ? "true" : undefined}
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
    </div>
  );
}
