import Modal from './Modal'
import { btnDanger, btnGhost } from '../../lib/ui'

export default function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} title={title} eyebrow="<confirmar />">
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button
          className={btnDanger}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
