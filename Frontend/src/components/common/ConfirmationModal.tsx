import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/**
 * A yes/no confirmation. Same props as before; rebuilt on `Modal` and `Button`
 * (Figma phase 2, 2026-10-05) because the hand-rolled version was not a dialog
 * at all to assistive tech: no role, no accessible name, Escape did nothing,
 * focus stayed on the page behind it, and its close "X" was an unlabelled
 * button. Its warning confirm button was also white on yellow-600 — about
 * 2.9:1, under AA.
 *
 * `danger` confirms with the danger button; `warning` and `info` with primary.
 * Escape, the backdrop and the close button all mean Cancel.
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

const ICON: Record<NonNullable<ConfirmationModalProps['type']>, React.ReactNode> = {
  danger:  <AlertTriangle className="h-5 w-5 text-danger-700" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-700" aria-hidden="true" />,
  info:    <Info className="h-5 w-5 text-brand-600" aria-hidden="true" />,
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{ICON[type]}</span>
      <p className="text-sm leading-[22px] text-ink">{message}</p>
    </div>
  </Modal>
);

export default ConfirmationModal;
