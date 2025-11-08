import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import { fetchUserById } from '../../utils/profile';
import './VideoCall.css';

const VideoCall = () => {
  const { sessionId, callId } = useParams();
  const location = useLocation();
  const roomId = sessionId || callId;
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef();
  const peerConnections = useRef({});
  const localStreamRef = useRef();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Determine namespace based on route
    let namespace = '/webrtc/mentorship';
    if (callId) {
      // For chat calls, decide namespace based on call type from navigation state or callId format
      if (location.state?.callType === 'group' || (callId && !callId.includes('-'))) {
        namespace = '/webrtc/group';
      } else {
        namespace = '/webrtc/one-to-one';
      }
    }

    socketRef.current = io(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${namespace}`);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // For one-to-one calls, get otherUserId from location.state or parse from callId
        let otherUserId = null;
        if (callId && callId.includes('-')) {
          if (location.state && location.state.otherUserId) {
            otherUserId = location.state.otherUserId;
          } else {
            // Fallback for user joining via link: derive from callId
            const ids = callId.split('-');
            if (ids.length === 2) {
              const currentUserIdStr = String(currentUser.id);
              otherUserId = ids.find(id => String(id) !== currentUserIdStr);
            }
          }

          if (otherUserId) {
            fetchUserById(otherUserId).then(data => {
              if (data.success) {
                setOtherUser(data.user);
              }
            });
          }
        }

        if (callId) {
          if (location.state?.callType === 'group' || !callId.includes('-')) {
            socketRef.current.emit('join-group', {
              groupId: callId,
              userId: currentUser.id,
            });
          } else {
            socketRef.current.emit('join-call', {
              callId,
              userId: currentUser.id,
              otherUserId,
            });
          }
        } else {
          socketRef.current.emit('join-session', {
            sessionId,
            userId: currentUser.id,
          });
        }

        socketRef.current.on('all-users', (users) => {
          users.forEach(userSocketId => {
            createPeerConnection(userSocketId);
            sendOffer(userSocketId);
          });
        });

        socketRef.current.on('user-joined', ({ userId, socketId }) => {
          console.log('User joined:', userId);
          createPeerConnection(socketId);
          sendOffer(socketId);
        });

        socketRef.current.on('offer', ({ sdp, caller }) => {
          console.log('Received offer from:', caller);
          createPeerConnection(caller);
          peerConnections.current[caller].setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
            .then(() => sendAnswer(caller))
            .catch(e => console.error('Error setting remote description:', e));
        });

        socketRef.current.on('answer', ({ sdp, responder }) => {
          console.log('Received answer from:', responder);
          peerConnections.current[responder].setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
            .catch(e => console.error('Error setting remote description:', e));
        });

        socketRef.current.on('ice-candidate', ({ candidate, from }) => {
          console.log('Received ICE candidate from:', from);
          peerConnections.current[from].addIceCandidate(new RTCIceCandidate(candidate))
            .catch(e => console.error('Error adding ICE candidate:', e));
        });

        socketRef.current.on('user-left', ({ socketId, userId }) => {
          console.log('User left:', userId);
          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }
          setRemoteStream(null);
        });
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setRemoteStream(null);
      setOtherUser(null);
    };
  }, [roomId, currentUser.id, location.state]);

  const createPeerConnection = (targetSocketId) => {
    if (peerConnections.current[targetSocketId]) {
      return;
    }
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    peerConnections.current[targetSocketId] = pc;
  };

  const sendOffer = (targetSocketId) => {
    const pc = peerConnections.current[targetSocketId];
    if (!pc) return;
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit('offer', {
          target: targetSocketId,
          sdp: pc.localDescription.sdp,
        });
      })
      .catch(e => console.error('Error creating offer:', e));
  };

  const sendAnswer = (targetSocketId) => {
    const pc = peerConnections.current[targetSocketId];
    if (!pc) return;
    pc.createAnswer()
      .then(answer => pc.setLocalDescription(answer))
      .then(() => {
        socketRef.current.emit('answer', {
          target: targetSocketId,
          sdp: pc.localDescription.sdp,
        });
      })
      .catch(e => console.error('Error creating answer:', e));
  };

  const toggleMute = () => {
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  const toggleVideo = () => {
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    });
  };

  const handleEndCall = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    window.location.href = '/mentorship';
  };

  const handleScreenShare = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true })
      .then(stream => {
        const screenTrack = stream.getTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
            screenTrack.onended = () => {
              const localVideoTrack = localStreamRef.current.getVideoTracks()[0];
              videoSender.replaceTrack(localVideoTrack);
            };
          }
        });
      });
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="video-participant">
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video"></video>
          <div className="participant-name">{currentUser.display_name} (You)</div>
        </div>
        <div id="remote-videos" className="remote-videos-container">
          {remoteStream && (
            <div className="video-participant">
              <video
                ref={video => {
                  if (video) video.srcObject = remoteStream;
                }}
                autoPlay
                playsInline
                className="remote-video"
              ></video>
              <div className="participant-name">{otherUser?.display_name || '...'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="call-controls">
        <button onClick={toggleMute} className={`control-btn ${isMuted ? 'active' : ''}`}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? 'active' : ''}`}>
          {isVideoOff ? <VideoOff /> : <Video />}
        </button>
        <button onClick={handleScreenShare} className="control-btn">
          <ScreenShare />
        </button>
        <button onClick={handleEndCall} className="control-btn end-call">
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
