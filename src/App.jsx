import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './global.css'
import './App.css'
import Layout from './components/ui/Layout'
import { NotificationProvider } from './components/ui/NotificationSystem'
import { UserProvider } from './contexts/UserContext'
import { CategoryProvider } from './contexts/CategoryContext'
import Dashboard from './pages/Dashboard'
import MyMaterials from './pages/MyMaterials'
import StudyPlanner from './pages/StudyPlanner'
import ProgressTracker from './pages/ProgressTracker'
import MockTests from './pages/MockTests'
import Mentorship from './pages/Mentorship'
import Chat from './pages/Chat'
import Career from './pages/Career'
import AIAssistant from './pages/AIAssistant'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import LandingPage from './pages/Landing'
import VideoCall from './pages/VideoCall'
import { isUserLoggedIn } from './utils/auth'

// Mentor Panel Pages
import MentorDashboard from './pages/Mentor/Dashboard'
import ReloadPrompt from './components/ui/ReloadPrompt'
import MentorStudents from './pages/Mentor/Students'
import MentorSessions from './pages/Mentor/Sessions'
import MentorProgress from './pages/Mentor/Progress'
import MentorAiInsights from './pages/Mentor/AiInsights'
import MentorProfile from './pages/Mentor/Profile'

function App() {
  const [loggedIn, setLoggedIn] = useState(isUserLoggedIn())

  useEffect(() => {
    const interval = setInterval(() => {
      const sessionStatus = isUserLoggedIn()
      if (sessionStatus !== loggedIn) {
        setLoggedIn(sessionStatus)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [loggedIn])

  return (
    <div className="app">
      <CategoryProvider>
      <NotificationProvider>
        <UserProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={loggedIn ? <Navigate to="/dashboard" /> : <Auth />} />
              <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                loggedIn ? (
                  <Layout key={loggedIn}>
                    <Dashboard />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/dashboard" element={
              <Layout key={loggedIn}>
                <Dashboard />
              </Layout>
            } />
            <Route path="/my-materials" element={
              <Layout key={loggedIn}>
                <MyMaterials />
              </Layout>
            } />
            <Route path="/courses" element={<Navigate to="/my-materials" replace />} />
            <Route path="/planner" element={
              <Layout key={loggedIn}>
                <StudyPlanner />
              </Layout>
            } />
            <Route path="/progress" element={
              <Layout key={loggedIn}>
                <ProgressTracker />
              </Layout>
            } />
            <Route path="/tests" element={
              <Layout key={loggedIn}>
                <MockTests />
              </Layout>
            } />
            <Route path="/mentorship" element={
              <Layout key={loggedIn}>
                <Mentorship />
              </Layout>
            } />
            <Route path="/chat" element={
              <Layout key={loggedIn}>
                <Chat />
              </Layout>
            } />
            <Route path="/career" element={
              <Layout key={loggedIn}>
                <Career />
              </Layout>
            } />
            <Route path="/ai-assistant" element={
              <Layout key={loggedIn}>
                <AIAssistant />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout key={loggedIn}>
                <Settings />
              </Layout>
            } />
             <Route path="/session/:sessionId" element={<VideoCall />} />
             <Route path="/call/:callId" element={<VideoCall />} />

             {/* Mentor Routes */}
             <Route path="/mentor/dashboard" element={
               <Layout key={loggedIn}>
                 <MentorDashboard />
               </Layout>
             } />
             <Route path="/mentor/students" element={
               <Layout key={loggedIn}>
                 <MentorStudents />
               </Layout>
             } />
             <Route path="/mentor/sessions" element={
               <Layout key={loggedIn}>
                 <MentorSessions />
               </Layout>
             } />
             <Route path="/mentor/progress" element={
               <Layout key={loggedIn}>
                 <MentorProgress />
               </Layout>
             } />
             <Route path="/mentor/ai-insights" element={
               <Layout key={loggedIn}>
                 <MentorAiInsights />
               </Layout>
             } />
             <Route path="/mentor/profile" element={
               <Layout key={loggedIn}>
                 <MentorProfile />
               </Layout>
             } />
            </Routes>
            <ReloadPrompt />
          </Router>
        </UserProvider>
      </NotificationProvider>
      </CategoryProvider>
    </div>
  )
}

export default App
