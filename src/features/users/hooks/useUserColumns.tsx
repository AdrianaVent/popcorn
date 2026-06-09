import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import IconButton from '@/components/ui/IconButton'
import { PencilIcon, TrashIcon } from '@/components/icons'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { formatShortDate } from '@/utils/formatDate'
import type { Column } from '@/types/table'
import type { PublicUser } from '@/types/user'

type UserRow = PublicUser & { _checkbox: null; _actions: null }

type Params = {
  selected: Set<string>
  allSelected: boolean
  someSelected: boolean
  creatorsById: Map<string, string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  onEdit: (user: PublicUser) => void
  onDelete: (id: string) => void
}

export function useUserColumns({ selected, allSelected, someSelected, creatorsById, onToggle, onToggleAll, onEdit, onDelete }: Params): Column<UserRow>[] {
  const { t }        = useTranslation()
  const { language } = useLanguageStore()
  const { userId: currentUserId } = useUserStore()

  return useMemo<Column<UserRow>[]>(() => [
    {
      key: '_checkbox',
      header: '',
      headerNode: (
        <input
          type="checkbox"
          aria-label={t('users.columns.username')}
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
          onChange={onToggleAll}
          className="accent-primary cursor-pointer"
        />
      ),
      className: 'w-10',
      align: 'center',
      render: (row) => row.id === currentUserId ? null : (
        <input
          type="checkbox"
          aria-label={row.username}
          checked={selected.has(row.id)}
          onChange={() => onToggle(row.id)}
          className="accent-primary cursor-pointer"
        />
      ),
    },
    {
      key: 'username',
      header: t('users.columns.username'),
      width: 'flex',
      align: 'left',
      render: (row) => (
        <span className="font-medium text-foreground">
          {row.username}
          {row.id === currentUserId && (
            <span className="ml-2 text-[10px] text-muted-foreground">({t('users.self')})</span>
          )}
        </span>
      ),
    },
    {
      key: 'role',
      header: t('users.columns.role'),
      width: 'sm',
      align: 'center',
      render: (row) => (
        <span className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
          row.role === 'admin'
            ? 'bg-primary/10 text-primary hc:bg-primary hc:text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}>
          {t(`users.roles.${row.role}`)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('users.columns.createdAt'),
      width: 'md',
      align: 'center',
      render: (row) => (
        <span className="text-muted-foreground">
          {row.created_at ? formatShortDate(new Date(row.created_at).toISOString(), language) : '—'}
        </span>
      ),
    },
    {
      key: 'created_by',
      header: t('users.columns.createdBy'),
      width: 'md',
      align: 'center',
      render: (row) => (
        <span className="text-muted-foreground">
          {row.created_by ? (creatorsById.get(row.created_by) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: '_actions',
      header: t('users.columns.actions'),
      width: 'sm',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            data-cy="edit-user-btn"
            icon={<PencilIcon size={14} />}
            label={t('users.actions.edit')}
            variant="ghost"
            tooltipSide="top"
            onClick={() => onEdit(row)}
            className="hover:text-blue-500 hover:bg-blue-500/10"
          />
          {row.id !== currentUserId && (
            <IconButton
              data-cy="delete-user-btn"
              icon={<TrashIcon size={14} />}
              label={t('users.actions.delete')}
              variant="ghost"
              tooltipSide="top"
              onClick={() => onDelete(row.id)}
              className="hover:text-destructive hover:bg-destructive/8"
            />
          )}
        </div>
      ),
    },
  ], [t, language, currentUserId, allSelected, someSelected, selected, creatorsById, onToggle, onToggleAll, onEdit, onDelete])
}
