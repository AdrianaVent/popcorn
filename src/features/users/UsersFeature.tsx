'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import Table from '@/components/ui/Table/Table'
import IconButton from '@/components/ui/IconButton'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import UserFormModal from './UserFormModal'
import ImportUsersModal from './ImportUsersModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PageLayout from '@/components/layouts/PageLayout'
import { PlusCircleIcon, TrashIcon, UploadIcon, UsersIcon } from '@/components/icons'

import { useUserStore } from '@/store/userStore'
import { useFilters } from '@/hooks/useFilters'
import { fetchUsers, createUser, updateUser, deleteUser, deleteUsers, type UpdateUserInput, type UsersPage } from './users.service'
import { useUserColumns } from './hooks/useUserColumns'
import { useUserExport } from './hooks/useUserExport'
import { useToastStore } from '@/store/toastStore'
import { staticUserFiltersSchema, INITIAL_USER_FILTERS, type UserFilters } from './userFilters.schema'
import type { PublicUser } from '@/types/user'

type UserRow = PublicUser & { _checkbox: null; _actions: null }

type ModalState = { mode: 'add' } | { mode: 'edit'; user: PublicUser } | { mode: 'import' } | null
type ConfirmDeleteState = { type: 'one'; userId: string; username: string } | { type: 'many'; count: number } | null

export default function UsersFeature() {
  const { t } = useTranslation()
  const { userId: currentUserId } = useUserStore()
  const addToast = useToastStore((s) => s.addToast)

  const toastError = (e: unknown) => {
    const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    addToast('error', t(`users.errors.${code}`, { defaultValue: t('users.errors.UNKNOWN_ERROR') }))
  }

  const pendingToast = useRef<(() => void) | null>(null)
  const queryClient  = useQueryClient()
  const [page, setPage]           = useState(1)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [modal, setModal]         = useState<ModalState>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null)

  const { filters, setFilters } = useFilters(INITIAL_USER_FILTERS)
  const handleSetFilters = (f: UserFilters) => { setFilters(f); setPage(1) }

  const { data, isLoading, isError } = useQuery<UsersPage>({
    queryKey: ['users', page, filters],
    queryFn: () => fetchUsers(page, filters),
  })

  const users      = useMemo(() => data?.users ?? [], [data])
  const totalPages = data?.totalPages ?? 1
  const error      = isError ? t('users.error') : null
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { invalidateUsers(); pendingToast.current = () => addToast('success', t('users.success.created')) },
    onError: (e: Error) => { if (e.message !== 'USERNAME_TAKEN') toastError(e) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateUserInput }) => updateUser(id, patch),
    onSuccess: () => { invalidateUsers(); pendingToast.current = () => addToast('success', t('users.success.updated')) },
    onError: (e: Error) => { if (e.message !== 'USERNAME_TAKEN') toastError(e) },
  })

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_, id) => {
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
      invalidateUsers(); setConfirmDelete(null)
      addToast('success', t('users.success.deleted'))
    },
    onError: (e) => toastError(e),
  })

  const deleteManyMutation = useMutation({
    mutationFn: (ids: string[]) => deleteUsers(ids),
    onSuccess: (_, ids) => {
      setSelected(new Set()); invalidateUsers(); setConfirmDelete(null)
      addToast('success', t('users.success.deletedMany', { count: ids.length }))
    },
    onError: (e) => toastError(e),
  })

  const closeModal = () => { setModal(null); pendingToast.current?.(); pendingToast.current = null }

  const creatorsById = useMemo(() => new Map((data?.creators ?? []).map((c) => [c.id, c.username])), [data?.creators])

  const filtersSchema = useMemo(() => {
    const creatorOptions = (data?.creators ?? []).map((c) => ({ value: c.id, label: c.username }))
    return staticUserFiltersSchema.map((f) => f.key === 'created_by' ? { ...f, options: creatorOptions } : f)
  }, [data?.creators])

  const selectableUsers = useMemo(() => users.filter((u) => u.id !== currentUserId), [users, currentUserId])
  const allSelected  = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id))
  const someSelected = selected.size > 0

  const onToggle    = useCallback((id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }), [])
  const onToggleAll = useCallback(() => setSelected(allSelected ? new Set() : new Set(selectableUsers.map((u) => u.id))), [allSelected, selectableUsers])
  const onEdit      = useCallback((user: PublicUser) => setModal({ mode: 'edit', user }), [])
  const onDelete    = useCallback((id: string) => {
    const user = users.find((u) => u.id === id)
    if (user) setConfirmDelete({ type: 'one', userId: id, username: user.username })
  }, [users])

  const columns  = useUserColumns({ selected, allSelected, someSelected, creatorsById, onToggle, onToggleAll, onEdit, onDelete })
  const { isExporting, handleExport } = useUserExport()

  const userRows = useMemo(() => users.map((u): UserRow => ({ ...u, _checkbox: null, _actions: null })), [users])

  const emptyMessage = data?.totalResults === 0
    ? (Object.values(filters).some(Boolean) ? t('users.noResults') : t('users.empty'))
    : t('users.empty')

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'one') deleteOneMutation.mutate(confirmDelete.userId)
    else deleteManyMutation.mutate(Array.from(selected))
  }

  return (
    <>
      <PageLayout
        title={t('users.title')}
        start={<span aria-hidden="true"><UsersIcon size={32} strokeWidth={1.5} /></span>}
        end={
          <div className="flex items-center gap-2">
            <ExportButton onExport={handleExport} disabled={isLoading || isExporting} />
            <button
              aria-label={t('users.import.button')}
              onClick={() => setModal({ mode: 'import' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/60 hc:hover:bg-muted transition-colors"
            >
              <span aria-hidden="true"><UploadIcon size={15} /></span>
              <span className="hidden md:inline" aria-hidden="true">{t('users.import.button')}</span>
            </button>
            <IconButton icon={<PlusCircleIcon size={15} />} label={t('users.addUser')} onClick={() => setModal({ mode: 'add' })} />
          </div>
        }
      >
        <FiltersPanel schema={filtersSchema} filters={filters} onChange={handleSetFilters} titleKey="users.filters.panel" />

        {someSelected && (
          <button
            onClick={() => setConfirmDelete({ type: 'many', count: selected.size })}
            className="group self-start flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-destructive border border-destructive/40 hover:bg-destructive hover:text-white transition-colors shrink-0"
          >
            <span aria-hidden="true"><TrashIcon size={12} /></span>
            {t('users.deleteSelected')}
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold transition-colors group-hover:bg-white/20 group-hover:text-white">
              {selected.size}
            </span>
          </button>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <Table<UserRow>
            scrollKey={`${page}-${JSON.stringify(filters)}`}
            loading={isLoading}
            error={error ?? undefined}
            onRetry={invalidateUsers}
            emptyMessage={emptyMessage}
            data={userRows}
            columns={columns}
            getRowKey={(row) => row.id}
            footer={{ page, totalPages, onPrev: () => setPage((p) => Math.max(1, p - 1)), onNext: () => setPage((p) => Math.min(totalPages, p + 1)), onPageChange: setPage, disabled: isLoading }}
          />
        </div>
      </PageLayout>

      {confirmDelete && (
        <ConfirmModal
          title={t(confirmDelete.type === 'one' ? 'users.confirm.titleOne' : 'users.confirm.titleMany')}
          description={confirmDelete.type === 'one' ? t('users.confirm.bodyOne', { username: confirmDelete.username }) : t('users.confirm.bodyMany', { count: confirmDelete.count })}
          confirmLabel={t('users.actions.delete')}
          loading={deleteOneMutation.isPending || deleteManyMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal?.mode === 'add'    && <UserFormModal isSelf={false} onClose={closeModal} onSubmit={(d) => createMutation.mutateAsync(d)} />}
      {modal?.mode === 'edit'   && <UserFormModal user={modal.user} isSelf={modal.user.id === currentUserId} onClose={closeModal} onSubmit={(d) => updateMutation.mutateAsync({ id: modal.user.id, patch: { username: d.username !== modal.user.username ? d.username : undefined, password: d.password || undefined, role: d.role !== modal.user.role ? d.role : undefined } })} />}
      {modal?.mode === 'import' && <ImportUsersModal onClose={() => setModal(null)} onDone={invalidateUsers} />}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </>
  )
}
