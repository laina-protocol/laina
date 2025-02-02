import type { PropsWithChildren } from 'react';

interface DialogProps {
  modalId: string;
  onClose: VoidFunction;
  className?: string;
}

const Dialog = ({ modalId, onClose, children, className = '' }: PropsWithChildren<DialogProps>) => (
  <dialog id={modalId} className="modal">
    <div className={`modal-box p-10 flex flex-col w-auto max-w-screen-2xl ${className}`}>{children}</div>
    {/* Invisible backdrop that closes the modal on click */}
    <form method="dialog" className="modal-backdrop">
      <button onClick={onClose} type="button">
        close
      </button>
    </form>
  </dialog>
);

export default Dialog;
