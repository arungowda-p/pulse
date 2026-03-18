'use client';

import {
  Table,
  TableContainer,
  Toggle,
  Badge,
} from './ui';
import { HiPencilSquare, HiTrash } from 'react-icons/hi2';
import type { Flag } from '../types/flag';

interface FlagTableProps {
  flags: Flag[];
  onToggle: (key: string, on: boolean) => void;
  onEdit: (flag: Flag) => void;
  onDelete: (key: string) => void;
}

export function FlagTable({ flags, onToggle, onEdit, onDelete }: FlagTableProps) {
  return (
    <TableContainer>
      <Table>
        <Table.Header>
          <Table.HeaderRow>
            <Table.HeadCell>Key</Table.HeadCell>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell align="right">Actions</Table.HeadCell>
          </Table.HeaderRow>
        </Table.Header>
        <Table.Body>
          {flags.map((flag) => (
            <Table.Row key={flag.key}>
              <Table.Cell>
                <code className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-medium text-indigo-700">
                  {flag.key}
                </code>
              </Table.Cell>
              <Table.Cell className="font-medium text-slate-900">
                {flag.name}
              </Table.Cell>
              <Table.Cell>
                <Badge variant={flag.on ? 'on' : 'off'}>
                  {flag.on ? 'On' : 'Off'}
                </Badge>
              </Table.Cell>
              <Table.Cell align="right">
                <div className="flex flex-row items-center justify-end gap-3">
                  <Toggle
                    checked={flag.on}
                    label={`Toggle ${flag.key}`}
                    onClick={() => onToggle(flag.key, flag.on)}
                  />
                  <button
                    type="button"
                    onClick={() => onEdit(flag)}
                    aria-label={`Edit ${flag.key}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  >
                    <HiPencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(flag.key)}
                    aria-label={`Delete ${flag.key}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </TableContainer>
  );
}
