import { useEffect, useRef } from "react";

export function ConfirmModal({
  isOpen,
  title = "Confirm action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onCancel?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-light btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`button ${isDestructive ? "btn-danger" : "button-dark"} btn-sm`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({
  isOpen,
  title = "Edit item",
  message,
  initialValue = "",
  placeholder = "",
  confirmText = "Save",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onCancel?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputRef.current?.value ?? "";
    onConfirm?.(value);
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <form
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h3 id="prompt-modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {message && <p>{message}</p>}
          <div className="modal-input">
            <input
              ref={inputRef}
              type="text"
              defaultValue={initialValue}
              placeholder={placeholder}
              required
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-light btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="submit" className="button button-dark btn-sm">
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmModal;
