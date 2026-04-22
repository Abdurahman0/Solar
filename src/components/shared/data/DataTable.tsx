import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, LoadingState } from '../page';

type DataTableAlign = 'left' | 'center' | 'right';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  render?: (row: T) => ReactNode;
  align?: DataTableAlign;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey?: keyof T | ((row: T, index: number) => string);
  selectedRowKey?: string | null;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T, index: number) => string;
  rowReorder?: {
    enabled?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    onReorder: (fromIndex: number, toIndex: number) => void;
  };
}

const TABLE_SHELL_CLASS_NAME = [
  'table-shell overflow-x-auto rounded-xl bg-surface-card p-2 shadow-sm ring-1 ring-border-soft/40',
  '[-webkit-overflow-scrolling:touch]',
  '[&>div]:min-h-[240px] [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none [&>div]:ring-0',
].join(' ');

const TABLE_CLASS_NAME =
  'data-table min-w-[620px] w-full border-separate border-spacing-y-1.5 min-[768px]:min-w-[720px]';

const ROW_CLASS_NAME =
  'data-table__row bg-surface-subtle/70';


const CLICKABLE_ROW_CLASS_NAME = [
  ROW_CLASS_NAME,
  'data-table__row--clickable cursor-pointer transition-colors duration-fast hover:bg-primary/8',
].join(' ');

const SELECTED_ROW_CLASS_NAME =
  'data-table__row--selected bg-primary/10 shadow-[inset_0_0_0_1px_rgb(var(--color-primary)/0.3)]';

const HEAD_CELL_BASE_CLASS_NAME = [
  'data-table__cell data-table__cell--head px-4 py-3.5 align-middle text-[11px] font-bold uppercase tracking-[0.12em] max-[640px]:px-4',
  'bg-transparent text-text-muted',
].join(' ');

const BODY_CELL_BASE_CLASS_NAME =
  'data-table__cell px-4 py-3.5 align-middle text-sm text-text-primary first:rounded-l-lg last:rounded-r-lg max-[640px]:px-4';

const ALIGN_CLASS_NAMES: Record<DataTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getRowKey<T>(
  row: T,
  index: number,
  rowKey?: keyof T | ((row: T, index: number) => string),
): string {
  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }

  if (rowKey) {
    const value = row[rowKey];
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : `row-${index}`;
  }

  return `row-${index}`;
}

function getCellContent<T>(row: T, column: DataTableColumn<T>): ReactNode {
  if (column.render) {
    return column.render(row);
  }

  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }

  if (column.accessor) {
    const value = row[column.accessor];
    return value as ReactNode;
  }

  return null;
}

