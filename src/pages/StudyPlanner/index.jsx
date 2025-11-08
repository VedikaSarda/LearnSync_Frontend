import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getToken, calculateTotalStudyHours, saveStudyEvents } from '../../utils/localStorage'
import { isUserLoggedIn } from '../../utils/auth'
import './StudyPlanner.css'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Bot,
  Target,
  AlertCircle,
  Edit3,
  Trash2,
  Save,
  X,
  MapPin,
  Bell,
  Check
} from 'lucide-react'

const StudyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // week, month
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [undoEventId, setUndoEventId] = useState(null)
  const undoTimer = useRef(null)

  // Load events from API on component mount
  useEffect(() => {
    
    fetchEvents()
  }, [])

const fetchEvents = async () => {
      if (isUserLoggedIn()) {
        setLoading(true)
        setError(null)
        try {
          const token = getToken()
          if (!token) {
            // This case might happen if session exists but token is cleared somehow.
            throw new Error('Authentication token not found.')
          }

          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/study-planner/events`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          const formattedEvents = data.study_events.map(event => {
            // Parse the date using ISO string format for robustness.
            return {
              ...event,
              date: new Date(`${event.event_date}T00:00:00`),
              time: event.event_time,
              completed: Boolean(event.completed)
            }
          })

          setEvents(formattedEvents)

          // Save study events to localStorage for dashboard access
          saveStudyEvents(formattedEvents)

        } catch (err) {
          setError(err.message)
          console.error('Failed to fetch study events:', err)
        } finally {
          setLoading(false)
        }
      } else {
        // User is not logged in, show an empty planner.
        setEvents([])
        setLoading(false)
      }
    }

  const [newEvent, setNewEvent] = useState({
    title: '',
    subject: '',
    time: '',
    date: new Date(),
    type: 'study',
    priority: 'medium',
    description: '',
    location: '',
    reminder: 15,
    materialId: '', // Link to user material
    materialTitle: '',
    completed: false
  })

  // Event management functions
  const handleAddEvent = () => {
    setEditingEvent(null)
    setNewEvent({
      title: '',
      subject: '',
      time: '',
      date: selectedDate,
      type: 'study',
      priority: 'medium',
      description: '',
      location: '',
      reminder: 15,
      materialId: '',
      materialTitle: ''
    })
    setShowEventModal(true)
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setNewEvent({ ...event })
    setShowEventModal(true)
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = getToken()
        if (!token) {
          throw new Error('Authentication token not found.')
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/study-planner/event/${eventId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        // Re-fetch events from backend after delete
        await fetchEvents()

        alert('Event deleted successfully!')
        setShowEventModal(false) // Close modal if open
        setEditingEvent(null)
      } catch (err) {
        console.error('Failed to delete study event:', err)
        alert(`Error: ${err.message}`)
      }
    }
  }

  const saveEventStatus = async (eventId, completed) => {
    const originalEvents = [...events]
    const eventToUpdate = originalEvents.find(event => event.id === eventId)
    try {
      const token = getToken()
      if (!token) throw new Error('Authentication token not found.')

      const eventToSave = {
        ...eventToUpdate,
        event_date: eventToUpdate.date.toLocaleDateString('en-CA'),
        completed
      }
      delete eventToSave.date // Remove date object before sending

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/study-planner/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventToSave)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      // Success: UI is already updated optimistically.
    } catch (err) {
      console.error('Failed to update event status:', err)
      alert(`Error: ${err.message}`)
      setEvents(originalEvents) // Revert on error
    }
  }

  const handleToggleComplete = (eventId) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const isCompleting = !event.completed

    // Optimistically update UI
    setEvents(events.map(e => (e.id === eventId ? { ...e, completed: isCompleting } : e)))

    if (undoTimer.current) {
      clearTimeout(undoTimer.current)
    }

    if (isCompleting) {
      // If marking as complete, offer an undo option for 3 seconds
      setUndoEventId(eventId)
      undoTimer.current = setTimeout(() => {
        saveEventStatus(eventId, true)
        setUndoEventId(null)
      }, 3000)
    } else {
      // If un-marking, it might be a cancellation of an undo action
      if (undoEventId === eventId) {
        setUndoEventId(null) // Just cancel the undo, no API call was made
      } else {
        // Otherwise, it's a standard un-mark action, save immediately
        saveEventStatus(eventId, false)
      }
    }
  }

  const handleUndoComplete = (eventId) => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current)
    }
    setUndoEventId(null)
    // Revert the optimistic UI update
    setEvents(events.map(e => (e.id === eventId ? { ...e, completed: false } : e)))
  }

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.time) {
      alert('Please fill in all required fields')
      return
    }

    if (editingEvent) {
  // Implement API call for updating an event
  try {
    const token = getToken()
    if (!token) {
      throw new Error('Authentication token not found.')
    }

    const eventToSave = {
      title: newEvent.title,
      subject: newEvent.subject,
      description: newEvent.description,
      event_date: newEvent.date.toLocaleDateString('en-CA'),
      event_time: newEvent.time,
      type: newEvent.type,
      priority: newEvent.priority,
      location: newEvent.location,
      reminder: newEvent.reminder,
      completed: newEvent.completed
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/study-planner/events/${editingEvent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(eventToSave)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // ✅ Re-fetch events from backend after update
    await fetchEvents()

    alert('Event updated successfully!')
    setShowEventModal(false)
    setEditingEvent(null)
  } catch (err) {
    console.error('Failed to update study event:', err)
    alert(`Error: ${err.message}`)
  }
}
 else {
      // Add new event via API
      try {
        const token = getToken()
        if (!token) {
          throw new Error('Authentication token not found.')
        }

        const eventToSave = {
          title: newEvent.title,
          subject: newEvent.subject,
          description: newEvent.description,
          event_date: newEvent.date.toLocaleDateString('en-CA'),
          event_time: newEvent.time,
          type: newEvent.type,
          priority: newEvent.priority,
          location: newEvent.location,
          reminder: newEvent.reminder,
          completed: newEvent.completed
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/study-planner/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(eventToSave)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const createdEvent = await response.json()
        
        const formattedEvent = {
            ...createdEvent,
            date: new Date(`${createdEvent.event_date}T00:00:00`),
            time: createdEvent.event_time,
            completed: Boolean(createdEvent.completed)
        }

       await fetchEvents()

        alert('Event added successfully!')

        setShowEventModal(false)
        setEditingEvent(null)
      } catch (err) {
        console.error('Failed to save study event:', err)
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleCloseModal = () => {
    setShowEventModal(false)
    setEditingEvent(null)
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const getEventsForDate = (date) => {
    return events.filter(event => {
      return event.date.toDateString() === date.toDateString()
    })
  }

  const getEventsForWeekDay = (dayIndex, time) => {
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = startOfWeek.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday)

    const targetDate = new Date(startOfWeek)
    targetDate.setDate(targetDate.getDate() + dayIndex)

    return events.filter(event => {
      return event.date.toDateString() === targetDate.toDateString() && event.time === time
    })
  }


  const aiTips = [
    {
      icon: <Bot className="w-5 h-5 text-blue-500" />,
      title: "Optimal Study Time",
      content: "Based on your performance data, you're most productive between 9-11 AM. Schedule challenging topics during this time."
    },
    {
      icon: <Target className="w-5 h-5 text-green-500" />,
      title: "Weekly Goal",
      content: "You're making great progress towards your weekly study goals. Keep up the excellent work!"
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
      title: "Study Reminder",
      content: "Don't forget to take regular breaks during your study sessions for better retention and focus."
    }
  ]

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = startOfWeek.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    return dates
  }, [currentDate])

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const timeSlots = useMemo(() => {
    const defaultSlots = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
    ]

    // Get events for the currently viewed week
    const weekStart = new Date(currentDate)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekEvents = events.filter(event => {
      return event.date >= weekStart && event.date <= weekEnd
    })

    const eventTimes = weekEvents.map(event => event.time).filter(Boolean)

    const allSlots = [...new Set([...defaultSlots, ...eventTimes])]
    
    allSlots.sort((a, b) => a.localeCompare(b))

    return allSlots
  }, [events, currentDate])

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startDayOfWeek = (firstDayOfMonth.getDay() === 0) ? 6 : firstDayOfMonth.getDay() - 1
    const lastDayOfPrevMonth = new Date(year, month, 0)
    const daysInPrevMonth = lastDayOfPrevMonth.getDate()
    const calendarDays = []
    for (let i = 0; i < startDayOfWeek; i++) {
      const day = daysInPrevMonth - startDayOfWeek + i + 1
      const date = new Date(year, month - 1, day)
      calendarDays.push({ date, day, isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      calendarDays.push({ date, day: i, isCurrentMonth: true })
    }
    const grid_size = 42
    const nextMonthDays = grid_size - calendarDays.length
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i)
      calendarDays.push({ date, day: i, isCurrentMonth: false })
    }
    return calendarDays
  }, [currentDate])

  if (loading) {
    return <div className="planner-page"><p>Loading events...</p></div>
  }

  if (error) {
    return <div className="planner-page"><p>Error fetching events: {error}</p></div>
  }

  const todaysEvents = events.filter(event => {
    const today = new Date()
    const eventDate = event.date
    const isToday = eventDate.getFullYear() === today.getFullYear() &&
           eventDate.getMonth() === today.getMonth() &&
           eventDate.getDate() === today.getDate()

    // Show event if it's for today and not completed, or if it's the one we can currently undo.
    return isToday && (!event.completed || event.id === undoEventId)
  })

  return (
    <div className="planner-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Study Planner</h1>
          <p className="page-subtitle">Plan and organize your study schedule with AI assistance</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('week')}
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
          </div>
          <button className="action-btn primary" onClick={handleAddEvent}>
            <div className="action-icon">
              <Plus size={16} color="white" />
            </div>
            <span className="action-label">Add Event</span>
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Calendar */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="material-action-btn" onClick={() => navigateDate(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <div className="month-year-selector">
                  <h2 className="card-title">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="month-selector-dropdown">
                    <select
                      value={currentDate.getMonth()}
                      onChange={(e) => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(parseInt(e.target.value));
                        setCurrentDate(newDate);
                      }}
                      className="month-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={currentDate.getFullYear()}
                      onChange={(e) => {
                        const newDate = new Date(currentDate);
                        newDate.setFullYear(parseInt(e.target.value));
                        setCurrentDate(newDate);
                      }}
                      className="year-select"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={2023 + i}>
                          {2023 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="material-action-btn" onClick={() => navigateDate(1)}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <button
                style={{ color: 'var(--teams-purple)', fontSize: '14px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={goToToday}
              >
                Today
              </button>
            </div>
          </div>

          <div className="card-content">
            {/* Week View */}
            {viewMode === 'week' && (
              <div className="week-view-container">
                <div className="week-view-grid">
                <div className="week-view-time-header">Time</div>
                {weekDates.map((date, index) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={index} className={`week-view-day-header ${isToday ? 'today' : ''}`}>
                      <span className="day-full">{dayName} {dayNumber}</span>
                      <span className="day-short">{dayName} {dayNumber}</span>
                      <span className="day-mini">{dayName.substring(0, 1)}</span>
                    </div>
                  );
                })}
                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    <div className="week-view-time-slot">{time}</div>
                    {weekDays.map((day, dayIndex) => {
                      const dayEvents = getEventsForWeekDay(dayIndex, time)
                      return (
                        <div
                          key={`${day}-${time}`}
                          className="week-view-cell"
                        >
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`week-view-event ${event.completed ? 'completed' : ''}`}
                              style={{
                                background: event.priority === 'high' ? 'var(--teams-error)' :
                                           event.priority === 'medium' ? 'var(--teams-warning)' :
                                           'var(--teams-purple)',
                                color: 'white',
                                opacity: event.completed ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => handleEditEvent(event)}
                              title={`${event.title} - ${event.description || 'No description'}`}
                            >
                              {event.completed && <Check size={14} />}
                              <div style={{ textDecoration: event.completed ? 'line-through' : 'none' }}>
                                <div className="week-view-event-title">{event.title}</div>
                                <div>{event.subject}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
                </div>
              </div>
            )}

            {/* Month View */}
            {viewMode === 'month' && (
              <div className="month-view">
                <div className="month-view-scroll-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div className="month-view-headers">
                    {weekDays.map((day) => (
                      <div key={day} className="month-view-header">
                        <span className="day-full">{day}</span>
                        <span className="day-short">{day.substring(0, 3)}</span>
                        <span className="day-mini">{day.substring(0, 1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {monthGrid.map((day, i) => {
                      const dayEvents = getEventsForDate(day.date)
                      const isToday = new Date().toDateString() === day.date.toDateString()

                      return (
                        <div
                          key={i}
                          className={`calendar-cell ${!day.isCurrentMonth ? 'not-current-month' : ''} ${isToday ? 'today' : ''}`}
                          onClick={() => {
                            setSelectedDate(day.date)
                            if (!day.isCurrentMonth) {
                              setCurrentDate(day.date)
                            }
                          }}
                        >
                          <div className="calendar-cell-date">
                            {day.day}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="calendar-events">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={`calendar-event ${event.completed ? 'completed' : ''}`}
                                  style={{
                                    background: event.priority === 'high' ? 'var(--teams-error)' :
                                               event.priority === 'medium' ? 'var(--teams-warning)' :
                                               'var(--teams-purple)',
                                    color: 'white',
                                    opacity: event.completed ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditEvent(event)
                                  }}
                                  title={`${event.title} - ${event.description || 'No description'}`}
                                >
                                  {event.completed && <Check size={12} />}
                                  <div style={{ textDecoration: event.completed ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                    <span className="event-title" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset' }}>{event.title}</span>
                                    <span className="event-time">{event.time}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="planner-sidebar">
          {/* Today's Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today's Schedule</h3>
            </div>
            <div className="card-content">
              <div className="schedule-items">
                {todaysEvents.map((event) => (
                  <div key={event.id} className={`schedule-item ${event.completed ? 'completed' : ''}`}>
                    {undoEventId === event.id ? (
                      <div className="schedule-undo-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Task completed.</span>
                        <button onClick={() => handleUndoComplete(event.id)} className="undo-btn" style={{ background: 'none', border: 'none', color: 'var(--teams-purple)', cursor: 'pointer', fontWeight: '600', padding: '4px' }}>
                          Undo
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="schedule-time">{event.time}</div>
                        <div className="schedule-content">
                          <h4>{event.title}</h4>
                          <p>{event.subject}</p>
                          {event.location && (
                            <p style={{ fontSize: '12px', color: 'var(--teams-text-muted)' }}>
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                        <div className="schedule-actions">
                          <input
                            type="checkbox"
                            checked={event.completed || false}
                            onChange={() => handleToggleComplete(event.id)}
                            className="schedule-checkbox"
                          />
                          <button
                            className="schedule-action-btn"
                            onClick={() => handleEditEvent(event)}
                            title="Edit event"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="schedule-action-btn danger"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {todaysEvents.length === 0 && (
                  <div className="empty-schedule">
                    <p>No events scheduled for today</p>
                    <button className="add-event-btn" onClick={handleAddEvent}>
                      <Plus size={16} />
                      Add Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">AI Study Tips</h3>
            </div>
            <div className="card-content">
              <div className="ai-tips">
                {aiTips.map((tip, index) => (
                  <div key={index} className="ai-tip">
                    <div className="ai-tip-icon">
                      {tip.title.includes('Optimal') ? <Bot size={16} color="white" /> :
                       tip.title.includes('Goal') ? <Target size={16} color="white" /> :
                       <AlertCircle size={16} color="white" />}
                    </div>
                    <div className="ai-tip-content">
                      <h4>{tip.title}</h4>
                      <p>{tip.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">This Week</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--teams-text-muted)' }}>Study Hours</span>
                  <span style={{ fontWeight: '600', color: 'var(--teams-text-primary)' }}>
                    {(() => {
                      const weeklyHours = calculateTotalStudyHours('week');
                      const hours = Math.floor(weeklyHours);
                      const minutes = Math.round((weeklyHours % 1) * 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--teams-text-muted)' }}>Completed Tasks</span>
                  <span style={{ fontWeight: '600', color: 'var(--teams-text-primary)' }}>
                    {(() => {
                      // Get events for the currently viewed week
                      const weekStart = new Date(currentDate);
                      const day = weekStart.getDay();
                      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                      weekStart.setDate(diff);
                      weekStart.setHours(0, 0, 0, 0);

                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      weekEnd.setHours(23, 59, 59, 999);

                      const weekEvents = events.filter(event => {
                        return event.date >= weekStart && event.date <= weekEnd;
                      });
                      
                      const completedCount = weekEvents.filter(event => event.completed).length;
                      return `${completedCount}/${weekEvents.length}`;
                    })()}
                  </span>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={newEvent.subject}
                    onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                    placeholder="Enter subject"
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Time *</label>
                  <input
                    type="text"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    placeholder="e.g., 09:00"
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newEvent.date.toLocaleDateString('en-CA')}
                    onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value.replace(/-/g, '/')) })}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="study">Study Session</option>
                    <option value="assignment">Assignment</option>
                    <option value="preparation">Preparation</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Priority</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <div className="input-with-icon">
                    <MapPin size={16} />
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Enter location"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Reminder (minutes before)</label>
                  <div className="input-with-icon">
                    <Bell size={16} />
                    <select
                      value={newEvent.reminder}
                      onChange={(e) => setNewEvent({ ...newEvent, reminder: parseInt(e.target.value) })}
                      className="form-select"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>

                <div className="form-field full-width">
                  <label>Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter event description"
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {editingEvent && (
                <button
                  className="modal-btn"
                  style={{ marginRight: 'auto', background: 'var(--teams-error)', color: 'white' }}
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                >
                  <Trash2 size={16} /> Delete Event
                </button>
              )}
              <button className="modal-btn secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleSaveEvent}>
                <Save size={16} />
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyPlanner
