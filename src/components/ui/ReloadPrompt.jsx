import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useNotifications } from './NotificationSystem'

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  // We can use the existing NotificationSystem if we want, or just render a simple fixed div at the bottom right.
  // We'll render a simple fixed div so it doesn't get lost in other toasts.
  
  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#1e1e1e',
      border: '1px solid #464647',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      color: '#ffffff',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Update Available</h3>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#cccccc' }}>
        A new version of LearnSync is available. Reload to update.
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button 
          onClick={() => setNeedRefresh(false)}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid #464647',
            borderRadius: '6px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Close
        </button>
        <button 
          onClick={() => updateServiceWorker(true)}
          style={{
            padding: '6px 12px',
            background: '#6264a7',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Reload
        </button>
      </div>
    </div>
  )
}

export default ReloadPrompt
