import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import learningAnimation from '../../assets/animations/learningAnimation.json';
import './Landing.css';
import { FaBookOpen } from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
          <h1 className='landing-logo'>
          {/* <FaBookOpen />  */}
          </h1>
        <h1 className="landing-title">
           LearnSYNC</h1>
        <Link to="/auth" className="btn btn-primary">Login / Sign Up</Link>
      </header>
      <main>
        <section className="hero-section">
          <div className="hero-content">
       <div className="hero-heading">
  <h2>Welcome to</h2>
  <h1 className="hero-title">LearnSync</h1>
</div>

            <p>Your all-in-one platform for personalized learning, mentorship, and career development.</p>
            <Link to="/auth" className="btn btn-secondary">Get Started</Link>
          </div>
          <div className="hero-animation">
            <Player
              autoplay
              loop
              src={learningAnimation}
              style={{ height: 400, width: 400 }}
            />
          </div>
        </section>
        <section className="features-section">
          <h3>Our Core Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>AI Assistant</h4>
              <p>Overcome learning obstacles with 24/7 support from our advanced AI. Get instant, personalized answers and guidance on your study materials, ensuring you're never stuck on a concept again.</p>
            </div>
            <div className="feature-card">
              <h4>Personalized Mentorship</h4>
              <p>Connect with a network of experienced mentors dedicated to your academic and career growth. Get one-on-one guidance, industry insights, and support to navigate your educational path and prepare for your future career.</p>
            </div>
            <div className="feature-card">
              <h4>Mock Tests & Progress Tracking</h4>
              <p>Simulate real exam conditions and track your performance with our comprehensive analytics tools. Identify your strengths and weaknesses, and receive data-driven insights to focus your study efforts effectively.</p>
            </div>
            <div className="feature-card">
              <h4>Study Planner</h4>
              <p>Efficiently organize your study sessions, set goals, and manage your academic timeline. Our intuitive planner helps you build a structured routine, ensuring you cover all necessary topics and stay on track for success.</p>
            </div>
          </div>
        </section>

        <section className="features-section">
          <h3>Why Choose PLM?</h3>
          <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto', fontSize: '1.1em', color: '#ccc'}}>PLM is more than just a study tool; it's a comprehensive ecosystem designed for your success. We integrate cutting-edge technology with human-centric support to deliver a learning experience that is both effective and empowering.</p>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Holistic Development</h4>
              <p>We focus on both academic knowledge and practical skills to prepare you for real-world challenges and long-term career success.</p>
            </div>
            <div className="feature-card">
              <h4>Community & Collaboration</h4>
              <p>Join a vibrant community of learners and mentors. Collaborate on projects, share knowledge, and build a network that will support you throughout your journey.</p>
            </div>
            <div className="feature-card">
              <h4>Career-Oriented Learning</h4>
              <p>Our platform is designed to bridge the gap between education and employment, with features focused on career planning, skill-building, and job readiness.</p>
            </div>
          </div>
        </section>

        <section className="hero-section">
            <h2>Ready to Unlock Your Potential?</h2>
            <p>Join PLM today and take the first step towards a brighter academic and professional future.</p>
            <Link to="/auth" className="btn btn-secondary">Join Now</Link>
        </section>
      </main>
      <footer className="landing-footer">
        <p>&copy; 2024 PLM. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
