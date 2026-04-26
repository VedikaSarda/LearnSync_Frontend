import { Bot, Send, Lightbulb, BookOpen, Target, Clock, Brain, Calculator, FileText, Zap, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import './styles.css'
import { InferenceClient } from "@huggingface/inference";

const AIAssistant = () => {

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI learning assistant powered by Gemma 4. I can help you with study planning, concept explanations, practice problems, and performance analysis. What would you like to learn about today?",
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
  const [isListening, setIsListening] = useState(false)
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null)
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

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setNewMessage(prev => prev ? `${prev} ${transcript}` : transcript)
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  const handleSpeak = (messageId, text) => {
    if ('speechSynthesis' in window) {
      if (currentlySpeaking === messageId) {
        window.speechSynthesis.cancel()
        setCurrentlySpeaking(null)
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'

      utterance.onend = () => setCurrentlySpeaking(null)

      setCurrentlySpeaking(messageId)
      window.speechSynthesis.speak(utterance)
    } else {
      alert("Your browser doesn't support Text-to-Speech.")
    }
  }

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // const handleSendMessage = async () => {
  //   if (newMessage.trim()) {
  //     const userMessage = {
  //       id: Date.now(),
  //       text: newMessage,
  //       sender: 'user',
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //     }

  //     setMessages(prev => [...prev, userMessage])
  //     const currentMessage = newMessage
  //     setNewMessage('')
  //     setIsTyping(true)

  //     try {
  //       let aiText = ''

  //       // Build context-aware prompt based on selected subject
  //       const subjectContext = selectedSubject !== 'general'
  //         ? `You are a helpful AI tutor specializing in ${subjects.find(s => s.id === selectedSubject)?.name}. `
  //         : 'You are a helpful AI learning assistant. '

  //       // Hugging Face Logic
  //       const hfApiKey = import.meta.env.VITE_HF_API_KEY
  //       if (!hfApiKey || hfApiKey === 'your_hugging_face_token_here') {
  //         throw new Error('Hugging Face API key not configured')
  //       }

  //       // Use Hugging Face Messages API for Gemma 4
  //       const response = await fetch('https://api-inference.huggingface.co/models/google/gemma-4-E4B-it/v1/chat/completions', {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': `Bearer ${hfApiKey}`,
  //           'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify({
  //           model: "google/gemma-4-E4B-it",
  //           messages: [
  //             { role: "system", content: subjectContext + "Answer this question clearly and concisely." },
  //             { role: "user", content: currentMessage }
  //           ],
  //           max_tokens: 400,
  //           temperature: 0.7
  //         })
  //       })

  //       if (!response.ok) {
  //          const errorData = await response.json().catch(() => ({}))
  //          throw new Error(errorData.error || errorData.message || response.statusText || 'Unknown API Error')
  //       }

  //       const result = await response.json()
  //       aiText = result.choices?.[0]?.message?.content || "I couldn't generate a response."

  //       // Update chat history
  //       setChatHistory(prev => [
  //         ...prev,
  //         { role: 'user', parts: [{ text: currentMessage }] },
  //         { role: 'model', parts: [{ text: aiText }] }
  //       ])

  //       const aiMessage = {
  //         id: Date.now() + 1,
  //         text: aiText,
  //         sender: 'ai',
  //         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //         suggestions: generateSuggestions(currentMessage)
  //       }

  //       setMessages(prev => [...prev, aiMessage])
  //     } catch (error) {
  //       console.error('API Error:', error)

  //       // Fallback error message
  //       let errorText = `⚠️ I'm having trouble connecting right now. Details: ${error.message}`

  //       if (error.message.includes('API key not configured') || error.message.includes('Failed to fetch')) {
  //         errorText = `⚠️ API Connection failed. If using Hugging Face, ensure your API key is correct and the model name is valid. Details: ${error.message}`
  //       } else if (error.message.includes('leaked') || error.message.includes('403')) {
  //         errorText = `⚠️ Your API key was rejected (403). Please check your key or model access permissions.`
  //       }

  //       const errorMessage = {
  //         id: Date.now() + 1,
  //         text: errorText,
  //         sender: 'ai',
  //         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //         suggestions: [
  //           { icon: Lightbulb, text: "Try again", action: "retry" },
  //           { icon: BookOpen, text: "Learn more", action: "learn" }
  //         ]
  //       }

  //       setMessages(prev => [...prev, errorMessage])
  //     } finally {
  //       setIsTyping(false)
  //     }
  //   }
  // }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);

    const currentInput = newMessage;
    setNewMessage('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_HF_API_KEY;

      if (!apiKey) {
        throw new Error("Missing Hugging Face API Key");
      }

      const hf = new InferenceClient(apiKey);

      const systemPrompt = {
        role: "system",
        content: `You are a helpful AI tutor specializing in ${selectedSubject}. Keep explanations clear, structured, and academic.`
      };

      // Use CLEAN history
      const history = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.parts[0].text
      }));

      const limitedHistory = history.slice(-6);

      const response = await hf.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI tutor for ${selectedSubject}.`,
          },

          // ✅ SAFE HISTORY (important fix)
          ...limitedHistory.filter(
            msg => msg.content && msg.content.trim() !== ""
          ),

          {
            role: "user",
            content: currentInput,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiText =
        response?.choices?.[0]?.message.content ||
        "⚠️ No response generated.";

      // Update clean history
      setChatHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: currentInput }] },
        { role: 'assistant', parts: [{ text: aiText }] }
      ]);

      const aiMessage = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: generateSuggestions(currentInput)
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("API Error:", error);

      const errorMessage = {
        id: Date.now() + 1,
        text: `⚠️ Error: ${error.message}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          { icon: Lightbulb, text: "Retry", action: "retry" }
        ]
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
        <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                        <button
                          className={`speak-btn ${currentlySpeaking === message.id ? 'speaking' : ''}`}
                          onClick={() => handleSpeak(message.id, message.text)}
                          title={currentlySpeaking === message.id ? "Stop Speaking" : "Read Aloud"}
                        >
                          {currentlySpeaking === message.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
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
                className={`ai-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start Voice Input"}
              >
                {isListening ? <MicOff size={18} className="pulse" /> : <Mic size={18} />}
              </button>
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
