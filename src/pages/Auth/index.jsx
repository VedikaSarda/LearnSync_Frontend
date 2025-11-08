import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Phone,
  Brain,
  Target,
  Users,
  Award,
  Zap
} from 'lucide-react'
import { loginUser, registerUser, validatePassword, validateEmail, getDemoCredentials } from '../../utils/auth'
import { saveUserProfile } from '../../utils/localStorage'
import { learningAnimation, graduationAnimation, targetAnimation, pulseAnimation } from '../../utils/lottieAnimations'
import './styles.css'

const Auth = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname === '/login'
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    field_of_study: '',
    education_level: '',
    phone: '',
    bio: '',
    agreeToTerms: false
  })
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when switching between login/register
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      field_of_study: '',
      education_level: '',
      phone: '',
      bio: '',
      agreeToTerms: false
    })
    setErrors({})
    setSuccessMessage('')
  }, [location.pathname])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!isLogin) {
      // Use comprehensive password validation for registration
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0] // Show first error
      }
    } else if (formData.password.length < 6) {
      // Simpler validation for login
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Register-specific validations
    if (!isLogin) {
      if (!formData.first_name) {
        newErrors.first_name = 'First name is required'
      } else if (formData.first_name.length < 2) {
        newErrors.first_name = 'First name must be at least 2 characters'
      } else if (!/^[a-zA-Z\s]+$/.test(formData.first_name)) {
        newErrors.first_name = 'First name can only contain letters and spaces'
      }

      if (!formData.last_name) {
        newErrors.last_name = 'Last name is required'
      } else if (formData.last_name.length < 2) {
        newErrors.last_name = 'Last name must be at least 2 characters'
      } else if (!/^[a-zA-Z\s]+$/.test(formData.last_name)) {
        newErrors.last_name = 'Last name can only contain letters and spaces'
      }

      if (!formData.field_of_study) {
        newErrors.field_of_study = 'Field of study is required'
      }

      if (!formData.education_level) {
        newErrors.education_level = 'Education level is required'
      }

      // Optional phone validation
      if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        // Handle login
        const result = await loginUser(formData.email, formData.password, formData.rememberMe || false)

        if (result.success) {
          saveUserProfile(result.user)
          console.log('Login successful, user:', result.user)
          setSuccessMessage('Login successful! Redirecting...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        } else {
          setErrors({
            submit: result.error
          })
        }
      } else {
        // Handle registration
        const result = await registerUser({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          field_of_study: formData.field_of_study,
          education_level: formData.education_level,
          phone: formData.phone,
          bio: formData.bio
        })

        if (result.success) {
          setSuccessMessage('Account created successfully! Please log in.')
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          setErrors({
            submit: result.error
          })
        }
      }
    } catch (error) {
      setErrors({
        submit: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const switchAuthMode = () => {
    navigate(isLogin ? '/register' : '/login')
  }

  const handleDemoLogin = async () => {
    if (!isLogin) return

    const demoCredentials = getDemoCredentials()
    setFormData(prev => ({
      ...prev,
      email: demoCredentials.email,
      password: demoCredentials.password
    }))

    setIsLoading(true)
    setErrors({})

    try {
      const result = await loginUser(demoCredentials.email, demoCredentials.password, false)

      if (result.success) {
        saveUserProfile(result.user)
        setSuccessMessage('Demo login successful! Redirecting...')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setErrors({
          submit: result.error
        })
      }
    } catch (error) {
      setErrors({
        submit: 'Demo login failed. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="authentication-page">
      {/* Left Side - Animation Section */}
      <div className="authentication-animation-section">
        <div className="authentication-bg-elements">
          <div className="authentication-bg-circle"></div>
          <div className="authentication-bg-circle"></div>
          <div className="authentication-bg-circle"></div>
        </div>

        <div className="authentication-animation-content">
          {/* Main Lottie Animation */}

          <h1 className="authentication-brand-title">
            LearnSync 
          </h1>

          <p className="authentication-brand-subtitle">
            {isLogin
              ? "Welcome back! Continue your learning journey with personalized study materials and expert guidance."
              : "Join thousands of students advancing their careers with our comprehensive learning platform."
            }
          </p>

          <div className="authentication-features">
            <div className="authentication-feature">
              <div className="authentication-feature-icon">
                <Lottie
                  animationData={pulseAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <div className="authentication-feature-text">
                <h3 className="authentication-feature-title">Smart Learning</h3>
                <p className="authentication-feature-desc">AI-powered personalized study paths</p>
              </div>
            </div>

            <div className="authentication-feature">
              <div className="authentication-feature-icon">
                <Lottie
                  animationData={targetAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: 40, height: 40 }}
                />
              </div>
              <div className="authentication-feature-text">
                <h3 className="authentication-feature-title">Goal Tracking</h3>
                <p className="authentication-feature-desc">Monitor progress and achievements</p>
              </div>
            </div>

            <div className="authentication-feature">
              <div className="authentication-feature-icon">
                <Users size={20} />
              </div>
              <div className="authentication-feature-text">
                <h3 className="authentication-feature-title">Community</h3>
                <p className="authentication-feature-desc">Connect with fellow learners</p>
              </div>
            </div>

            <div className="authentication-feature">
              <div className="authentication-feature-icon">
                <Award size={20} />
              </div>
              <div className="authentication-feature-text">
                <h3 className="authentication-feature-title">Keep it</h3>
                <p className="authentication-feature-desc">Eay Notes Access By Storing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="authentication-form-section-container">
        <div className={`authentication-wrapper ${!isLogin ? 'register-mode' : ''}`}>
          {/* Main auth card */}
          <div className="authentication-card">
          {/* Header */}
          <div className="authentication-header">
            <div className="authentication-logo">
              <div className="authentication-logo-icon">
                {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
              </div>
              <h1 className="authentication-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="authentication-subtitle">
                {isLogin
                  ? 'Sign in to continue your learning journey'
                  : 'Join thousands of students advancing their careers'
                }
              </p>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="authentication-message success">
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error message */}
          {errors.submit && (
            <div className="authentication-message error">
              <AlertCircle size={20} />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Auth form */}
          <form className="authentication-form" onSubmit={handleSubmit}>
            {/* Register-only fields */}
            {!isLogin && (
              <>
                {/* Personal Information Section */}
                <div className="authentication-form-section">
                  <h3 className="authentication-section-title">Personal Information</h3>
                </div>

                <div className="authentication-form-grid">
                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="first_name">First Name</label>
                    <div className="authentication-input-wrapper">
                      <User className="authentication-input-icon" size={20} />
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.first_name ? 'error' : ''}`}
                        placeholder="Enter your first name"
                        aria-describedby={errors.first_name ? 'first_name-error' : undefined}
                      />
                    </div>
                    {errors.first_name && (
                      <span id="first_name-error" className="authentication-error-text">{errors.first_name}</span>
                    )}
                  </div>

                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="last_name">Last Name</label>
                    <div className="authentication-input-wrapper">
                      <User className="authentication-input-icon" size={20} />
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.last_name ? 'error' : ''}`}
                        placeholder="Enter your last name"
                        aria-describedby={errors.last_name ? 'last_name-error' : undefined}
                      />
                    </div>
                    {errors.last_name && (
                      <span id="last_name-error" className="authentication-error-text">{errors.last_name}</span>
                    )}
                  </div>

                  {/* Email field in registration grid */}
                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="regEmail">Email Address</label>
                    <div className="authentication-input-wrapper">
                      <Mail className="authentication-input-icon" size={20} />
                      <input
                        type="email"
                        id="regEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.email ? 'error' : ''}`}
                        placeholder="Enter your email address"
                        aria-describedby={errors.email ? 'regEmail-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <span id="regEmail-error" className="authentication-error-text">{errors.email}</span>
                    )}
                  </div>

                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="phone">Phone Number (Optional)</label>
                    <div className="authentication-input-wrapper">
                      <Phone className="authentication-input-icon" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.phone ? 'error' : ''}`}
                        placeholder="Enter your phone number"
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    </div>
                    {errors.phone && (
                      <span id="phone-error" className="authentication-error-text">{errors.phone}</span>
                    )}
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="authentication-form-section">
                  <h3 className="authentication-section-title">Academic Information</h3>
                </div>

                <div className="authentication-form-grid">
                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="field_of_study">Field of Study</label>
                    <div className="authentication-input-wrapper">
                      <BookOpen className="authentication-input-icon" size={20} />
                      <select
                        id="field_of_study"
                        name="field_of_study"
                        value={formData.field_of_study}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.field_of_study ? 'error' : ''}`}
                        aria-describedby={errors.field_of_study ? 'field_of_study-error' : undefined}
                      >
                        <option value="">Select your field of study</option>
                        <option value="medicine">Medicine</option>
                        <option value="nursing">Nursing</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="dentistry">Dentistry</option>
                        <option value="engineering">Engineering</option>
                        <option value="computer-science">Computer Science</option>
                        <option value="business">Business</option>
                        <option value="law">Law</option>
                        <option value="education">Education</option>
                        <option value="psychology">Psychology</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {errors.field_of_study && (
                      <span id="field_of_study-error" className="authentication-error-text">{errors.field_of_study}</span>
                    )}
                  </div>

                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="education_level">Education Level</label>
                    <div className="authentication-input-wrapper">
                      <GraduationCap className="authentication-input-icon" size={20} />
                      <select
                        id="education_level"
                        name="education_level"
                        value={formData.education_level}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.education_level ? 'error' : ''}`}
                        aria-describedby={errors.education_level ? 'education_level-error' : undefined}
                      >
                        <option value="">Select your education level</option>
                        <option value="high-school">High School</option>
                        <option value="undergraduate">Undergraduate</option>
                        <option value="graduate">Graduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="doctorate">Doctorate</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    {errors.education_level && (
                      <span id="education_level-error" className="authentication-error-text">{errors.education_level}</span>
                    )}
                  </div>
                </div>

                {/* Bio field - full width */}
                <div className="authentication-form-group">
                  <label className="authentication-form-label" htmlFor="bio">About You (Optional)</label>
                  <div className="authentication-input-wrapper">
                    <User className="authentication-input-icon" size={20} />
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="authentication-form-input authentication-form-textarea"
                      placeholder="Tell us a bit about yourself and your learning goals..."
                      rows="2"
                      maxLength="300"
                    />
                  </div>
                  <div className="authentication-form-note">
                    {formData.bio.length}/300 characters
                  </div>
                </div>

                {/* Password fields in grid */}
                <div className="authentication-form-grid">
                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="regPassword">Password</label>
                    <div className="authentication-input-wrapper">
                      <Lock className="authentication-input-icon" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="regPassword"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.password ? 'error' : ''}`}
                        placeholder="Enter your password"
                        aria-describedby={errors.password ? 'regPassword-error' : undefined}
                      />
                      <button
                        type="button"
                        className="authentication-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span id="regPassword-error" className="authentication-error-text">{errors.password}</span>
                    )}
                  </div>

                  <div className="authentication-form-group">
                    <label className="authentication-form-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="authentication-input-wrapper">
                      <Lock className="authentication-input-icon" size={20} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`authentication-form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm your password"
                        aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      />
                      <button
                        type="button"
                        className="authentication-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span id="confirmPassword-error" className="authentication-error-text">{errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="authentication-form-group">
                  <label className="authentication-checkbox-container">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className={`authentication-checkbox-input ${errors.agreeToTerms ? 'error' : ''}`}
                    />
                    <span className="authentication-checkbox-checkmark"></span>
                    <span className="authentication-checkbox-label">
                      I agree to the <a href="#" className="authentication-link">Terms of Service</a> and{' '}
                      <a href="#" className="authentication-link">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <span className="authentication-error-text">{errors.agreeToTerms}</span>
                  )}
                </div>
              </>
            )}

            {/* Login form fields */}
            {isLogin && (
              <>
                {/* Email field */}
                <div className="authentication-form-group">
                  <label className="authentication-form-label" htmlFor="email">Email Address</label>
                  <div className="authentication-input-wrapper">
                    <Mail className="authentication-input-icon" size={20} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`authentication-form-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter your email address"
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <span id="email-error" className="authentication-error-text">{errors.email}</span>
                  )}
                </div>

                {/* Password field */}
                <div className="authentication-form-group">
                  <label className="authentication-form-label" htmlFor="password">Password</label>
                  <div className="authentication-input-wrapper">
                    <Lock className="authentication-input-icon" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`authentication-form-input ${errors.password ? 'error' : ''}`}
                      placeholder="Enter your password"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="authentication-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span id="password-error" className="authentication-error-text">{errors.password}</span>
                  )}
                </div>
              </>
            )}



            {/* Submit button */}
            <button
              type="submit"
              className={`authentication-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="authentication-loading-spinner"></div>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>

            {/* Demo login button (only on login page) */}
            {isLogin && (
              <button
                type="button"
                className="authentication-demo-btn"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                <User size={20} />
                <span>Try Demo Account</span>
              </button>
            )}
          </form>

          {/* Auth mode switch */}
          <div className="authentication-switch">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                className="authentication-switch-btn"
                onClick={switchAuthMode}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Back to app link */}
          <div className="authentication-back">
            <button
              type="button"
              className="authentication-back-btn"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Auth
