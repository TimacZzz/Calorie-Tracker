import { useEffect, useId, useRef } from "react";

/**
 * Modal chrome only. Knows nothing about food, entries or meals.
 *
 * Owns: backdrop, positioning, Escape, backdrop dismissal, focus placement
 * and restoration, body scroll lock.
 *
 * Does not own: a focus trap. Tab can still reach the page behind it.
 * See STATE.md open loops.
 */
export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  // Keep the latest onClose reachable without putting it in the mount
  // effect's dependencies. Runs after every render, no dependency array.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Mount and unmount only. Everything in here has a matching undo.
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, []);

  // Only a click on the backdrop itself closes. A click that started on a
  // child and bubbled up has a different target and is ignored.
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl focus:outline-none sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
