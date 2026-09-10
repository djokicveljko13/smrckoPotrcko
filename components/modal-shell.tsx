"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalShellProps = {
  titleId: string;
  descriptionId?: string;
  locked: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * Zajednička mehanika native &lt;dialog&gt;: showModal, Escape, klik na pozadinu,
 * zaključavanje overflow-a. Sadržaj (cena, lista, dugmad) ostaje u parentu.
 */
export function ModalShell({
  titleId,
  descriptionId,
  locked,
  onClose,
  children,
  className =
    "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border-2 border-zinc-100 bg-white p-5 text-ink shadow-2xl backdrop:bg-ink/60 sm:p-7",
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointer = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function outside(
    event: React.PointerEvent<HTMLDialogElement> | React.MouseEvent<HTMLDialogElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={locked}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onPointerDown={(event) => {
        backdropPointer.current = outside(event);
      }}
      onClick={(event) => {
        if (!locked && backdropPointer.current && outside(event)) onClose();
        backdropPointer.current = false;
      }}
    >
      {children}
    </dialog>
  );
}
