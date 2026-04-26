import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Clock, Target, ChevronDown, Award } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import './MentorProgress.css';

const MentorProgress = () => {
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
  const [progressData, setProgressData] = useState(null);
  
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);

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

  useEffect(() => {
    const fetchProgress = async () => {
      if (!selectedStudentId) return;
      
      try {
        setLoadingProgress(true);
        const data = await mentorApi.getStudentProgress(selectedStudentId);
        setProgressData(data);
      } catch (error) {
        // Handle gracefully if no progress found
        addNotification('Failed to load progress data', 'error');
        setProgressData(null);
      } finally {
        setLoadingProgress(false);
      }
    };
    
    fetchProgress();
  }, [selectedStudentId]);

  return (
    <div className="mentor-progress-container">
      <div className="mentor-page-header flex-header">
        <div>
          <h1>
            <TrendingUp size={28} style={{ color: '#3b82f6' }} /> Student Progress
          </h1>
          <p>Track academic performance and test scores.</p>
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
                onChange={(e) => setSelectedStudentId(e.target.value)}
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
          <Target size={48} />
          <p>Select a student to view their progress.</p>
        </div>
      ) : loadingProgress ? (
        <div className="loading-state">Loading progress data...</div>
      ) : !progressData ? (
        <div className="empty-state-large">
          <p>No progress data available for this student.</p>
        </div>
      ) : (
        <div className="progress-content">
          {/* Top Stats */}
          <div className="progress-stats-grid">
            <div className="section-card stat-card-horizontal">
              <div className="stat-icon-wrap blue">
                <Clock size={32} />
              </div>
              <div>
                <p className="stat-label">Total Study Hours</p>
                <h2 className="stat-value">{progressData.study_hours} <span className="stat-unit">hrs</span></h2>
              </div>
            </div>
            
            <div className="section-card stat-card-horizontal">
              <div className="stat-icon-wrap purple">
                <Award size={32} />
              </div>
              <div>
                <p className="stat-label">Tests Completed</p>
                <h2 className="stat-value">{progressData.recent_tests?.length || 0}</h2>
              </div>
            </div>
          </div>

          {/* Test Scores */}
          <div className="section-card">
            <div className="section-header">
              <h2>
                <Target size={20} style={{ color: '#3b82f6' }} /> Recent Mock Tests
              </h2>
            </div>
            <div className="table-container">
              {!progressData.recent_tests || progressData.recent_tests.length === 0 ? (
                <div className="empty-state">No mock test data available yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th className="text-center">Score</th>
                        <th>Percentage</th>
                        <th className="text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressData.recent_tests.map((test, idx) => {
                        const percentage = (test.score / test.total_score) * 100;
                        let colorClass = 'red';
                        if (percentage >= 80) colorClass = 'green';
                        else if (percentage >= 50) colorClass = 'yellow';

                        return (
                          <tr key={idx}>
                            <td className="font-medium text-white">{test.subject}</td>
                            <td className="text-center">
                              <span className="score-badge">
                                {test.score} / {test.total_score}
                              </span>
                            </td>
                            <td>
                              <div className="progress-bar-cell">
                                <span className={`progress-text ${colorClass}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                                <div className="progress-bar-bg">
                                  <div 
                                    className={`progress-bar-fill ${colorClass}`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="text-right text-gray text-sm">
                              {new Date(test.completed_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorProgress;
