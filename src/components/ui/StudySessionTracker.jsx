import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock, BookOpen, Minimize2, Maximize2 } from 'lucide-react'
import './StudySessionTracker.css'
import { useUserContext } from '../../contexts/UserContext'

const StudySessionTracker = ({ isOpen, onClose }) => {
  const { currentUser: user } = useUserContext()
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [time, setTime] = useState(0)
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [userModules, setUserModules] = useState([])
  const [isMinimized, setIsMinimized] = useState(false)
  const panelRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 100, y: 100 })

  useEffect(() => {
    const fetchModules = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found. User must be logged in to see materials.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }

        const data = await response.json();
        const formattedModules = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category_id,
          tags: doc.tags || [],
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          uploadDate: doc.upload_date,
          lastAccessed: doc.last_accessed,
          bookmarked: doc.bookmarked,
          fileUrl: doc.file_url,
        }));
        setUserModules(formattedModules);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchModules();
  }, [])

  useEffect(() => {
    let interval = null
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime(time => time + 1)
      }, 1000)
    } else if (!isActive && time !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, isPaused, time])

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = async () => {
    if (time <= 0) {
      setIsActive(false)
      setIsPaused(false)
      setTime(0)
      onClose()
      return
    }

    if (!user) {
      alert('You must be logged in to save a study session.')
      return
    }

    if (!selectedMaterial) {
      alert('Please select a material to save the session.')
      return
    }

    // If session is paused, resume it to count the paused time before stopping
    if (isPaused) {
      setIsPaused(false)
    }

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - time * 1000)

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/dashboard/studySessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        
        body: JSON.stringify({

          user_id: user.id,
          material_id: parseInt(selectedMaterial, 10),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save study session')
      }

      alert('Study session saved successfully!')
      
      // Reset state on success
      setIsActive(false)
      setIsPaused(false)
      setTime(0)
      setSelectedMaterial('')
      setSessionNotes('')
      onClose()
    } catch (err) {
      console.error('Error saving study session:', err)
      alert(`Failed to save session: ${err.message}`)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseDown = (e) => {
    if (panelRef.current && e.target === panelRef.current.querySelector('.panel-header')) {
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    })
  }

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="study-session-panel"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: isMinimized ? '200px' : '350px',
        height: isMinimized ? '40px' : 'auto',
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        borderRadius: '8px',
        zIndex: 1000,
        userSelect: 'none',
        cursor: 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="panel-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: 'var(--teams-purple)',
        color: 'white',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        cursor: 'move'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Study Session Tracker</h3>
        <div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginRight: '8px'
            }}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="panel-body" style={{ padding: '12px' }}>
          <div className="study-timer" style={{ marginBottom: '12px' }}>
            <div className="timer-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={32} color="var(--teams-purple)" />
              <span className="timer-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatTime(time)}</span>
            </div>
            
            <div className="timer-controls" style={{ marginTop: '8px' }}>
              {!isActive ? (
                <button 
                  className="timer-btn start-btn"
                  onClick={handleStart}
                  disabled={!selectedMaterial && userModules.length > 0}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  <Play size={20} />
                  Start
                </button>
              ) : (
                <>
                  <button 
                    className="timer-btn pause-btn"
                    onClick={handlePause}
                    style={{ padding: '6px 12px', cursor: 'pointer', marginRight: '8px' }}
                  >
                    <Pause size={20} />
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button 
                    className="timer-btn stop-btn"
                    onClick={handleStop}
                    style={{ padding: '6px 12px', cursor: 'pointer' }}
                  >
                    <Square size={20} />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="session-details">
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Study Material (Optional)</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="form-select"
                disabled={isActive}
                style={{ width: '100%', padding: '6px' }}
              >
                <option value="">General Study Session</option>
                {userModules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {isActive && (
            <div className="session-status" style={{ marginTop: '12px' }}>
              <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`status-dot ${isPaused ? 'paused' : 'active'}`}></div>
                <span>{isPaused ? 'Session Paused' : 'Session Active'}</span>
              </div>
              {selectedMaterial && (
                <div className="current-material" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <BookOpen size={16} />
                  <span>{userModules.find(m => m.id === selectedMaterial)?.title}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudySessionTracker
