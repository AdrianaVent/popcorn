'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, XIcon } from '@/components/icons'
import PasswordFields from '@/components/ui/PasswordFields'

type Status = 'success' | 'error' | null
type Field = 'current' | 'next' | 'confirm'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const STATUS_TTL = 3000

export default function PasswordChangeSection() {
  const { t } = useTranslation()
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [show, setShow]     = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = (value: Status) => {
    if (timer.current) clearTimeout(timer.current)
    setStatus(value)
    timer.current = setTimeout(() => setStatus(null), STATUS_TTL)
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.current) e.current = t('profile.password.currentRequired')
    if (!form.next) {
      e.next = t('profile.password.newRequired')
    } else if (!PASSWORD_REGEX.test(form.next)) {
      e.next = t('profile.password.weak')
    }
    if (form.next && form.confirm !== form.next) e.confirm = t('profile.password.mismatch')
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      })
      const data = await res.json() as { code: string }
      if (res.ok) {
        setForm({ current: '', next: '', confirm: '' })
        setShow({ current: false, next: false, confirm: false })
        flash('success')
      } else if (data.code === 'WRONG_PASSWORD') {
        setErrors({ current: t('profile.password.wrongCurrent') })
      } else {
        flash('error')
      }
    } catch {
      flash('error')
    }
    setSaving(false)
  }

  return (
    <section aria-label={t('profile.password.title')} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hc:text-foreground">
            {t('profile.password.title')}
          </p>
          <div className="flex-1 border-t border-border" />
        </div>
        {status === 'success' && (
          <div role="alert" className="rounded-md bg-green-500/10 hc:bg-transparent hc:border hc:border-green-500 px-3 py-2 flex items-center justify-center gap-1.5">
            <span aria-hidden="true" className="text-green-700 dark:text-green-400 hc:text-green-500 shrink-0 flex items-center"><CheckIcon size={13} /></span>
            <p className="text-caption text-green-700 dark:text-green-400 hc:text-green-500 font-medium">{t('profile.password.changed')}</p>
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="rounded-md bg-destructive/10 hc:bg-transparent hc:border hc:border-destructive px-3 py-2 flex items-center justify-center gap-1.5">
            <span aria-hidden="true" className="text-destructive shrink-0 flex items-center"><XIcon size={13} /></span>
            <p className="text-caption text-destructive font-medium">{t('profile.password.error')}</p>
          </div>
        )}
      </div>

      <PasswordFields
        values={form}
        errors={errors}
        show={show}
        onChange={(field, value) => {
          setForm((p) => ({ ...p, [field]: value }))
          setErrors((p) => ({ ...p, [field]: undefined }))
        }}
        onToggleShow={(field) => setShow((p) => ({ ...p, [field]: !p[field] }))}
      />

      <p id="pw-hint" className="text-[11px] text-muted-foreground hc:text-foreground">
        {t('profile.password.hint')}
      </p>

      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-small rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          {saving ? t('profile.saving') : t('profile.password.save')}
        </button>
      </div>
    </section>
  )
}
