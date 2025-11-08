import { Briefcase, Target, TrendingUp, Star, MapPin, DollarSign, Clock, BookOpen, Award, ChevronRight, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import './styles.css'

const Career = () => {
  const [selectedTab, setSelectedTab] = useState('paths')
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [enrolledPaths, setEnrolledPaths] = useState(new Set())
  const [skillLevels, setSkillLevels] = useState({
    'JavaScript': 85,
    'Python': 72,
    'React': 78,
    'Node.js': 65,
    'UI/UX Design': 60,
    'Figma': 55,
    'Adobe Creative Suite': 45,
    'Statistics': 70,
    'Machine Learning': 58,
    'SQL': 75
  })
  const [showSkillTest, setShowSkillTest] = useState(null)
  const [notifications, setNotifications] = useState([])

  const handleApplyJob = (jobId) => {
    setAppliedJobs(prev => new Set([...prev, jobId]))
    setNotifications(prev => [...prev, {
      id: Date.now(),
      message: 'Application submitted successfully!',
      type: 'success'
    }])
    // Remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== Date.now()))
    }, 3000)
  }

  const handleEnrollPath = (pathId) => {
    setEnrolledPaths(prev => new Set([...prev, pathId]))
    setNotifications(prev => [...prev, {
      id: Date.now(),
      message: 'Successfully enrolled in learning path!',
      type: 'success'
    }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== Date.now()))
    }, 3000)
  }

  const handleSkillTest = (skillName) => {
    setShowSkillTest(skillName)
  }

  const completeSkillTest = (skillName, improvement = 5) => {
    setSkillLevels(prev => ({
      ...prev,
      [skillName]: Math.min(prev[skillName] + improvement, 100)
    }))
    setShowSkillTest(null)
    setNotifications(prev => [...prev, {
      id: Date.now(),
      message: `Skill assessment completed! ${skillName} improved by ${improvement} points.`,
      type: 'success'
    }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== Date.now()))
    }, 3000)
  }

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  // Mock data for career features
  const careerPaths = [
    {
      id: 1,
      title: 'Software Engineer',
      description: 'Design and develop software applications and systems',
      match: 92,
      salary: '$75,000 - $120,000',
      growth: '+22%',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      education: 'Bachelor\'s in Computer Science',
      experience: '0-2 years',
      companies: ['Google', 'Microsoft', 'Amazon', 'Meta']
    },
    {
      id: 2,
      title: 'Data Scientist',
      description: 'Analyze complex data to help organizations make decisions',
      match: 87,
      salary: '$80,000 - $130,000',
      growth: '+31%',
      skills: ['Python', 'R', 'SQL', 'Machine Learning'],
      education: 'Bachelor\'s in Statistics/Math',
      experience: '1-3 years',
      companies: ['Netflix', 'Uber', 'Airbnb', 'Tesla']
    },
    {
      id: 3,
      title: 'UX Designer',
      description: 'Create user-friendly interfaces and experiences',
      match: 78,
      salary: '$60,000 - $100,000',
      growth: '+13%',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      education: 'Bachelor\'s in Design',
      experience: '0-2 years',
      companies: ['Apple', 'Adobe', 'Spotify', 'Slack']
    }
  ]

  const skillAssessments = [
    {
      category: 'Programming',
      skills: [
        { name: 'JavaScript', level: 85, trend: 'up' },
        { name: 'Python', level: 72, trend: 'up' },
        { name: 'React', level: 78, trend: 'stable' },
        { name: 'Node.js', level: 65, trend: 'up' }
      ]
    },
    {
      category: 'Design',
      skills: [
        { name: 'UI/UX Design', level: 60, trend: 'up' },
        { name: 'Figma', level: 55, trend: 'up' },
        { name: 'Adobe Creative Suite', level: 45, trend: 'stable' }
      ]
    },
    {
      category: 'Data Science',
      skills: [
        { name: 'Statistics', level: 70, trend: 'up' },
        { name: 'Machine Learning', level: 58, trend: 'up' },
        { name: 'SQL', level: 75, trend: 'stable' }
      ]
    }
  ]

  const jobRecommendations = [
    {
      id: 1,
      title: 'Junior Frontend Developer',
      company: 'TechStart Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$70,000 - $85,000',
      match: 94,
      posted: '2 days ago',
      requirements: ['React', 'JavaScript', 'CSS', 'Git']
    },
    {
      id: 2,
      title: 'Software Engineering Intern',
      company: 'Innovation Labs',
      location: 'Remote',
      type: 'Internship',
      salary: '$25/hour',
      match: 89,
      posted: '1 week ago',
      requirements: ['Python', 'JavaScript', 'Problem Solving']
    },
    {
      id: 3,
      title: 'UX Design Assistant',
      company: 'Creative Agency',
      location: 'New York, NY',
      type: 'Part-time',
      salary: '$35,000 - $45,000',
      match: 76,
      posted: '3 days ago',
      requirements: ['Figma', 'User Research', 'Prototyping']
    }
  ]

  const learningPaths = [
    {
      id: 1,
      title: 'Full-Stack Web Development',
      description: 'Complete path from frontend to backend development',
      duration: '6 months',
      level: 'Beginner to Intermediate',
      modules: 12,
      skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases'],
      progress: 35
    },
    {
      id: 2,
      title: 'Data Science Fundamentals',
      description: 'Learn data analysis, visualization, and machine learning',
      duration: '4 months',
      level: 'Beginner',
      modules: 8,
      skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn'],
      progress: 0
    },
    {
      id: 3,
      title: 'UI/UX Design Mastery',
      description: 'Master user interface and experience design principles',
      duration: '3 months',
      level: 'Beginner to Advanced',
      modules: 6,
      skills: ['Design Thinking', 'Figma', 'User Research', 'Prototyping'],
      progress: 15
    }
  ]

  return (
    <div className="career-page">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification ${notification.type}`}>
              <span>{notification.message}</span>
              <button
                className="notification-close"
                onClick={() => dismissNotification(notification.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Skill Test Modal */}
      {showSkillTest && (
        <div className="skill-test-modal">
          <div className="skill-test-content">
            <h3>Skill Assessment: {showSkillTest}</h3>
            <p>Complete this quick assessment to improve your {showSkillTest} skill level.</p>
            <div className="skill-test-actions">
              <button
                className="action-btn primary"
                onClick={() => completeSkillTest(showSkillTest)}
              >
                Complete Test
              </button>
              <button
                className="action-btn secondary"
                onClick={() => setShowSkillTest(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Career Guidance</h1>
          <p className="page-subtitle">Explore career paths and accelerate your professional growth</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="career-tabs">
        <button
          className={`career-tab ${selectedTab === 'paths' ? 'active' : ''}`}
          onClick={() => setSelectedTab('paths')}
        >
          <Target size={16} />
          Career Paths
        </button>
        <button
          className={`career-tab ${selectedTab === 'skills' ? 'active' : ''}`}
          onClick={() => setSelectedTab('skills')}
        >
          <TrendingUp size={16} />
          Skill Assessment
        </button>
        <button
          className={`career-tab ${selectedTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setSelectedTab('jobs')}
        >
          <Briefcase size={16} />
          Job Market
        </button>
        <button
          className={`career-tab ${selectedTab === 'learning' ? 'active' : ''}`}
          onClick={() => setSelectedTab('learning')}
        >
          <BookOpen size={16} />
          Learning Paths
        </button>
      </div>

      {/* Tab Content */}
      <div className="career-content">
        {selectedTab === 'paths' && (
          <div className="career-paths">
            <div className="section-header">
              <h2>Recommended Career Paths</h2>
              <p>Based on your skills and interests</p>
            </div>
            <div className="paths-grid">
              {careerPaths.map((path) => (
                <div key={path.id} className="career-path-card">
                  <div className="path-header">
                    <div className="path-title">
                      <h3>{path.title}</h3>
                      <div className="match-score">
                        <Star size={16} fill="currentColor" />
                        {path.match}% match
                      </div>
                    </div>
                    <p className="path-description">{path.description}</p>
                  </div>

                  <div className="path-details">
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span>{path.salary}</span>
                    </div>
                    <div className="detail-item">
                      <TrendingUp size={16} />
                      <span>{path.growth} growth</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>{path.experience}</span>
                    </div>
                  </div>

                  <div className="path-skills">
                    <h4>Required Skills:</h4>
                    <div className="skills-tags">
                      {path.skills.map((skill) => (
                        <span key={skill} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="path-companies">
                    <h4>Top Companies:</h4>
                    <div className="companies-list">
                      {path.companies.slice(0, 3).map((company) => (
                        <span key={company} className="company-name">{company}</span>
                      ))}
                      {path.companies.length > 3 && <span className="more-companies">+{path.companies.length - 3} more</span>}
                    </div>
                  </div>

                  <button className="explore-btn">
                    Explore Path <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'skills' && (
          <div className="skill-assessment">
            <div className="section-header">
              <h2>Skill Assessment</h2>
              <p>Track your progress and identify areas for improvement</p>
            </div>
            <div className="skills-categories">
              {skillAssessments.map((category) => (
                <div key={category.category} className="skill-category">
                  <h3 className="category-title">{category.category}</h3>
                  <div className="skills-list">
                    {category.skills.map((skill) => {
                      const currentLevel = skillLevels[skill.name] || skill.level
                      return (
                        <div key={skill.name} className="skill-item">
                          <div className="skill-info">
                            <span className="skill-name">{skill.name}</span>
                            <div className="skill-meta">
                              <span className="skill-level">{currentLevel}%</span>
                              <span className={`skill-trend ${skill.trend}`}>
                                {skill.trend === 'up' ? '↗' : skill.trend === 'down' ? '↘' : '→'}
                              </span>
                              <button
                                className="skill-test-btn"
                                onClick={() => handleSkillTest(skill.name)}
                                title="Take skill test"
                              >
                                Test
                              </button>
                            </div>
                          </div>
                          <div className="skill-progress">
                            <div
                              className="skill-progress-fill"
                              style={{ width: `${currentLevel}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="assessment-actions">
              <button
                className="action-btn primary"
                onClick={() => {
                  setNotifications(prev => [...prev, {
                    id: Date.now(),
                    message: 'Full assessment feature coming soon!',
                    type: 'info'
                  }])
                }}
              >
                Take Full Assessment
              </button>
              <button
                className="action-btn secondary"
                onClick={() => {
                  setNotifications(prev => [...prev, {
                    id: Date.now(),
                    message: 'Skill recommendations generated based on your current levels!',
                    type: 'info'
                  }])
                }}
              >
                View Recommendations
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'jobs' && (
          <div className="job-market">
            <div className="section-header">
              <h2>Job Recommendations</h2>
              <p>Opportunities that match your profile</p>
            </div>
            <div className="jobs-list">
              {jobRecommendations.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div className="job-title-section">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-company">{job.company}</div>
                    </div>
                    <div className="job-match">
                      <Star size={16} fill="currentColor" />
                      {job.match}% match
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="job-detail">
                      <MapPin size={14} />
                      <span>{job.location}</span>
                    </div>
                    <div className="job-detail">
                      <Clock size={14} />
                      <span>{job.type}</span>
                    </div>
                    <div className="job-detail">
                      <DollarSign size={14} />
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  <div className="job-requirements">
                    <h4>Requirements:</h4>
                    <div className="requirements-tags">
                      {job.requirements.map((req) => (
                        <span key={req} className="requirement-tag">{req}</span>
                      ))}
                    </div>
                  </div>

                  <div className="job-footer">
                    <span className="job-posted">Posted {job.posted}</span>
                    <button
                      className={`apply-btn ${appliedJobs.has(job.id) ? 'applied' : ''}`}
                      onClick={() => handleApplyJob(job.id)}
                      disabled={appliedJobs.has(job.id)}
                    >
                      {appliedJobs.has(job.id) ? 'Applied ✓' : 'Apply Now'}
                      {!appliedJobs.has(job.id) && <ExternalLink size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'learning' && (
          <div className="learning-paths">
            <div className="section-header">
              <h2>Learning Paths</h2>
              <p>Structured courses to advance your career</p>
            </div>
            <div className="learning-grid">
              {learningPaths.map((path) => (
                <div key={path.id} className="learning-path-card">
                  <div className="learning-header">
                    <h3 className="learning-title">{path.title}</h3>
                    <p className="learning-description">{path.description}</p>
                  </div>

                  <div className="learning-meta">
                    <div className="meta-item">
                      <Clock size={16} />
                      <span>{path.duration}</span>
                    </div>
                    <div className="meta-item">
                      <Award size={16} />
                      <span>{path.level}</span>
                    </div>
                    <div className="meta-item">
                      <BookOpen size={16} />
                      <span>{path.modules} modules</span>
                    </div>
                  </div>

                  <div className="learning-skills">
                    <h4>You'll learn:</h4>
                    <div className="learning-skills-tags">
                      {path.skills.map((skill) => (
                        <span key={skill} className="learning-skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="learning-progress">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{path.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${path.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    className={`start-btn ${path.progress > 0 ? 'continue' : 'start'} ${enrolledPaths.has(path.id) ? 'enrolled' : ''}`}
                    onClick={() => handleEnrollPath(path.id)}
                    disabled={enrolledPaths.has(path.id)}
                  >
                    {enrolledPaths.has(path.id) ? 'Enrolled ✓' :
                     path.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Career
