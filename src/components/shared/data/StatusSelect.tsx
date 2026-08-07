import { useEffect, useMemo, useRef, useState } from 'react';
import AppIcon from '../icons/AppIcon';
import StatusBadge, { type StatusBadgeTone } from './StatusBadge';

export interface StatusSelectOption {
  value: string;
  label: string;
  tone: StatusBadgeTone;
}

interface StatusSelectProps {
  value: string;
  options: StatusSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  /** Horizontal edge the menu aligns to. Defaults to `right`. */
  align?: 'left' | 'right';
}

/**
 * A compact status picker. The trigger and every option render as a colored
 * StatusBadge, so an order's workflow/delivery status stays visually
 * consistent whether it is being displayed or edited.
 */
function StatusSelect({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  align = 'right',
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePlacement() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const expectedMenuHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenAbove(spaceBelow < expectedMenuHeight && spaceAbove > spaceBelow);
    }

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={['relative shrink-0', isOpen ? 'z-[160]' : ''].join(' ')}>
      <button
        type="button"
        className={[
          'inline-flex items-center gap-1.5 rounded-pill p-0.5 pr-1 outline-none transition duration-fast',
          'hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {selectedOption ? (
          <StatusBadge
            tone={selectedOption.tone}
            status={selectedOption.value}
            label={selectedOption.label}
          />
        ) : null}
        <AppIcon
          name="chevron-down"
          className={[
            'h-3.5 w-3.5 shrink-0 text-text-muted transition duration-fast',
            isOpen ? 'rotate-180 text-text-secondary' : '',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className={[
            'absolute z-[170] min-w-[190px] overflow-hidden rounded-xl bg-surface-card p-1.5 shadow-[0_22px_44px_-30px_rgba(25,28,30,0.42)] ring-1 ring-border-soft/30',
            align === 'right' ? 'right-0' : 'left-0',
            openAbove ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
          ].join(' ')}
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto py-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    'flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition duration-fast',
                    isSelected ? 'bg-primary/10' : 'hover:bg-surface-subtle',
                  ].join(' ')}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <StatusBadge tone={option.tone} status={option.value} label={option.label} />
                  {isSelected ? (
                    <AppIcon
                      name="check-circle"
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StatusSelect;
