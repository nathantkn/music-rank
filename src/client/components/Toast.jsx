import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import '../styles/Toast.css'

const ToastContext = createContext(() => {})

/** `const toast = useToast()` → `toast('Saved.')` or `toast('Something broke.', 'warn')`. */
export function useToast() {
  return useContext(ToastContext)
}

function Toast({ message, tone, onDismiss }) {
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => dismissRef.current(), 4200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="toast-dot" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id))
  }, [])

  const push = useCallback((message, tone = 'ok') => {
    const id = nextId.current++
    setToasts(list => [...list, { id, message, tone }])
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} tone={t.tone} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