function DataTable<T>({
  data,
  columns,
  rowKey,
  selectedRowKey,
  loading = false,
  emptyTitle,
  emptyDescription,
  onRowClick,
  getRowClassName,
  rowReorder,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const resolvedEmptyTitle = emptyTitle ?? t('shared.table.emptyTitle');
  const resolvedEmptyDescription =
    emptyDescription ?? t('shared.table.emptyDescription');
  const dragFromIndexRef = useRef<number | null>(null);
  const dragOriginIndexRef = useRef<number | null>(null);
  const dragCurrentIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const isRowReorderEnabled = Boolean(rowReorder?.onReorder) && rowReorder?.enabled !== false;
  const isRowReorderDisabled = Boolean(rowReorder?.disabled);
  const reorderAriaLabel = rowReorder?.ariaLabel ?? t('shared.table.reorderRow');
  const [renderOrder, setRenderOrder] = useState<number[] | null>(null);

  const resolvedOrder = useMemo(() => {
    if (!isRowReorderEnabled || isRowReorderDisabled) {
      return null;
    }

    if (renderOrder && renderOrder.length === data.length) {
      return renderOrder;
    }

    return Array.from({ length: data.length }, (_, index) => index);
  }, [data.length, isRowReorderDisabled, isRowReorderEnabled, renderOrder]);

  useEffect(() => {
    if (!isRowReorderEnabled) {
      setRenderOrder(null);
      return;
    }

    setRenderOrder(Array.from({ length: data.length }, (_, index) => index));
  }, [data.length, isRowReorderEnabled]);

  if (loading) {
    return (
      <div className={TABLE_SHELL_CLASS_NAME}>
        <LoadingState
          title={t('shared.table.loadingTitle')}
          description={t('shared.table.loadingDescription')}
        />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={TABLE_SHELL_CLASS_NAME}>
        <EmptyState
          title={resolvedEmptyTitle}
          description={resolvedEmptyDescription}
        />
      </div>
    );
  }

  return (
    <div className={TABLE_SHELL_CLASS_NAME}>
      <table className={TABLE_CLASS_NAME}>
        <thead>
          <tr>
            {isRowReorderEnabled ? (
              <th
                className={[
                  HEAD_CELL_BASE_CLASS_NAME,
                  'w-10 px-3',
                  ALIGN_CLASS_NAMES.left,
                ].join(' ')}
                aria-label={reorderAriaLabel}
              />
            ) : null}
            {columns.map((column) => (
              <th
                key={column.key}
                className={[
                  HEAD_CELL_BASE_CLASS_NAME,
                  `data-table__cell--${column.align ?? 'left'}`,
                  ALIGN_CLASS_NAMES[column.align ?? 'left'],
                ].join(' ')}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(resolvedOrder ?? Array.from({ length: data.length }, (_, index) => index)).map((dataIndex, renderIndex) => {
            const row = data[dataIndex];
            const resolvedRowKey = getRowKey(row, dataIndex, rowKey);
            const isSelected = selectedRowKey === resolvedRowKey;

            return (
              <tr
                key={resolvedRowKey}
                className={[
                  onRowClick ? CLICKABLE_ROW_CLASS_NAME : ROW_CLASS_NAME,
                  getRowClassName ? getRowClassName(row, dataIndex) : '',
                  isSelected ? SELECTED_ROW_CLASS_NAME : '',
                  dragOverIndex === renderIndex ? 'shadow-[inset_0_0_0_1px_rgb(var(--color-primary)/0.35)]' : '',
                  draggingIndex === renderIndex ? 'opacity-55' : '',
                ].join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                aria-selected={isSelected}
                onDragOver={
                  isRowReorderEnabled && !isRowReorderDisabled
                    ? (event) => {
                        if (dragFromIndexRef.current === null) {
                          return;
                        }
                        event.preventDefault();
                        setDragOverIndex(renderIndex);

                        const currentIndex = dragCurrentIndexRef.current;
                        if (currentIndex === null || currentIndex === renderIndex) {
                          return;
                        }

                        setRenderOrder((currentOrder) => {
                          const baseOrder =
                            currentOrder && currentOrder.length === data.length
                              ? [...currentOrder]
                              : Array.from({ length: data.length }, (_, idx) => idx);
                          const [moved] = baseOrder.splice(currentIndex, 1);
                          baseOrder.splice(renderIndex, 0, moved);
                          dragCurrentIndexRef.current = renderIndex;
                          return baseOrder;
                        });
                      }
                    : undefined
                }
                onDragLeave={
                  isRowReorderEnabled && !isRowReorderDisabled
                    ? () => setDragOverIndex((current) => (current === renderIndex ? null : current))
                    : undefined
                }
                onDrop={
                  isRowReorderEnabled && !isRowReorderDisabled
                    ? (event) => {
                        event.preventDefault();
                        const fromIndex = dragOriginIndexRef.current;
                        const toIndex = dragCurrentIndexRef.current;
                        dragFromIndexRef.current = null;
                        dragOriginIndexRef.current = null;
                        dragCurrentIndexRef.current = null;
                        setDragOverIndex(null);
                        if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
                          return;
                        }
                        rowReorder?.onReorder(fromIndex, toIndex);
                      }
                    : undefined
                }
              >
                {isRowReorderEnabled ? (
                  <td className={[BODY_CELL_BASE_CLASS_NAME, 'w-10 px-3'].join(' ')}>
                    <button
                      type="button"
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition duration-fast',
                        'hover:bg-surface-card hover:text-text-secondary',
                        isRowReorderDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing',
                      ].join(' ')}
                      draggable={!isRowReorderDisabled}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onDragStart={(event) => {
                        if (isRowReorderDisabled) {
                          event.preventDefault();
                          return;
                        }
                        dragFromIndexRef.current = renderIndex;
                        dragOriginIndexRef.current = renderIndex;
                        dragCurrentIndexRef.current = renderIndex;
                        setDraggingIndex(renderIndex);
                        setDragOverIndex(null);
                        event.dataTransfer.effectAllowed = 'move';

                        const rowElement = (event.currentTarget as HTMLElement).closest('tr');
                        if (rowElement) {
                          const rect = rowElement.getBoundingClientRect();
                          const offsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
                          const offsetY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

                          const ghost = document.createElement('div');
                          ghost.style.position = 'fixed';
                          ghost.style.top = '-2000px';
                          ghost.style.left = '-2000px';
                          ghost.style.pointerEvents = 'none';
                          ghost.style.width = `${rect.width}px`;
                          ghost.style.opacity = '0.98';
                          ghost.style.filter = 'drop-shadow(0 18px 34px rgba(15,23,42,0.22))';
                          ghost.innerHTML = `<table class="${TABLE_CLASS_NAME}" style="min-width:0;width:100%;border-spacing:0"><tbody>${rowElement.outerHTML}</tbody></table>`;

                          document.body.appendChild(ghost);
                          try {
                            event.dataTransfer.setDragImage(ghost, offsetX, offsetY);
                          } catch {
                            // ignored
                          }
                          window.setTimeout(() => {
                            ghost.remove();
                          }, 0);
                        }

                        try {
                          event.dataTransfer.setData('text/plain', resolvedRowKey);
                        } catch {
                          // ignored
                        }
                      }}
                      onDragEnd={() => {
                        dragFromIndexRef.current = null;
                        dragOriginIndexRef.current = null;
                        dragCurrentIndexRef.current = null;
                        setDragOverIndex(null);
                        setDraggingIndex(null);
                        setRenderOrder(Array.from({ length: data.length }, (_, idx) => idx));
                      }}
                      aria-label={reorderAriaLabel}
                      title={reorderAriaLabel}
                    >
                      <span className="grid grid-cols-2 grid-rows-3 gap-[2px]" aria-hidden="true">
                        {Array.from({ length: 6 }).map((_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className="h-1 w-1 rounded-full bg-current opacity-70"
                          />
                        ))}
                      </span>
                    </button>
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      BODY_CELL_BASE_CLASS_NAME,
                      `data-table__cell--${column.align ?? 'left'}`,
                      ALIGN_CLASS_NAMES[column.align ?? 'left'],
                    ].join(' ')}
                  >
                    {getCellContent(row, column)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
