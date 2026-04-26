import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Sparkles, ChevronDown, User, Activity } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import './AiInsights.css';

const MentorAiInsights = () => {
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
  const [insights, setInsights] = useState(null);
  
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const data = await mentorApi.getStudents();
        const activeStudents = (data.students || []).filter(s => s.status === 'confirmed');
        setStudents(activeStudents);
        
        if (!selectedStudentId && activeStudents.length > 0) {
          setSelectedStudentId(activeStudents[0].student_id.toString());
        }
      } catch (error) {
        addNotification('Failed to load students', 'error');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleGenerateInsights = async () => {
    if (!selectedStudentId) return;
    
    try {
      setGenerating(true);
      const data = await mentorApi.getAiInsights(selectedStudentId);
      setInsights(data.insights);
      addNotification('AI Insights generated successfully!', 'success');
    } catch (error) {
      addNotification('Failed to generate insights', 'error');
      setInsights(null);
    } finally {
      setGenerating(false);
    }
  };

  const selectedStudent = students.find(s => s.student_id.toString() === selectedStudentId);

  return (
    <div className="mentor-ai-container">
      <div className="mentor-page-header flex-header">
        <div>
          <h1>
            <Bot size={28} style={{ color: '#a855f7' }} /> AI Insights
          </h1>
          <p>Generate AI-driven study plans based on test performance.</p>
        </div>
        
        <div className="student-selector">
          {loadingStudents ? (
            <div className="selector-message">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="selector-message">No active students</div>
          ) : (
            <div className="select-wrapper">
              <select
                className="custom-select"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setInsights(null);
                }}
              >
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-icon" size={20} />
            </div>
          )}
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="empty-state-large">
          <User size={48} />
          <p>Select a student to generate AI insights.</p>
        </div>
      ) : (
        <div className="ai-content-grid">
          
          {/* Action Card */}
          <div className="ai-action-sidebar">
            <div className="section-card action-card-inner">
              <div className="action-icon-wrap">
                <Sparkles size={36} color="#a855f7" />
              </div>
              
              <h2 className="action-title">Generate Study Plan</h2>
              <p className="action-desc">
                Our AI model will analyze {selectedStudent?.first_name}'s recent test scores and study hours to provide actionable recommendations and identify weak areas.
              </p>
              
              <button 
                onClick={handleGenerateInsights}
                disabled={generating}
                className="btn btn-primary btn-generate"
              >
                {generating ? (
                  <>
                    <Activity className="spinner-icon" size={20} />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Bot size={20} />
                    Generate Insights
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Insights Display */}
          <div className="ai-insights-main">
            <div className="section-card insights-card">
              <div className="section-header insights-header">
                <h2><Sparkles size={20} color="#a855f7" /> AI Recommendations</h2>
              </div>
              
              <div className="insights-body">
                {!insights && !generating ? (
                  <div className="insights-empty">
                    <Bot size={64} />
                    <p>Click "Generate Insights" to see the AI analysis.</p>
                  </div>
                ) : generating ? (
                  <div className="insights-loading">
                    <div className="loading-spinner"></div>
                    <p>Hugging Face model is processing...</p>
                  </div>
                ) : (
                  <div className="insights-content fade-in">
                    <div className="markdown-content">
                      {insights}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default MentorAiInsights;
