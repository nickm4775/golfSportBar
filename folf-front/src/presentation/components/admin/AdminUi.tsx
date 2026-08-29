import { useEffect, useId, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ArrowChevronLeft, ArrowChevronRight, Magnifier, Plus, Xmark } from '@gravity-ui/icons'
import { Button, Dropdown, Label } from '@heroui/react'
import type { Selection } from '@heroui/react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl text-[var(--gsb-fg)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--gsb-muted)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

export function StatusBadge({
  label,
  status,
}: {
  label: string
  status?: string
}) {
  const tone =
    status === 'COMPLETED' || status === 'SERVED' || status === 'CONFIRMED' || status === 'ACTIVE'
      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
      : status === 'OPEN' || status === 'PENDING' || status === 'SCHEDULED'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300'
        : status === 'IN_PROGRESS' || status === 'PREPARING' || status === 'CHECKED_IN'
          ? 'border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-300'
          : status === 'CANCELLED' || status === 'NO_SHOW'
            ? 'border-red-500/35 bg-red-500/10 text-red-800 dark:text-red-300'
            : 'border-[var(--gsb-border)] text-[var(--gsb-muted)]'

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tone}`}
    >
      {label}
    </span>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
}) {
  const selected = options.find((option) => option.id === value)

  const handleChange = (keys: Selection) => {
    if (keys === 'all') return
    const next = [...keys][0]
    if (next == null) return
    onChange(String(next))
  }

  return (
    <div className="min-w-44 text-xs text-[var(--gsb-muted)]">
      <p>{label}</p>
      <Dropdown>
        <Button
          className="mt-1 flex h-10 w-full min-w-44 items-center justify-between rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 text-left text-sm font-medium text-[var(--gsb-fg)]"
        >
          {selected?.label ?? value}
        </Button>
        <Dropdown.Popover className="min-w-44">
          <Dropdown.Menu
            selectedKeys={new Set([value])}
            selectionMode="single"
            onSelectionChange={handleChange}
          >
            {options.map((option) => (
              <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel,
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-2 text-xs underline" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[var(--gsb-border)] px-4 py-10 text-center text-sm text-[var(--gsb-muted)]">
      {message}
    </p>
  )
}

const modalCloseStack: Array<() => void> = []
let escapeBound = false

function bindModalEscape() {
  if (escapeBound) return
  escapeBound = true
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    modalCloseStack[modalCloseStack.length - 1]?.()
  })
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const { t } = useTranslation('admin')
  const titleId = useId()

  useEffect(() => {
    bindModalEscape()
    modalCloseStack.push(onClose)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      const index = modalCloseStack.lastIndexOf(onClose)
      if (index >= 0) modalCloseStack.splice(index, 1)
      document.body.style.overflow = modalCloseStack.length > 0 ? 'hidden' : previous
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90dvh] overflow-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-bg)] p-5 shadow-xl ${
          wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl text-[var(--gsb-fg)]">
            {title}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <Xmark className="size-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function IconButton({
  label,
  children,
  onClick,
  tone = 'ghost',
  disabled,
  type = 'button',
}: {
  label: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  tone?: 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-500/40 text-red-600 hover:border-red-500 dark:text-red-300'
      : 'text-[var(--gsb-fg)] hover:border-[var(--gsb-accent)]'

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-full border border-[var(--gsb-border)] disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  )
}

export function PrimaryAction({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" className={primaryButtonClass} onClick={onClick} disabled={disabled}>
      <Plus className="size-4" />
      {label}
    </button>
  )
}

export function ListToolbar({
  search,
  onSearchChange,
  searchLabel,
  children,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchLabel: string
  children?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1 text-xs text-[var(--gsb-muted)]">
        {searchLabel}
        <span className="relative mt-1 block">
          <Magnifier className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gsb-muted)]" />
          <input
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </span>
      </label>
      {children}
    </div>
  )
}

export function PaginationBar({
  page,
  totalPages,
  total,
  pageLabel,
  previousLabel,
  nextLabel,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageLabel: string
  previousLabel: string
  nextLabel: string
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-[var(--gsb-muted)]">{pageLabel}</p>
      {totalPages > 1 ? (
        <div className="flex gap-2">
          <IconButton
            label={previousLabel}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ArrowChevronLeft className="size-4" />
          </IconButton>
          <IconButton
            label={nextLabel}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ArrowChevronRight className="size-4" />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}

export const inputClass =
  'h-10 w-full rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 text-sm text-[var(--gsb-fg)] outline-none ring-[var(--gsb-accent)] focus:ring-2'

export const textareaClass =
  'min-h-24 w-full rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 py-2 text-sm text-[var(--gsb-fg)] outline-none ring-[var(--gsb-accent)] focus:ring-2'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gsb-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--gsb-border)] px-3 py-1.5 text-xs text-[var(--gsb-fg)] hover:border-[var(--gsb-accent)]'

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
