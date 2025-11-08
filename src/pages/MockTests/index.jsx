import {
  FileText,
  Clock,
  Users,
  TrendingUp,
  Award,
  Play,
  BarChart3,
  Target,
  Brain,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Pause,
  RotateCcw,
  Eye
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { saveTestResult, loadTestResults, loadUserModules, loadUserProfile, getAvailableStudyFields } from '../../utils/localStorage'
import './MockTests.css'

const MockTests = () => {
  // Define test data first, before any references to it
  const testData = [
    {
      id: 1,
      title: 'Computer Science Fundamentals',
      description: 'Test your knowledge of basic computer science concepts',
      fieldCategory: 'engineering',
      subField: 'computer_science',
      difficulty: 'Medium',
      questions: 30,
      timeLimit: 45,
      attempts: 0,
      testQuestions: [] // Add empty questions array
    },
    {
      id: 2,
      title: 'Electrical Circuit Analysis',
      description: 'Comprehensive test on circuit analysis and electrical principles',
      fieldCategory: 'engineering',
      subField: 'electrical',
      difficulty: 'Hard',
      questions: 25,
      timeLimit: 60,
      attempts: 0
    },
    {
      id: 3,
      title: 'Human Anatomy',
      description: 'Test covering the human body systems and structures',
      fieldCategory: 'medical',
      subField: 'medicine',
      difficulty: 'Medium',
      questions: 40,
      timeLimit: 50,
      attempts: 0
    },
    {
      id: 4,
      title: 'Financial Accounting Principles',
      description: 'Test your knowledge of accounting fundamentals',
      fieldCategory: 'business',
      subField: 'accounting',
      difficulty: 'Medium',
      questions: 35,
      timeLimit: 45,
      attempts: 0
    },
    {
      id: 5,
      title: 'Physics Mechanics',
      description: 'Comprehensive test on classical mechanics',
      fieldCategory: 'science',
      subField: 'physics',
      difficulty: 'Hard',
      questions: 30,
      timeLimit: 60,
      attempts: 0
    },
    {
      id: 6,
      title: 'High School Mathematics',
      description: 'General mathematics test for high school students',
      fieldCategory: 'school',
      subField: 'high_school',
      difficulty: 'Easy',
      questions: 25,
      timeLimit: 40,
      attempts: 0
    }
  ]

  // Now initialize all state variables
  const [currentView, setCurrentView] = useState('list')
  const [selectedTest, setSelectedTest] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [savedTestResults, setSavedTestResults] = useState([])
  const [userModules, setUserModules] = useState([])
  const [userProfile, setUserProfile] = useState({})
  const [filteredTests, setFilteredTests] = useState([])
  const [availableStudyFields, setAvailableStudyFields] = useState([])
  const [tests, setTests] = useState(testData)

  // Load user profile and filter tests based on field of study
  useEffect(() => {
    // Load user profile
    const profile = loadUserProfile()
    setUserProfile(profile)
    
    // Load available study fields
    setAvailableStudyFields(getAvailableStudyFields())
    
    // Filter tests based on user's field of study
    filterTestsByUserField(profile)
  }, [])

  // Function to filter tests based on user's field of study
  const filterTestsByUserField = (profile) => {
    if (!profile || !profile.fieldOfStudy) {
      setFilteredTests([])
      return
    }

    // Map field IDs to subject names
    const fieldToSubjectMap = {
      'science': ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      'mathematics': ['Mathematics', 'Statistics', 'Calculus'],
      'engineering': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Physics', 'Mathematics'],
      'medical': ['Anatomy', 'Physiology', 'Biochemistry', 'Biology', 'Chemistry'],
      'business': ['Economics', 'Finance', 'Marketing', 'Statistics']
    }

    // Get relevant subjects based on user's field
    const relevantSubjects = fieldToSubjectMap[profile.fieldOfStudy] || []
    
    // Filter tests to only include relevant subjects
    const filtered = tests.filter(test => 
      relevantSubjects.includes(test.subject)
    )
    
    setFilteredTests(filtered)
  }

  // Update the performance data to only show relevant subjects
  const getRelevantPerformanceData = () => {
    if (!userProfile || !userProfile.fieldOfStudy) {
      return []
    }

    // Map field IDs to subject names
    const fieldToSubjectMap = {
      'science': ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
      'mathematics': ['Mathematics', 'Statistics', 'Calculus'],
      'engineering': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Physics', 'Mathematics'],
      'medical': ['Anatomy', 'Physiology', 'Biochemistry', 'Biology', 'Chemistry'],
      'business': ['Economics', 'Finance', 'Marketing', 'Statistics']
    }

    // Get relevant subjects based on user's field
    const relevantSubjects = fieldToSubjectMap[userProfile.fieldOfStudy] || []
    
    // Filter performance data to only include relevant subjects
    return performanceData.filter(data => 
      relevantSubjects.includes(data.subject)
    )
  }

  const performanceData = [
    { subject: 'Mathematics', score: 85, trend: '+5%', color: 'bg-blue-500' },
    { subject: 'Physics', score: 92, trend: '+12%', color: 'bg-green-500' },
    { subject: 'Chemistry', score: 78, trend: '-2%', color: 'bg-yellow-500' },
    { subject: 'Computer Science', score: 88, trend: '+8%', color: 'bg-purple-500' }
  ]

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isTestActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            handleSubmitTest()
            return 0
          }
          return time - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTestActive, timeRemaining])

  const startTest = (test) => {
    setSelectedTest(test)
    setCurrentView('taking')
    setCurrentQuestion(0)
    setAnswers({})
    setTimeRemaining(test.duration * 60) // Convert minutes to seconds
    setIsTestActive(true)
    setFlaggedQuestions(new Set())
  }

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleFlagQuestion = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleSubmitTest = () => {
    setIsTestActive(false)

    // Calculate results
    const questions = selectedTest.testQuestions
    let correctAnswers = 0
    const detailedResults = questions.map(question => {
      const userAnswer = answers[question.id]
      const isCorrect = userAnswer === question.correct
      if (isCorrect) correctAnswers++

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct,
        isCorrect,
        explanation: question.explanation,
        options: question.options
      }
    })

    const score = Math.round((correctAnswers / questions.length) * 100)

    const results = {
      score,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent: selectedTest.duration * 60 - timeRemaining,
      detailedResults
    }

    // Save test result to localStorage
    const testResultData = {
      id: Date.now(),
      testId: selectedTest.id,
      testTitle: selectedTest.title,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent: selectedTest.duration * 60 - timeRemaining,
      completedAt: new Date().toISOString(),
      detailedResults
    }

    saveTestResult(testResultData)

    // Update saved results state
    const updatedResults = loadTestResults()
    setSavedTestResults(updatedResults)

    // Show notification
    notifyTestCompleted(score, selectedTest.title)

    setTestResults(results)
    setCurrentView('results')
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--teams-success)'
    if (score >= 60) return 'var(--teams-warning)'
    return 'var(--teams-error)'
  }

  const aiInsights = [
    {
      icon: <Brain className="h-5 w-5 text-blue-500" />,
      title: "Strength Analysis",
      content: "You excel in Physics mechanics problems. Focus on thermodynamics for improvement."
    },
    {
      icon: <Target className="h-5 w-5 text-green-500" />,
      title: "Improvement Areas",
      content: "Mathematics calculus integration needs practice. Recommend 2 hours weekly focus."
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      title: "Performance Trend",
      content: "Overall improvement of 15% in the last month. Keep up the consistent practice!"
    }
  ]

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Test Taking View
  if (currentView === 'taking' && selectedTest) {
    const currentQ = selectedTest.testQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / selectedTest.testQuestions.length) * 100

    return (
      <div className="test-taking-container">
        {/* Test Header */}
        <div className="test-header">
          <div className="test-header-left">
            <button
              className="back-btn"
              onClick={() => setCurrentView('list')}
            >
              <ArrowLeft size={20} />
              Back to Tests
            </button>
            <div className="test-info">
              <h2>{selectedTest.title}</h2>
              <p>Question {currentQuestion + 1} of {selectedTest.testQuestions.length}</p>
            </div>
          </div>
          <div className="test-header-right">
            <div className="timer">
              <Clock size={20} />
              <span className={timeRemaining < 300 ? 'timer-warning' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              className="submit-btn"
              onClick={handleSubmitTest}
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="test-progress-bar">
          <div
            className="test-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Content */}
        <div className="question-container">
          <div className="question-header">
            <h3>Question {currentQuestion + 1}</h3>
            <button
              className={`flag-btn ${flaggedQuestions.has(currentQ.id) ? 'flagged' : ''}`}
              onClick={() => handleFlagQuestion(currentQ.id)}
            >
              <Flag size={16} />
              {flaggedQuestions.has(currentQ.id) ? 'Flagged' : 'Flag'}
            </button>
          </div>

          <div className="question-text">
            {currentQ.question}
          </div>

          <div className="options-container">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${answers[currentQ.id] === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(currentQ.id, index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="question-navigation">
          <button
            className="nav-btn"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <div className="question-grid">
            {selectedTest.testQuestions.map((_, index) => (
              <button
                key={index}
                className={`question-number ${
                  index === currentQuestion ? 'current' :
                  answers[selectedTest.testQuestions[index].id] !== undefined ? 'answered' :
                  flaggedQuestions.has(selectedTest.testQuestions[index].id) ? 'flagged' : ''
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            className="nav-btn"
            onClick={() => setCurrentQuestion(Math.min(selectedTest.testQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === selectedTest.testQuestions.length - 1}
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Test Results View
  if (currentView === 'results' && testResults) {
    return (
      <div className="test-results-container">
        {/* Results Header */}
        <div className="results-header">
          <div className="results-header-content">
            <h1>Test Results</h1>
            <p>{selectedTest.title}</p>
          </div>
          <button
            className="back-btn"
            onClick={() => setCurrentView('list')}
          >
            <ArrowLeft size={20} />
            Back to Tests
          </button>
        </div>

        {/* Score Overview */}
        <div className="score-overview">
          <div className="score-card main-score">
            <div className="score-circle" style={{ borderColor: getScoreColor(testResults.score) }}>
              <span className="score-value" style={{ color: getScoreColor(testResults.score) }}>
                {testResults.score}%
              </span>
            </div>
            <h3>Your Score</h3>
            <p>{testResults.correctAnswers} out of {testResults.totalQuestions} correct</p>
          </div>

          <div className="score-stats">
            <div className="stat-item">
              <CheckCircle size={24} color="var(--teams-success)" />
              <div>
                <h4>{testResults.correctAnswers}</h4>
                <p>Correct</p>
              </div>
            </div>
            <div className="stat-item">
              <XCircle size={24} color="var(--teams-error)" />
              <div>
                <h4>{testResults.totalQuestions - testResults.correctAnswers}</h4>
                <p>Incorrect</p>
              </div>
            </div>
            <div className="stat-item">
              <Clock size={24} color="var(--teams-accent)" />
              <div>
                <h4>{formatTime(testResults.timeSpent)}</h4>
                <p>Time Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="detailed-results">
          <h3>Question Review</h3>
          <div className="results-list">
            {testResults.detailedResults.map((result, index) => (
              <div key={result.questionId} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="question-number">Q{index + 1}</span>
                  <div className="result-status">
                    {result.isCorrect ? (
                      <CheckCircle size={20} color="var(--teams-success)" />
                    ) : (
                      <XCircle size={20} color="var(--teams-error)" />
                    )}
                  </div>
                </div>
                <div className="result-content">
                  <p className="result-question">{result.question}</p>
                  <div className="result-answers">
                    <div className="answer-row">
                      <span className="answer-label">Your answer:</span>
                      <span className={`answer-value ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                        {result.userAnswer !== undefined ?
                          `${String.fromCharCode(65 + result.userAnswer)} - ${result.options[result.userAnswer]}` :
                          'Not answered'
                        }
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div className="answer-row">
                        <span className="answer-label">Correct answer:</span>
                        <span className="answer-value correct">
                          {String.fromCharCode(65 + result.correctAnswer)} - {result.options[result.correctAnswer]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="result-explanation">
                    <strong>Explanation:</strong> {result.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button
            className="action-btn secondary"
            onClick={() => startTest(selectedTest)}
          >
            <RotateCcw size={16} />
            Retake Test
          </button>
          <button
            className="action-btn primary"
            onClick={() => setCurrentView('list')}
          >
            <Eye size={16} />
            View All Tests
          </button>
        </div>
      </div>
    )
  }

  // Default Test List View
  return (
    <div className="mock-tests-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Mock Tests</h1>
          <p className="page-subtitle">Practice with comprehensive tests and track your performance</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary">
            <Play size={16} />
            Quick Test
          </button>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="performance-cards">
        {getRelevantPerformanceData().length > 0 ? (
          getRelevantPerformanceData().map((data, index) => (
            <div key={index} className="performance-card">
              <div className="performance-trend">{data.trend}</div>
              <h3 className="performance-subject">{data.subject}</h3>
              <div className="performance-score">{data.score}%</div>
              <div className="performance-label">Average Score</div>
            </div>
          ))
        ) : (
          <div className="no-performance-data">
            <p>No test performance data available for your field of study</p>
          </div>
        )}
      </div>

      {/* Available Tests */}
      <div className="tests-section">
        <div className="section-header">
          <h2 className="section-title">Available Tests</h2>
          <p className="section-subtitle">
            {userProfile.fieldOfStudy ? 
              `Tests for ${userProfile.fieldOfStudy.charAt(0).toUpperCase() + userProfile.fieldOfStudy.slice(1)}` : 
              'Choose from our comprehensive test library'}
          </p>
        </div>

        {/* Show message if no field of study selected */}
        {!userProfile.fieldOfStudy && (
          <div className="no-field-selected">
            <FileText size={48} />
            <h3>No field of study selected</h3>
            <p>Please select your field of study in Settings to see relevant tests</p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/settings'}
            >
              Go to Settings
            </button>
          </div>
        )}

        {/* Show tests grid if tests are available */}
        {(userProfile.fieldOfStudy && filteredTests.length > 0) ? (
          <div className="test-grid">
            {filteredTests.map(test => (
              <div key={test.id} className="test-card">
                <div className="test-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 className="test-title">{test.title}</h3>
                    <span className={`test-difficulty ${test.difficulty.toLowerCase()}`}>
                      {test.difficulty}
                    </span>
                  </div>
                  <p className="test-description">{test.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span className="test-field-badge">
                      {getFieldDisplayName(test.fieldCategory)}
                    </span>
                    {test.subField && (
                      <span className="test-subfield-badge">
                        {getFieldDisplayName(test.subField)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="test-stats">
                  <div className="test-stat">
                    <div className="test-stat-value">{test.questions}</div>
                    <div className="test-stat-label">Questions</div>
                  </div>
                  <div className="test-stat">
                    <div className="test-stat-value">{test.timeLimit} min</div>
                    <div className="test-stat-label">Time Limit</div>
                  </div>
                  <div className="test-stat">
                    <div className="test-stat-value">{test.attempts}</div>
                    <div className="test-stat-label">Attempts</div>
                  </div>
                </div>
                
                <div className="test-actions">
                  <button 
                    className="test-action-btn"
                    onClick={() => {
                      setSelectedTest(test);
                      setCurrentView('preview');
                    }}
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button 
                    className="test-action-btn primary"
                    onClick={() => {
                      setSelectedTest(test);
                      setTimeRemaining(test.timeLimit * 60);
                      setCurrentView('test');
                      setCurrentQuestion(0);
                      setAnswers({});
                      setFlaggedQuestions(new Set());
                      setIsTestActive(true);
                    }}
                  >
                    <Play size={16} />
                    Start Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          userProfile.fieldOfStudy && (
            <div className="no-tests-available">
              <FileText size={48} />
              <h3>No tests available</h3>
              <p>There are no tests available for your selected field of study</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default MockTests






















