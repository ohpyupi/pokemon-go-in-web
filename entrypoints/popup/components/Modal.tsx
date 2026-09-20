import { type ReactNode, useEffect, useRef } from 'react';
import './Modal.css';

/** A card over a dimmed page, for a task you finish and close. It opens when
 *  it mounts; Esc, a click on the dim area, or onClose ends it. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (!dialog.open) dialog.showModal(); // StrictMode mounts effects twice
    const onDialogClose = (): void => close.current();
    dialog.addEventListener('close', onDialogClose);
    return () => dialog.removeEventListener('close', onDialogClose);
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClick={(event) => {
        if (event.target === ref.current) close.current();
      }}
    >
      <div className="modal-card">
        <p className="modal-title">{title}</p>
        {children}
      </div>
    </dialog>
  );
}
