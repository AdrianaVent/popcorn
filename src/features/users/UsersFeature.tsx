'use client'

import { useState, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import Text from '@/components/ui/Text'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import TableFooter from '@/components/ui/Table/TableFooter'
import UserFormModal from './UserFormModal'
import ImportUsersModal from './ImportUsersModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { PlusCircleIcon, TrashIcon, PencilIcon, UploadIcon } from '@/components/icons'

import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { useToastStore } from '@/store/toastStore'
import { fetchUsers, createUser, updateUser, deleteUser, deleteUsers, type CreateUserInput, type UpdateUserInput, type UsersPage } from './users.service'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { formatShortDate } from '@/utils/formatDate'
import { useFilters } from '@/hooks/useFilters'
import { staticUserFiltersSchema, INITIAL_USER_FILTERS, type UserFilters } from './userFilters.schema'
import type { PublicUser } from '@/types/user'
import type { UserRole } from '@/db/users'

type ModalState =
  | { mode: 'add' }
  | { mode: 'edit'; user: PublicUser }
  | { mode: 'import' }
  | null

type ConfirmDeleteState =
  | { type: 'one'; userId: string; username: string }
  | { type: 'many'; count: number }
  | null

export default function UsersFeature() {
  const { t } = useTranslation()
  const { userId: currentUserId } = useUserStore()
  const { language } = useLanguageStore()
  const addToast = useToastStore((s) => s.addToast)

  const toastError = (e: unknown) => {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    addToast('error', t(`users.errors.${code}`, { defaultValue: t('users.errors.UNKNOWN_ERROR') }))
  }

  const pendingToast = useRef<(() => void) | null>(null)

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const { filters, setFilters } = useFilters(INITIAL_USER_FILTERS)

  const handleSetFilters = (newFilters: UserFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery<UsersPage>({
    queryKey: ['users', page, filters],
    queryFn: () => fetchUsers(page, filters),
  })

  const users = useMemo(() => data?.users ?? [], [data])
  const totalPages = data?.totalPages ?? 1
  const error = isError ? t('users.error') : null
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null)
  const [isExporting, setIsExporting] = useState(false)

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      invalidateUsers()
      pendingToast.current = () => addToast('success', t('users.success.created'))
    },
    onError: (e: Error) => { if (e.message !== 'USERNAME_TAKEN') toastError(e) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateUserInput }) => updateUser(id, patch),
    onSuccess: () => {
      invalidateUsers()
      pendingToast.current = () => addToast('success', t('users.success.updated'))
    },
    onError: (e: Error) => { if (e.message !== 'USERNAME_TAKEN') toastError(e) },
  })

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_, id) => {
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
      invalidateUsers()
      setConfirmDelete(null)
      addToast('success', t('users.success.deleted'))
    },
    onError: (e) => toastError(e),
  })

  const deleteManyMutation = useMutation({
    mutationFn: (ids: string[]) => deleteUsers(ids),
    onSuccess: (_, ids) => {
      setSelected(new Set())
      invalidateUsers()
      setConfirmDelete(null)
      addToast('success', t('users.success.deletedMany', { count: ids.length }))
    },
    onError: (e) => toastError(e),
  })

  const closeModal = () => {
    setModal(null)
    pendingToast.current?.()
    pendingToast.current = null
  }

  const creatorsById = useMemo(
    () => new Map((data?.creators ?? []).map((c) => [c.id, c.username])),
    [data?.creators]
  )

  const filtersSchema = useMemo(() => {
    const creatorOptions = (data?.creators ?? []).map((c) => ({ value: c.id, label: c.username }))
    return staticUserFiltersSchema.map((field) =>
      field.key === 'created_by' ? { ...field, options: creatorOptions } : field
    )
  }, [data?.creators])

  // Selectable = visible page users excluding self
  const selectableUsers = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId]
  )

  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id))
  const someSelected = selected.size > 0


  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableUsers.map((u) => u.id)))
  }

  const handleCreate = (data: CreateUserInput) => createMutation.mutateAsync(data)

  const handleUpdate = (user: PublicUser) => (data: CreateUserInput) =>
    updateMutation.mutateAsync({
      id: user.id,
      patch: {
        username: data.username !== user.username ? data.username : undefined,
        password: data.password || undefined,
        role: data.role !== user.role ? data.role : undefined,
      },
    })

  const handleDeleteOne = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (user) setConfirmDelete({ type: 'one', userId: id, username: user.username })
  }

  const handleDeleteSelected = () => {
    setConfirmDelete({ type: 'many', count: selected.size })
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'one') {
      deleteOneMutation.mutate(confirmDelete.userId)
    } else {
      deleteManyMutation.mutate(Array.from(selected))
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const allData = await fetchUsers(1, {}, 9999)
      const allCreators = new Map(allData.creators.map((c) => [c.id, c.username]))
      const date = new Date().toISOString().split('T')[0]
      if (format === 'json') {
        const rows = allData.users.map((u) => ({
          username: u.username,
          role: u.role,
          created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
          created_by: u.created_by ? (allCreators.get(u.created_by) ?? u.created_by) : null,
        }))
        exportAsJSON(rows, `users-${date}.json`)
      } else {
        const rows = allData.users.map((u) => ({
          username: u.username,
          role: u.role,
          created_at: u.created_at ? formatShortDate(new Date(u.created_at).toISOString(), language) : '',
          created_by: u.created_by ? (allCreators.get(u.created_by) ?? '') : '',
        }))
        exportAsCSV(rows, ['username', 'role', 'created_at', 'created_by'], `users-${date}.csv`, [
          t('users.columns.username'),
          t('users.columns.role'),
          t('users.columns.createdAt'),
          t('users.columns.createdBy'),
        ])
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }

  const roleBadge = (role: UserRole) => (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
      role === 'admin'
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground'
    )}>
      {t(`users.roles.${role}`)}
    </span>
  )

  return (
    <>
    <div className="h-full flex flex-col gap-4 p-4">

        <Header
          title={t('users.title')}
          end={
            <div className="flex items-center gap-2">
              <ExportButton onExport={handleExport} disabled={isLoading} />
              <button
                onClick={() => setModal({ mode: 'import' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/60 transition-colors"
              >
                <UploadIcon size={15} />
                <span className="hidden md:inline">{t('users.import.button')}</span>
              </button>
              <IconButton
                icon={<PlusCircleIcon size={15} />}
                label={t('users.addUser')}
                onClick={() => setModal({ mode: 'add' })}
              />
            </div>
          }
        />

        <FiltersPanel
          schema={filtersSchema}
          filters={filters}
          onChange={handleSetFilters}
          titleKey="users.filters.panel"
        />

        {someSelected && (
          <button
            onClick={handleDeleteSelected}
            className="group self-start flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-destructive border border-destructive/40 hover:bg-destructive hover:text-white transition-colors shrink-0"
          >
            <TrashIcon size={12} />
            {t('users.deleteSelected')}
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold transition-colors group-hover:bg-white/20 group-hover:text-white">
              {selected.size}
            </span>
          </button>
        )}

        {/* Table */}
        <div className="flex-1 min-h-0 relative border border-border rounded-lg overflow-hidden">
          <div className="h-full overflow-auto pb-14">
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-background border-y border-border/60">
                  <th className="w-10 px-2 py-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                      onChange={toggleAll}
                      className="accent-primary cursor-pointer"
                    />
                  </th>
                  {(['username', 'role', 'createdAt', 'createdBy'] as const).map((col) => (
                    <th key={col} className="px-2 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                      {t(`users.columns.${col}`)}
                    </th>
                  ))}
                  <th className="w-20 px-2 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                    {t('users.columns.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading && Array.from({ length: 9 }).map((_, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-cream-100 dark:bg-gray-900' : 'bg-cream-300 dark:bg-gray-800'}>
                    <td className="px-2 py-3"><div className="w-4 h-4 rounded bg-border animate-pulse mx-auto" /></td>
                    {(['w-1/3', 'w-16', 'w-24', 'w-24', 'w-12'] as const).map((w, j) => (
                      <td key={j} className="px-2 py-3"><div className={`h-3 rounded bg-border animate-pulse ${w}`} /></td>
                    ))}
                  </tr>
                ))}
                {error && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Text variant="body" className="text-muted-foreground">{error}</Text>
                        <Button onClick={invalidateUsers} variant="secondary" className="w-auto px-4">{t('common.retry')}</Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && !error && data?.totalResults === 0 && !Object.values(filters).some(Boolean) && (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">{t('users.empty')}</td></tr>
                )}
                {!isLoading && !error && data?.totalResults === 0 && Object.values(filters).some(Boolean) && (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">{t('users.noResults')}</td></tr>
                )}
                {!isLoading && !error && users.map((user, i) => {
                  const isSelf = user.id === currentUserId
                  const isSelected = selected.has(user.id)

                  return (
                    <tr
                      key={user.id}
                      className={clsx(
                        'border-b border-border transition-colors',
                        i % 2 === 0 ? 'bg-cream-100 dark:bg-gray-900' : 'bg-cream-300 dark:bg-gray-800',
                        'hover:bg-cream-400 dark:hover:bg-gray-700/60',
                      )}
                    >
                      <td className="px-2 py-2 text-center">
                        {!isSelf && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(user.id)}
                            className="accent-primary cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 text-foreground font-medium">
                        {user.username}
                        {isSelf && <span className="ml-2 text-[10px] text-muted-foreground">({t('users.self')})</span>}
                      </td>
                      <td className="px-2 py-2">{roleBadge(user.role)}</td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {user.created_at ? formatShortDate(new Date(user.created_at).toISOString(), language) : '—'}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {user.created_by ? (creatorsById.get(user.created_by) ?? '—') : '—'}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            data-cy="edit-user-btn"
                            icon={<PencilIcon size={14} />}
                            label={t('users.actions.edit')}
                            variant="ghost"
                            tooltipSide="top"
                            onClick={() => setModal({ mode: 'edit', user })}
                            className="hover:text-blue-500 hover:bg-blue-500/10"
                          />
                          {!isSelf && (
                            <IconButton
                              data-cy="delete-user-btn"
                              icon={<TrashIcon size={14} />}
                              label={t('users.actions.delete')}
                              variant="ghost"
                              tooltipSide="top"
                              onClick={() => handleDeleteOne(user.id)}
                              className="hover:text-destructive hover:bg-destructive/8"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-3 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="h-5 w-16 rounded bg-border animate-pulse" />
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-7 w-7 rounded-md bg-border animate-pulse" />
                  ))}
                </div>
                <div className="h-5 w-16 rounded bg-border animate-pulse" />
              </div>
            ) : (
              <TableFooter
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                onPageChange={setPage}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

      </div>

      {confirmDelete && (
        <ConfirmModal
          title={t(confirmDelete.type === 'one' ? 'users.confirm.titleOne' : 'users.confirm.titleMany')}
          description={
            confirmDelete.type === 'one'
              ? t('users.confirm.bodyOne', { username: confirmDelete.username })
              : t('users.confirm.bodyMany', { count: confirmDelete.count })
          }
          confirmLabel={t('users.actions.delete')}
          loading={deleteOneMutation.isPending || deleteManyMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal?.mode === 'add' && (
        <UserFormModal
          isSelf={false}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}
      {modal?.mode === 'edit' && (
        <UserFormModal
          user={modal.user}
          isSelf={modal.user.id === currentUserId}
          onClose={closeModal}
          onSubmit={handleUpdate(modal.user)}
        />
      )}
      {modal?.mode === 'import' && (
        <ImportUsersModal
          onClose={() => setModal(null)}
          onDone={invalidateUsers}
        />
      )}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </>
  )
}
