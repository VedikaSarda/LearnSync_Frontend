import { BookOpen, Clock, Trophy, Activity, TrendingUp, Target, Calendar, BarChart3, PieChart, Award, Star, Zap, FileText, Video, Image, Music, Archive, File } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  loadUserModules
} from '../../utils/localStorage'
import { useCategories } from '../../contexts/CategoryContext'
import './ProgressTracker.css'

const ProgressTracker = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedChart, setSelectedChart] = useState('hours') // 'hours', 'tasks', 'scores'
  const [hoveredBar, setHoveredBar] = useState(null)
  const [userModules, setUserModules] = useState([])
  const { categories } = useCategories()
  const [goals, setGoals] = useState([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: 1,
    deadline: '',
    category: '',
    priority: 'medium'
  })
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    totalStudyTime: { hours: 0, minutes: 0 },
    studyTimeDifference: '+0h 0m',
    currentStreak: 0,
    averageTestScore: '0.00',
    averageTestScoreDifference: '0%',
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // New state for weekly report data from API
  const [weeklyReportData, setWeeklyReportData] = useState([]);
  const [loadingWeeklyReport, setLoadingWeeklyReport] = useState(false);
  const [weeklyReportError, setWeeklyReportError] = useState(null);

  // Load user modules and goals on component mount
  useEffect(() => {
    const modules = loadUserModules()
    setUserModules(modules)

    const fetchGoals = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setGoals([])
        return
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/goals`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch goals')
        }
        const data = await response.json()
        if (data && Array.isArray(data.goals)) {
          setGoals(data.goals)
        } else {
          setGoals([])
        }
      } catch (error) {
        console.error('Error fetching goals:', error)
        setGoals([])
      }
    }

    fetchGoals()

    const fetchTasks = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setTasks(data.tasks || [])
          }
        } catch (error) {
          console.error('Error fetching tasks:', error)
          setTasks([])
        }
      }
    }
    fetchTasks()
  }, [])

  // Update newGoal category when categories change
  useEffect(() => {
    if (categories.length > 0 && !newGoal.category) {
      setNewGoal(prev => ({ ...prev, category: categories[0].name }))
    }
  }, [categories])

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setStatsError('User not authenticated');
        setLoadingStats(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/stats?period=${selectedPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching progress stats:', error);
        setStatsError(error.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  // New useEffect to fetch weekly report data for the chart
  useEffect(() => {
    const fetchWeeklyReport = async () => {
      setLoadingWeeklyReport(true);
      setWeeklyReportError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setWeeklyReportError('User not authenticated');
        setLoadingWeeklyReport(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/weekly-report`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch weekly report');
        }

        const data = await response.json();
        // Map API data to chart format: array of 7 days with hours, completed tasks, scores
        // API returns weeklyReport: [{date, totalStudyTime: {hours, minutes}, completedTasks, averageTestScore}, ...]
        // We want to map to [{day: 'Mon', hours: float, completed: int, scores: float}, ...] in order Mon-Sun

        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Create a map from date string to data for quick lookup
        const dataMap = {};
        if (data.weeklyReport && Array.isArray(data.weeklyReport)) {
          data.weeklyReport.forEach(item => {
            dataMap[item.date] = item;
          });
        }

        // Determine the current week Monday date string to align days
        const today = new Date();
        const currentDay = today.getDay(); // 0=Sun, 1=Mon...
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        mondayDate.setHours(0, 0, 0, 0);

        const mappedData = daysOfWeek.map((dayName, index) => {
          const dateObj = new Date(mondayDate);
          dateObj.setDate(mondayDate.getDate() + index);
          const dateStr = dateObj.toISOString().split('T')[0];
          const dayData = dataMap[dateStr];
          return {
            day: dayName,
            hours: dayData ? dayData.totalStudyTime.hours + dayData.totalStudyTime.minutes / 60 : 0,
            completed: dayData ? dayData.completedTasks : 0,
            scores: dayData ? parseFloat(dayData.averageTestScore) : 0,
          };
        });

        setWeeklyReportData(mappedData);
      } catch (error) {
        console.error('Error fetching weekly report:', error);
        setWeeklyReportError(error.message);
      } finally {
        setLoadingWeeklyReport(false);
      }
    };

    fetchWeeklyReport();
  }, [selectedPeriod]);

  // Remove local categories extraction and syncing, use categories from context instead

  const handleAddGoal = async () => {
    if (newGoal.title && newGoal.target && newGoal.deadline) {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Authentication required')
        return
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newGoal)
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create goal')
        }
        const responseData = await response.json()
        const createdGoal = responseData.goal || responseData
        setGoals(prev => [...prev, createdGoal])
        setNewGoal({
          title: '',
          target: 1,
          deadline: '',
          category: categories.length > 0 ? categories[0].name : '',
          priority: 'medium'
        })
        setShowGoalForm(false)
      } catch (error) {
        alert('Error creating goal: ' + error.message)
      }
    }
  }

  const handleUpdateGoalProgress = async (goalId, increment = 1) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const updatedProgress = Math.min(goal.progress + increment, goal.target)
    const updatedGoal = { ...goal, progress: updatedProgress }

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Authentication required')
      return
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedGoal)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update goal')
      }
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g))
    } catch (error) {
      alert('Error updating goal: ' + error.message)
    }
  }

  const handleDeleteGoal = async (goalId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this goal?')
    if (!confirmDelete) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Authentication required')
      return
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/progress-tracker/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete goal')
      }
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch (error) {
      alert('Error deleting goal: ' + error.message)
    }
  }

  const weeklyProgress = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(day => ({ day, completed: 0, hours: 0, scores: 0 }));

    const today = new Date();
    const currentDay = today.getDay(); // 0 for Sunday
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    firstDayOfWeek.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
        if (task.completed && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            if (completedDate >= firstDayOfWeek) {
                let dayIndex = completedDate.getDay(); // Sun = 0
                dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Mon = 0, Sun = 6
                if(weeklyData[dayIndex]) {
                    weeklyData[dayIndex].completed += 1;
                }
            }
        }
    });
    return weeklyData;
  }, [tasks]);

  const getChartData = () => {
    const blankData = Array(7).fill(0);
    if (!weeklyReportData || weeklyReportData.length !== 7) {
      return { data: blankData, max: 5, unit: 'h', color: 'var(--teams-purple)' };
    }
    switch (selectedChart) {
      case 'hours':
        const hoursData = weeklyReportData.map(d => d.hours);
        const maxHours = Math.max(...hoursData, 5);
        return { data: hoursData, max: maxHours, unit: 'h', color: 'var(--teams-purple)' };
      case 'tasks':
        const tasksData = weeklyReportData.map(d => d.completed);
        const maxTasks = Math.max(...tasksData, 5);
        return { data: tasksData, max: maxTasks, unit: '', color: 'var(--teams-accent)' };
      case 'scores':
        const scoresData = weeklyReportData.map(d => d.scores);
        const maxScores = Math.max(...scoresData, 100);
        return { data: scoresData, max: maxScores, unit: '%', color: 'var(--teams-success)' };
      default:
        return { data: blankData, max: 5, unit: 'h', color: 'var(--teams-purple)' };
    }
  }

  const chartData = getChartData()

  // Add achievement checking
  useEffect(() => {
    // Check for new achievements based on progress
    const totalHours = weeklyProgress.reduce((sum, day) => sum + day.hours, 0)
    const completedTasks = weeklyProgress.reduce((sum, day) => sum + day.completed, 0)

    // You could trigger achievement notifications here
  }, [weeklyProgress])

  // Use the dynamic goals state instead of static data

  const achievements = [
    {
      id: 1,
      title: 'First Course Completed',
      description: 'Completed your first course',
      icon: '🎓',
      earned: true,
      date: '2024-06-01'
    },
    {
      id: 2,
      title: 'Study Streak Master',
      description: '15 days consecutive study streak',
      icon: '🔥',
      earned: true,
      date: '2024-06-20'
    },
    {
      id: 3,
      title: 'Perfect Score',
      description: 'Achieved 100% on a test',
      icon: '⭐',
      earned: true,
      date: '2024-06-15'
    },
    {
      id: 4,
      title: 'Night Owl',
      description: 'Study for 50 hours total',
      icon: '🦉',
      earned: false,
      progress: 42
    },
    {
      id: 5,
      title: 'Content Creator',
      description: 'Upload 10 materials',
      icon: '⚡',
      earned: userModules.length >= 10,
      progress: userModules.length
    }
  ]

  // Calculate subject progress based on user modules
  const getSubjectProgress = () => {
    const categories = {}
    const colors = ['var(--teams-purple)', 'var(--teams-accent)', 'var(--teams-success)', 'var(--teams-warning)', 'var(--teams-error)']

    userModules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = { count: 0, bookmarked: 0 }
      }
      categories[module.category].count++
      if (module.bookmarked) {
        categories[module.category].bookmarked++
      }
    })

    return Object.entries(categories).map(([category, data], index) => ({
      subject: category.charAt(0).toUpperCase() + category.slice(1),
      progress: data.count > 0 ? Math.round((data.bookmarked / data.count) * 100) : 0,
      color: colors[index % colors.length],
      count: data.count,
      bookmarked: data.bookmarked
    }))
  }

  const subjectProgress = getSubjectProgress()

  return (
    <div className="progress-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Progress Tracker</h1>
          <p className="page-subtitle">Track your learning journey and achievements</p>
        </div>
        <div className="page-header-actions">
          <div className="period-selector">
            <button
              className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </button>
            <button
              className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </button>
            <button
              className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('year')}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <Clock size={24} color="white" />
            </div>
            <span className="stat-value">
              {`${stats.totalStudyTime.hours}h ${stats.totalStudyTime.minutes}m`}
            </span>
          </div>
          <div>
            <p className="stat-label">Total Study Hours</p>
            <p className="stat-change">{stats.studyTimeDifference}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon success">
              <BookOpen size={24} color="white" />
            </div>
          <span className="stat-value">{stats.totalMaterialsUploaded || userModules.length}</span>
        </div>
        <div>
          <p className="stat-label">Materials Uploaded</p>
          <p className="stat-change">
            {selectedPeriod === 'week' ? 'This week' : selectedPeriod === 'month' ? 'This month' : 'This year'}
          </p>
        </div>
      </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon warning">
              <Activity size={24} color="white" />
            </div>
            <span className="stat-value">{stats.currentStreak}</span>
          </div>
          <div>
            <p className="stat-label">Current Streak</p>
            <p className="stat-change">Keep it up!</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon accent">
              <Trophy size={24} color="white" />
            </div>
            <span className="stat-value">{isNaN(parseFloat(stats.averageTestScore)) ? '0.00' : stats.averageTestScore}%</span>
          </div>
          <div>
            <p className="stat-label">Average Score</p>
            <p className="stat-change">{isNaN(parseFloat(stats.averageTestScoreDifference)) ? '0%' : stats.averageTestScoreDifference}</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Weekly Progress Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Weekly Activity</h2>
                <p className="card-subtitle">Your study hours and completed tasks</p>
              </div>
              <div className="chart-controls">
                <button
                  className={`chart-control-btn ${selectedChart === 'hours' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('hours')}
                >
                  <Clock size={16} />
                  Hours
                </button>
                <button
                  className={`chart-control-btn ${selectedChart === 'tasks' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('tasks')}
                >
                  <Target size={16} />
                  Tasks
                </button>
                <button
                  className={`chart-control-btn ${selectedChart === 'scores' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('scores')}
                >
                  <TrendingUp size={16} />
                  Scores
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
          <div className="progress-chart">
            {weeklyReportData.length === 7 ? weeklyReportData.map((day, index) => {
              const chartData = getChartData()
              const value = chartData.data[index]
              const percentage = (value / chartData.max) * 100

              return (
                <div
                  key={day.day}
                  className="chart-bar"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${percentage}%`,
                        background: chartData.color,
                        transform: hoveredBar === index ? 'scaleY(1.05)' : 'scaleY(1)',
                        transition: 'all 0.2s ease',
                        boxShadow: hoveredBar === index ? '0 0 8px rgba(98, 100, 167, 0.5)' : 'none'
                      }}
                    ></div>
                    {hoveredBar === index && (
                      <div className="bar-tooltip">
                        <div className="tooltip-content">
                          <strong>{day.day}</strong>
                          <div>Hours: {Math.floor(day.hours)}h {Math.round((day.hours % 1) * 60)}m</div>
                          <div>Tasks: {day.completed}</div>
                          <div>Score: {day.scores}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bar-label">
                    <span className="day-name">{day.day}</span>
                    <span className="hours-value">
                      {selectedChart === 'hours' ? 
                        `${Math.floor(value)}h ${Math.round((value % 1) * 60)}m` : 
                        `${value}${chartData.unit}`
                      }
                    </span>
                  </div>
                </div>
              )
            }) : (
              <p>Loading chart data...</p>
            )}
            </div>

            {/* Chart Summary */}
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total this week:</span>
                <span className="summary-value">
                  {selectedChart === 'hours' && (() => {
                    const totalHours = weeklyProgress.reduce((sum, day) => sum + day.hours, 0);
                    const hours = Math.floor(totalHours);
                    const minutes = Math.round((totalHours % 1) * 60);
                    return `${hours}h ${minutes}m`;
                  })()}
                  {selectedChart === 'tasks' && `${weeklyProgress.reduce((sum, day) => sum + day.completed, 0)} tasks`}
                  {selectedChart === 'scores' && `${Math.round(weeklyProgress.reduce((sum, day) => sum + day.scores, 0) / weeklyProgress.length)}% avg`}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Best day:</span>
                <span className="summary-value">
                  {selectedChart === 'hours' && weeklyProgress.reduce((max, day) => day.hours > max.hours ? day : max).day}
                  {selectedChart === 'tasks' && weeklyProgress.reduce((max, day) => day.completed > max.completed ? day : max).day}
                  {selectedChart === 'scores' && weeklyProgress.reduce((max, day) => day.scores > max.scores ? day : max).day}
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Current Goals */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Current Goals</h2>
              <p className="card-subtitle">Track your learning objectives</p>
            </div>
            <button
              className="action-btn primary"
              onClick={() => setShowGoalForm(!showGoalForm)}
            >
              {showGoalForm ? 'Cancel' : 'Add Goal'}
            </button>
          </div>
        </div>
        <div className="card-content">
          {showGoalForm && (
            <div className="goal-form">
              <h4>Add New Goal</h4>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Goal title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                />
                <div className="goal-target-container">
                  <button
                    type="button"
                    className="goal-target-btn"
                    onClick={() => setNewGoal(prev => ({ ...prev, target: Math.max(1, prev.target - 1) }))}
                    title="Decrease target"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    placeholder="Target value"
                    value={newGoal.target}
                    onChange={(e) => {
                      const value = Math.max(1, Number(e.target.value));
                      setNewGoal(prev => ({ ...prev, target: value }));
                    }}
                    className="goal-target-input"
                  />
                  <button
                    type="button"
                    className="goal-target-btn"
                    onClick={() => setNewGoal(prev => ({ ...prev, target: prev.target + 1 }))}
                    title="Increase target"
                  >
                    +
                  </button>
                </div>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="form-input"
                />
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  {categories.length === 0 && <option value="">No categories available</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                  className="form-select"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <button
                className="action-btn primary"
                onClick={handleAddGoal}
                style={{ marginTop: '16px' }}
              >
                Create Goal
              </button>
            </div>
          )}

          <div className="goals-list">
            {goals.filter(goal => goal.progress < goal.target).map((goal) => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <h4 className="goal-title">{goal.title}</h4>
                <div className="goal-actions">
                    <span className={`goal-priority ${goal.priority}`}>
                      {goal.priority}
                    </span>
                    <button
                      className="goal-action-btn"
                      onClick={() => handleUpdateGoalProgress(goal.id, 1)}
                      disabled={goal.progress >= goal.target}
                      title="Add progress"
                    >
                      +1
                    </button>
                    <button
                      className="goal-action-btn"
                      onClick={() => handleUpdateGoalProgress(goal.id, -1)}
                      disabled={goal.progress <= 0}
                      title="Decrease progress"
                    >
                      -1
                    </button>
                    <button
                      className="goal-action-btn danger"
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete goal"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="goal-progress">
                  <div className="progress-info">
                    <span>{goal.progress}/{goal.target}</span>
                    <span>{Math.round((goal.progress / goal.target) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="goal-meta">
                  <span className="goal-category">{goal.category}</span>
                  <span className="goal-deadline">Due: {goal.deadline}</span>
                </div>
              </div>
            ))}
            {goals.filter(goal => goal.progress < goal.target).length === 0 && (
              <div className="empty-goals">
                <p>No goals set yet. Click "Add Goal" to create your first learning objective!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Bottom Grid */}
      <div className="content-grid">
        {/* Completed Goals */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Completed Goals</h2>
            <p className="card-subtitle">Your completed learning objectives</p>
          </div>
          <div className="card-content">
            {goals.filter(goal => goal.progress >= goal.target).length === 0 ? (
              <div className="empty-subjects">
                <p>No goals completed yet. Keep working towards your objectives!</p>
              </div>
            ) : (
              <div className="subject-progress-list">
                {goals.filter(goal => goal.progress >= goal.target).map((goal) => (
                  <div key={goal.id} className="subject-item">
                    <div className="subject-info">
                      <h4>{goal.title}</h4>
                      <div className="subject-stats">
                        <span className="subject-count">Progress: {goal.progress}/{goal.target}</span>
                        <span className="subject-percentage">Priority: {goal.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Achievements</h2>
            <p className="card-subtitle">Your learning milestones</p>
          </div>
          <div className="card-content">
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-item ${achievement.earned ? 'earned' : 'locked'}`}
                >
                  <div className="achievement-icon">
                    {achievement.icon}
                  </div>
                  <div className="achievement-info">
                    <h4 className="achievement-title">{achievement.title}</h4>
                    <p className="achievement-description">{achievement.description}</p>
                    {achievement.earned ? (
                      <span className="achievement-date">Earned: {achievement.date}</span>
                    ) : (
                      <div className="achievement-progress">
                        <span>Progress: {achievement.progress}/50</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressTracker
