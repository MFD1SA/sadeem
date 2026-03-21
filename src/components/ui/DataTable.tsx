import { type ReactNode } from 'react';
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, keyField, onRowClick, emptyMessage }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`text-right rtl:text-right ltr:text-left px-3.5 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-content-tertiary text-sm">
                {emptyMessage || 'لا توجد بيانات'}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-border last:border-b-0 hover:bg-surface-secondary/60 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-3.5 py-2.5 text-content-primary align-middle ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
