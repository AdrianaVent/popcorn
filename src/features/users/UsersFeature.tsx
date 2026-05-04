'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import Text from '@/components/ui/Text'
import FiltersPanel from '@/components/common/FiltersPanel'
import TableFooter from '@/components/ui/Table/TableFooter'
import UserFormModal from './UserFormModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { PlusCircleIcon, TrashIcon, PencilIcon } from '@/components/icons'

import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { useToastStore } from '@/store/toastStore'
import { fetchUsers, createUser, updateUser, deleteUser, deleteUsers } from './users.service'
import { formatShortDate } from '@/utils/formatDate'
import { useFilters } from '@/hooks/useFilters'
import { staticUserFiltersSchema, INITIAL_USER_FILTERS } from './userFilters.schema'
import { applyUserFilters } from './applyUserFilters'
import type { PublicUser } from '@/types/user'
import type { UserRole } from '@/db/users'

type ModalState =
  | { mode: 'add' }
  | { mode: 'edit'; user: PublicUser }
  | null

type ConfirmDeleteState =
  | { type: 'one'; userId: string; username: string }
  | { type: 'many'; count: number }
  | null

export default function UsersFeature() {
  const { t } = useTranslation()
  const router = useRouter()
  const { userId: currentUserId, clearUser } = useUserStore()
  const { language } = useLanguageStore()
  const addToast = useToastStore((s) => s.addToast)

  const toastError = (e: unknown) => {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    addToast('error', t(`users.errors.${code}`, { defaultValue: t('users.errors.UNKNOWN_ERROR') }))
  }

  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [page, setPage] = useState(1)
  const { filters, setFilters } = useFilters(INITIAL_USER_FILTERS)

  const PAGE_SIZE = 10

  const usersById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  )

  const filtersSchema = useMemo(() => {
    const creatorIds = new Set(users.map((u) => u.created_by).filter(Boolean))
    const creatorOptions = users
      .filter((u) => creatorIds.has(u.id))
      .map((u) => ({ value: u.id, label: u.username }))

    return staticUserFiltersSchema.map((field) =>
      field.key === 'created_by' ? { ...field, options: creatorOptions } : field
    )
  }, [users])

  const filteredUsers = useMemo(() => applyUserFilters(users, filters), [users, filters])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE)),
    [filteredUsers.length, PAGE_SIZE]
  )

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsers, page, PAGE_SIZE]
  )

  useEffect(() => { setPage(1) }, [filters])

  // Selectable = visible filtered users excluding self
  const selectableUsers = useMemo(
    () => filteredUsers.filter((u) => u.id !== currentUserId),
    [filteredUsers, currentUserId]
  )

  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id))
  const someSelected = selected.size > 0

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await fetchUsers())
    } catch {
      setError(t('users.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadUsers() }, [loadUsers])

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

  const handleCreate = async (data: { username: string; password: string; role: UserRole }) => {
    try {
      await createUser(data)
      await loadUsers()
      addToast('success', t('users.success.created'))
    } catch (e) {
      toastError(e)
      throw e
    }
  }

  const handleUpdate = (user: PublicUser) => async (data: { username: string; password: string; role: UserRole }) => {
    try {
      await updateUser(user.id, {
        username: data.username !== user.username ? data.username : undefined,
        password: data.password || undefined,
        role: data.role !== user.role ? data.role : undefined,
      })
      await loadUsers()
      addToast('success', t('users.success.updated'))
    } catch (e) {
      toastError(e)
      throw e
    }
  }

  const handleDeleteOne = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (user) setConfirmDelete({ type: 'one', userId: id, username: user.username })
  }

  const handleDeleteSelected = () => {
    setConfirmDelete({ type: 'many', count: selected.size })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setDeleteLoading(true)
    try {
      if (confirmDelete.type === 'one') {
        await deleteUser(confirmDelete.userId)
        setSelected((prev) => { const next = new Set(prev); next.delete(confirmDelete.userId); return next })
        addToast('success', t('users.success.deleted'))
      } else {
        const count = selected.size
        await deleteUsers(Array.from(selected))
        setSelected(new Set())
        addToast('success', t('users.success.deletedMany', { count }))
      }
      await loadUsers()
      setConfirmDelete(null)
    } catch (e) {
      toastError(e)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearUser()
    router.push('/login')
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
    <DashboardLayout activeNav="users" onLogout={handleLogout}>
      <div className="h-full flex flex-col gap-4 p-4">

        <Header
          title={t('users.title')}
          end={
            <IconButton
              icon={<PlusCircleIcon size={15} />}
              label={t('users.addUser')}
              onClick={() => setModal({ mode: 'add' })}
            />
          }
        />

        <FiltersPanel
          schema={filtersSchema}
          filters={filters}
          onChange={setFilters}
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
          <div className="h-full overflow-auto">
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
                {loading && (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">{t('users.loading')}</td></tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Text variant="body" className="text-muted-foreground">{error}</Text>
                        <Button onClick={loadUsers} variant="secondary" className="w-auto px-4">{t('common.retry')}</Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && users.length === 0 && (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">{t('users.empty')}</td></tr>
                )}
                {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">{t('users.noResults')}</td></tr>
                )}
                {!loading && !error && paginatedUsers.map((user, i) => {
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
                        {user.created_by
                          ? (usersById.get(user.created_by)?.username ?? '—')
                          : '—'}
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
        </div>
        {totalPages > 1 && (
          <TableFooter
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            onPageChange={setPage}
          />
        )}

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
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal?.mode === 'add' && (
        <UserFormModal
          isSelf={false}
          onClose={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal?.mode === 'edit' && (
        <UserFormModal
          user={modal.user}
          isSelf={modal.user.id === currentUserId}
          onClose={() => setModal(null)}
          onSubmit={handleUpdate(modal.user)}
        />
      )}
    </DashboardLayout>
  )
}
