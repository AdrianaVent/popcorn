'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Modal from '@/components/ui/Modal'
import AvatarDisplay from '@/components/ui/AvatarDisplay'
import PasswordChangeSection from '@/components/ui/PasswordChangeSection'
import { PencilIcon } from '@/components/icons'
import { useUserStore } from '@/store/userStore'
import ColorSwatchGrid from '@/components/ui/ColorSwatchGrid'
import {
  DEFAULT_AVATAR, parseAvatar, serializeAvatar,
  SKIN_COLORS, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS, GLASSES_STYLES, GLASSES_COLORS, MOUTH_STYLES,
  type AvatarOptions, type AvatarHair, type AvatarGlasses, type AvatarMouth,
} from '@/config/avatars'

type Props = { onClose: () => void }
type Status = 'success' | 'error' | null

const STATUS_TTL = 3000

export default function ProfileModal({ onClose }: Props) {
  const { t } = useTranslation()
  const userId      = useUserStore((s) => s.userId) ?? ''
  const role        = useUserStore((s) => s.role)
  const storeAvatar = useUserStore((s) => s.avatar)
  const setAvatar   = useUserStore((s) => s.setAvatar)

  const [draft, setDraft]                 = useState<AvatarOptions>(() => parseAvatar(serializeAvatar({ ...DEFAULT_AVATAR, ...storeAvatar })))
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [savingAvatar, setSavingAvatar]   = useState(false)
  const [avatarStatus, setAvatarStatus]   = useState<Status>(null)

  const avatarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashAvatarStatus = (value: Status) => {
    if (avatarTimer.current) clearTimeout(avatarTimer.current)
    setAvatarStatus(value)
    avatarTimer.current = setTimeout(() => setAvatarStatus(null), STATUS_TTL)
  }

  const labelCls   = 'text-[11px] text-muted-foreground hc:text-foreground'
  const hairBtnCls = (active: boolean) =>
    clsx(
      'flex flex-col items-center gap-1 cursor-pointer rounded-lg p-1 border transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary',
      active
        ? 'border-primary bg-primary/10 hc:bg-primary hc:border-primary hc:text-primary-foreground'
        : 'border-border hc:border-foreground hover:bg-muted hc:text-foreground'
    )

  /* ─── Avatar ─── */
  const handleSaveAvatar = async () => {
    setSavingAvatar(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: draft }),
      })
      if (res.ok) {
        setAvatar(draft)
        setEditingAvatar(false)
      } else {
        flashAvatarStatus('error')
      }
    } catch {
      flashAvatarStatus('error')
    }
    setSavingAvatar(false)
  }

  return (
    <Modal title={t('profile.title')} onClose={onClose} maxWidth='36rem'>
      <div className="flex flex-col gap-6">

        {/* ── Avatar section — guest only ── */}
        {role === 'guest' && <section aria-label={t('profile.avatar.title')} className={clsx('flex flex-col', editingAvatar ? 'gap-2' : 'gap-4')}>

          {/* Preview + pencil */}
          <div className="flex justify-center">
            <div className="relative inline-block">
              <AvatarDisplay opts={draft} seed={userId} size={110} />
              <button
                data-cy="avatar-edit-btn"
                aria-label={t('profile.avatar.edit')}
                aria-pressed={editingAvatar}
                aria-expanded={editingAvatar}
                onClick={() => {
                  if (editingAvatar) setDraft({ ...storeAvatar })
                  setEditingAvatar((v) => !v)
                }}
                className={clsx(
                  'absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  editingAvatar
                    ? 'bg-primary-foreground text-primary border border-primary'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                )}
              >
                <PencilIcon size={13} />
              </button>
            </div>
          </div>

          {/* Customization — shown only when editing */}
          {editingAvatar && (
            <>
              {/* Row 1 — Hair style + Expression */}
              <div className="grid grid-cols-2 gap-x-3">
                <div role="group" aria-label={t('profile.avatar.hair.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.hair.label')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.value}
                        aria-label={t(h.labelKey)}
                        aria-pressed={draft.hair === h.value}
                        onClick={() => setDraft((d) => ({ ...d, hair: h.value as AvatarHair }))}
                        className={hairBtnCls(draft.hair === h.value)}
                      >
                        <AvatarDisplay opts={{ ...draft, hair: h.value as AvatarHair }} seed={userId} size={22} />
                        <span className="text-[9px] leading-tight text-center">{t(h.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div role="group" aria-label={t('profile.avatar.mouth.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.mouth.label')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {MOUTH_STYLES.map((m) => (
                      <button
                        key={m.value}
                        aria-label={t(m.labelKey)}
                        aria-pressed={draft.mouth === m.value}
                        onClick={() => setDraft((d) => ({ ...d, mouth: m.value as AvatarMouth }))}
                        className={hairBtnCls(draft.mouth === m.value)}
                      >
                        <AvatarDisplay opts={{ ...draft, mouth: m.value as AvatarMouth }} seed={userId} size={22} />
                        <span className="text-[9px] leading-tight text-center">{t(m.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2 — Glasses style + Glasses color */}
              <div className="grid grid-cols-2 gap-x-3">
                <div role="group" aria-label={t('profile.avatar.glasses.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.glasses.label')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {GLASSES_STYLES.map((g) => (
                      <button
                        key={g.value ?? 'none'}
                        aria-label={t(g.labelKey)}
                        aria-pressed={draft.glasses === g.value}
                        onClick={() => setDraft((d) => ({ ...d, glasses: g.value as AvatarGlasses | null }))}
                        className={hairBtnCls(draft.glasses === g.value)}
                      >
                        <AvatarDisplay opts={{ ...draft, glasses: g.value as AvatarGlasses | null }} seed={userId} size={22} />
                        <span className="text-[9px] leading-tight text-center">{t(g.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {draft.glasses && (
                  <div role="group" aria-label={t('profile.avatar.glassesColor.label')} className="flex flex-col gap-0.5">
                    <span className={labelCls} aria-hidden="true">{t('profile.avatar.glassesColor.label')}</span>
                    <ColorSwatchGrid colors={GLASSES_COLORS} selected={draft.glassesColor} onSelect={(v) => setDraft((d) => ({ ...d, glassesColor: v }))} cols={6} />
                  </div>
                )}
              </div>

              {/* Row 3 — Skin tone + Hair color + Shirt color */}
              <div className="grid grid-cols-3 gap-x-3">
                <div role="group" aria-label={t('profile.avatar.skin.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.skin.label')}</span>
                  <ColorSwatchGrid colors={SKIN_COLORS} selected={draft.skinColor} onSelect={(v) => setDraft((d) => ({ ...d, skinColor: v }))} cols={4} />
                </div>
                <div role="group" aria-label={t('profile.avatar.hairColor.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.hairColor.label')}</span>
                  <ColorSwatchGrid colors={HAIR_COLORS} selected={draft.hairColor} onSelect={(v) => setDraft((d) => ({ ...d, hairColor: v }))} cols={4} />
                </div>
                <div role="group" aria-label={t('profile.avatar.shirt.label')} className="flex flex-col gap-0.5">
                  <span className={labelCls} aria-hidden="true">{t('profile.avatar.shirt.label')}</span>
                  <ColorSwatchGrid colors={SHIRT_COLORS} selected={draft.shirtColor} onSelect={(v) => setDraft((d) => ({ ...d, shirtColor: v }))} cols={4} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {avatarStatus === 'error' && (
                  <span role="alert" className="text-[11px] text-destructive">{t('profile.avatar.error')}</span>
                )}
                <button
                  data-cy="avatar-save-btn"
                  aria-label={t('profile.avatar.save')}
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  className="px-4 py-2 text-small rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {savingAvatar ? t('profile.saving') : t('profile.avatar.save')}
                </button>
              </div>
            </>
          )}
        </section>}

        {/* ── Password section ── */}
        <PasswordChangeSection />

      </div>
    </Modal>
  )
}
