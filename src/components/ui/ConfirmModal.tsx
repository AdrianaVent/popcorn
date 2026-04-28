'use client'

import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import ModalFooter from '@/components/ui/ModalFooter'
import Button from '@/components/ui/Button'

type Props = {
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      title={title}
      onClose={onCancel}
      maxWidth="26rem"
      footer={
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="w-auto px-4"
          >
            {t('button.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            loading={loading}
            className="w-auto px-4 bg-destructive hover:bg-destructive"
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </ModalFooter>
      }
    >
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </Modal>
  )
}
