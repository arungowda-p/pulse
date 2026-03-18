import React from 'react';
import {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  ReactNode,
} from 'react';

const tableRoot =
  'w-full min-w-[600px] border-collapse text-left text-sm text-slate-700';
const theadRow = 'border-b border-slate-200 bg-slate-50';
const thCell =
  'px-4 py-3 font-semibold text-slate-700 first:rounded-tl-lg last:rounded-tr-lg';
const tbodyRow =
  'border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80';
const tdCell = 'px-4 py-3 first:pl-4 last:pr-4';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <table className={`${tableRoot} ${className}`.trim()} {...props}>
      {children}
    </table>
  );
}

interface TableHeaderProps {
  children: ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead>{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({
  children,
  className = '',
  ...props
}: TableRowProps) {
  return (
    <tr className={`${tbodyRow} ${className}`.trim()} {...props}>
      {children}
    </tr>
  );
}

interface TableHeaderRowProps {
  children: ReactNode;
}

export function TableHeaderRow({ children }: TableHeaderRowProps) {
  return <tr className={theadRow}>{children}</tr>;
}

interface TableHeadCellProps extends ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function TableHeadCell({
  children,
  align = 'left',
  className = '',
  ...props
}: TableHeadCellProps) {
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left';
  return (
    <th className={`${thCell} ${alignClass} ${className}`.trim()} {...props}>
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export function TableCell({
  children,
  align = 'left',
  className = '',
  ...props
}: TableCellProps) {
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left';
  return (
    <td className={`${tdCell} ${alignClass} ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}

interface TableContainerProps {
  children: ReactNode;
  className?: string;
}

export function TableContainer({
  children,
  className = '',
}: TableContainerProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

Table.Header = TableHeader;
Table.HeaderRow = TableHeaderRow;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeadCell = TableHeadCell;
Table.Cell = TableCell;
Table.Container = TableContainer;
