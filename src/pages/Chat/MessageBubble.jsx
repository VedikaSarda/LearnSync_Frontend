import { useEffect, useRef } from 'react'
import { Check, CheckCheck } from 'lucide-react'
import Linkify from 'react-linkify'

const MessageBubble = ({ item, messageStatuses, sendReadReceipt, groupMembers, showSenderName, userColors, isGroupChat }) => {
  const messageRef = useRef()
  const sentRef = useRef(false) // ✅ Prevent duplicate emits

  // Find sender's username from groupMembers if available
  const senderName = (() => {
    if (item.sender === 'me' || item.sender === 'system') return null
    if (!groupMembers || groupMembers.length === 0) return null
    const member = groupMembers.find(m => String(m.id) === String(item.senderId))
    return member ? member.username : null
  })()

  const senderColor = isGroupChat && senderName && userColors[String(item.senderId)]
    ? userColors[String(item.senderId)]
    : '#555'

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isRead = messageStatuses[item.id] === 'read' || item.status === 'read'
        if (entry.isIntersecting && item.sender === 'other' && !isRead && !sentRef.current) {
          sendReadReceipt(item.id, item.senderId)
          sentRef.current = true
        }
      },
      { threshold: 1.0 }
    )

    if (item.sender === 'other' && messageRef.current) {
      observer.observe(messageRef.current)
    }

    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current)
      }
    }
  }, [item, messageStatuses, sendReadReceipt])

  return (
    <div
      id={`message-${item.id}`}
      ref={messageRef}
      className={`message ${item.sender === 'me' ? 'sent' : 'received'} ${showSenderName ? '' : 'message-grouped'}`}
      style={{ marginTop: showSenderName ? '10px' : '0.1px' }}
    >
      <div className="message-bubble">
        {showSenderName && senderName && (
          <div className="message-sender-name" style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85em', color: senderColor }}>
            {senderName}
          </div>
        )}
        <p>
          {(() => {
            const callLinkPrefix = '[call_link]';
            if (item.text && item.text.startsWith(callLinkPrefix)) {
              try {
                const linkData = JSON.parse(item.text.substring(callLinkPrefix.length));
                return (
                  <a
                    href={linkData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '10px 15px',
                      backgroundColor: 'hsl(211, 82%, 56%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {linkData.text}
                  </a>
                );
              } catch (e) {
                // Fallback for malformed JSON
                return <Linkify>{item.text}</Linkify>;
              }
            }
            return <Linkify>{item.text}</Linkify>;
          })()}
        </p>
        <span className="message-time">
          {item.timestamp}
          {item.sender === 'me' && (
            <span className="message-status">
              {messageStatuses[item.id] === 'read' || item.status === 'read'
                ? <CheckCheck size={14} className="read" />
                : messageStatuses[item.id] === 'delivered' || messageStatuses[item.id] === 'delivered'
                  ? <Check size={14} />
                  : <Check size={14} />} {/* fallback for 'sent' or other statuses */}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

export default MessageBubble
