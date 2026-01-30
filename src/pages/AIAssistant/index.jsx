import { Bot, Send, Lightbulb, BookOpen, Target, Clock, Brain, Calculator, FileText, Zap, Sparkles } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './styles.css'

const AIAssistant = () => {
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI learning assistant powered by Google Gemini. I can help you with study planning, concept explanations, practice problems, and performance analysis. What would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        { icon: BookOpen, text: "Explain a concept", action: "explain" },
        { icon: Target, text: "Practice problems", action: "practice" },
        { icon: Clock, text: "Study planning", action: "plan" },
        { icon: Brain, text: "Learning tips", action: "tips" }
      ]
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('general')
  const [chatHistory, setChatHistory] = useState([])
  const messagesEndRef = useRef(null)

  const subjects = [
    { id: 'general', name: 'General', icon: '🤖' },
    { id: 'math', name: 'Mathematics', icon: '📐' },
    { id: 'physics', name: 'Physics', icon: '⚛️' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
    { id: 'biology', name: 'Biology', icon: '🧬' },
    { id: 'computer-science', name: 'Computer Science', icon: '💻' }
  ]

  const aiResponses = {
    general: [
      "I'd be happy to help you with that! Could you provide more specific details about what you're studying?",
      "That's a great question! Let me break this down for you step by step.",
      "I can definitely assist with that. What specific aspect would you like to focus on?",
      "Excellent! Let's explore this topic together. What's your current understanding level?"
    ],
    math: [
      "Mathematics is all about patterns and logical thinking. Let me help you understand this concept better.",
      "Great math question! Let's solve this step by step using proven methods.",
      "I love helping with math! This concept becomes much clearer when we break it down systematically.",
      "Math can be challenging, but with the right approach, it becomes much more manageable. Let me guide you."
    ],
    physics: [
      "Physics helps us understand how the universe works! Let me explain this phenomenon clearly.",
      "That's a fascinating physics concept! Let's explore the underlying principles together.",
      "Physics problems often seem complex, but they follow logical patterns. Let me show you the approach.",
      "Great physics question! Understanding the theory first will make the problem-solving much easier."
    ],
    chemistry: [
      "Chemistry is like cooking with atoms! Let me help you understand these reactions and processes.",
      "That's an interesting chemistry topic! Let's explore the molecular interactions involved.",
      "Chemistry concepts become clearer when we visualize what's happening at the atomic level.",
      "Excellent chemistry question! Let me break down the chemical principles for you."
    ],
    biology: [
      "Biology is the study of life itself! Let me help you understand these biological processes.",
      "That's a great biology question! Life sciences are full of amazing interconnected systems.",
      "Biology concepts often involve complex interactions. Let me simplify this for you.",
      "Fascinating biological topic! Let's explore how living systems work together."
    ],
    'computer-science': [
      "Computer science combines logic and creativity! Let me help you understand this programming concept.",
      "That's a great CS question! Let's break down this algorithm or data structure step by step.",
      "Programming can be challenging, but with practice and good explanations, it becomes intuitive.",
      "Excellent computer science topic! Let me explain the underlying principles and best practices."
    ]
  }

  const quickActions = [
    { icon: Calculator, text: "Solve a problem", prompt: "I need help solving this problem: " },
    { icon: FileText, text: "Explain a concept", prompt: "Can you explain this concept: " },
    { icon: Lightbulb, text: "Study tips", prompt: "Give me study tips for: " },
    { icon: Target, text: "Practice questions", prompt: "Generate practice questions for: " },
    { icon: Clock, text: "Create study plan", prompt: "Help me create a study plan for: " },
    { icon: Zap, text: "Quick review", prompt: "Give me a quick review of: " }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

 const handleSendMessage = async () => {
  if (!newMessage.trim()) return;

  const userMessageObj = {
    id: Date.now(),
    text: newMessage,
    sender: 'user',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  setMessages(prev => [...prev, userMessageObj]);
  const currentMessage = newMessage;
  setNewMessage('');
  setIsTyping(true);

  try {

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        message: currentMessage,
        subject: selectedSubject,
        provider: "openai" // or gemini
      })
    });

    if (!res.ok) throw new Error("AI server error");

    const data = await res.json();

    const aiMessage = {
      id: Date.now() + 1,
      text: data.reply,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: generateSuggestions(currentMessage)
    };

    setMessages(prev => [...prev, aiMessage]);

  } catch (error) {

    const errorMessage = {
      id: Date.now() + 1,
      text: "⚠️ AI server not reachable. Check backend.",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};


  const generateSuggestions = (userMessage) => {
    const message = userMessage.toLowerCase()

    if (message.includes('math') || message.includes('calculus') || message.includes('algebra')) {
      return [
        { icon: Calculator, text: "Show me examples", action: "examples" },
        { icon: Target, text: "Practice problems", action: "practice" },
        { icon: Lightbulb, text: "Study tips", action: "tips" }
      ]
    } else if (message.includes('physics') || message.includes('force') || message.includes('energy')) {
      return [
        { icon: Brain, text: "Explain concepts", action: "explain" },
        { icon: FileText, text: "Show formulas", action: "formulas" },
        { icon: Target, text: "Practice problems", action: "practice" }
      ]
    } else {
      return [
        { icon: BookOpen, text: "Learn more", action: "learn" },
        { icon: Target, text: "Practice", action: "practice" },
        { icon: Lightbulb, text: "Get tips", action: "tips" }
      ]
    }
  }

  const handleSuggestionClick = (suggestion) => {
    const prompts = {
      explain: "Can you explain this in more detail?",
      practice: "Can you give me some practice problems?",
      plan: "Help me create a study plan for this topic.",
      tips: "What are some effective study tips for this?",
      examples: "Can you show me some examples?",
      formulas: "What are the key formulas I should know?",
      learn: "I'd like to learn more about this topic."
    }

    setNewMessage(prompts[suggestion.action] || "Tell me more about this.")
  }

  const handleQuickAction = (action) => {
    setNewMessage(action.prompt)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="ai-assistant-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">AI Learning Assistant</h1>
          <p className="page-subtitle">Get personalized help with your studies using advanced AI</p>
        </div>
        <div className="page-header-actions">
          <div className="subject-selector">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="subject-select"
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ai-assistant-container">
        {/* Quick Actions */}
        <div className="quick-actions-bar">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action)}
                  title={action.text}
                >
                  <Icon size={16} />
                  <span>{action.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Container */}
        <div className="ai-chat-container">
          {/* Messages Area */}
          <div className="ai-messages-area">
            <div className="ai-messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`ai-message ${message.sender}`}>
                  <div className="ai-message-content">
                    {message.sender === 'ai' && (
                      <div className="ai-message-header">
                        <div className="ai-avatar">
                          <Bot size={16} />
                        </div>
                        <span className="ai-name">AI Assistant</span>
                        <span className="ai-timestamp">{message.timestamp}</span>
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="user-message-header">
                        <span className="user-timestamp">{message.timestamp}</span>
                        <div className="user-avatar">You</div>
                      </div>
                    )}
                    <div className="ai-message-text">
                      {message.text}
                    </div>
                    {message.suggestions && (
                      <div className="ai-suggestions">
                        {message.suggestions.map((suggestion, index) => {
                          const Icon = suggestion.icon
                          return (
                            <button
                              key={index}
                              className="ai-suggestion-btn"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <Icon size={14} />
                              <span>{suggestion.text}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="ai-message ai">
                  <div className="ai-message-content">
                    <div className="ai-message-header">
                      <div className="ai-avatar">
                        <Bot size={16} />
                      </div>
                      <span className="ai-name">AI Assistant</span>
                    </div>
                    <div className="ai-typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-text">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="ai-input-area">
            <div className="ai-input-container">
              <input
                type="text"
                placeholder={`Ask me anything about ${subjects.find(s => s.id === selectedSubject)?.name.toLowerCase() || 'your studies'}...`}
                className="ai-message-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                className="ai-send-btn"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isTyping}
              >
                {isTyping ? (
                  <div className="loading-spinner">
                    <Sparkles size={16} />
                  </div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <div className="ai-input-footer">
              <p>💡 Tip: Be specific about your questions for better assistance!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant
