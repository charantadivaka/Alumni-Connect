import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const VideoCallContext = createContext(null);

// ── ICE / TURN Server Configuration ───────────────────────────────────────────
// Uses environment variables when set, otherwise falls back to free open-relay
// TURN servers suitable for development. Replace with dedicated TURN in production.
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_URL
        ? [
            {
                urls: import.meta.env.VITE_TURN_URL,
                username: import.meta.env.VITE_TURN_USERNAME || '',
                credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
            },
        ]
        : [
            // Free open-relay TURN (development/testing only)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turns:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
        ]),
];

// ── Provider ───────────────────────────────────────────────────────────────────
export const VideoCallProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // ── Reactive UI state ─────────────────────────────────────────────────────
    const [callStatus, setCallStatusState] = useState('idle');
    // 'idle' | 'calling' | 'incoming' | 'active'
    const [myStream, setMyStream]               = useState(null);
    const [remoteStream, setRemoteStream]       = useState(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState(null);
    const [screenStream, setScreenStream]       = useState(null);
    const [isCameraOn, setIsCameraOn]           = useState(true);
    const [isMicOn, setIsMicOn]                 = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording]         = useState(false);
    const [isBeingRecorded, setIsBeingRecorded] = useState(false);
    const [remoteUserName, setRemoteUserName]   = useState('');
    const [sessionInfo, setSessionInfoState]    = useState(null);

    // ── Refs (stable mutable values — no re-render side effects) ─────────────
    const peerRef              = useRef(null);   // RTCPeerConnection instance
    const myStreamRef          = useRef(null);   // local MediaStream
    const remoteStreamRef      = useRef(null);   // remote MediaStream (camera + audio)
    const remoteStreamIdRef    = useRef(null);   // original ID of camera stream
    const remoteScreenStreamRef= useRef(null);   // remote screen-share stream
    const mediaRecorderRef     = useRef(null);   // MediaRecorder for recording
    const recordedChunksRef    = useRef([]);     // recorded Blob chunks
    const incomingDataRef      = useRef(null);   // { offer, from } from incoming_call
    const pendingCandidatesRef = useRef([]);     // ICE candidates queued before remote SDP
    const remoteDescReadyRef   = useRef(false);  // has setRemoteDescription been called?
    const callStatusRef        = useRef('idle'); // mirrors callStatus without closure staleness
    const sessionInfoRef       = useRef(null);   // mirrors sessionInfo

    const screenSenderRef      = useRef(null);   // WebRTC sender for screen track

    // Helpers that keep ref + state in sync
    const setCallStatus = useCallback((s) => {
        callStatusRef.current = s;
        setCallStatusState(s);
    }, []);

    const setSessionInfo = useCallback((info) => {
        sessionInfoRef.current = info;
        setSessionInfoState(info);
    }, []);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    const cleanupCall = useCallback(() => {
        // Stop recording if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        // Stop all local tracks
        myStreamRef.current?.getTracks().forEach(t => t.stop());
        setScreenStream(prev => {
            prev?.getTracks().forEach(t => t.stop());
            return null;
        });
        // Close peer connection
        peerRef.current?.close();

        // Reset all refs
        peerRef.current           = null;
        myStreamRef.current       = null;
        remoteStreamRef.current   = null;
        remoteStreamIdRef.current = null;
        remoteScreenStreamRef.current = null;
        mediaRecorderRef.current  = null;
        incomingDataRef.current   = null;
        recordedChunksRef.current = [];
        pendingCandidatesRef.current = [];
        remoteDescReadyRef.current = false;
        screenSenderRef.current   = null;

        // Reset state
        setMyStream(null);
        setRemoteStream(null);
        setRemoteScreenStream(null);
        setScreenStream(null);
        setIsCameraOn(true);
        setIsMicOn(true);
        setIsScreenSharing(false);
        setIsRecording(false);
        setIsBeingRecorded(false);
        setRemoteUserName('');
        setCallStatus('idle');
        setSessionInfo(null);
    }, [setCallStatus, setSessionInfo]);

    // ── Acquire camera + microphone ───────────────────────────────────────────
    const acquireMedia = useCallback(async () => {
        try {
            return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch {
            // Fallback: audio only if camera is blocked/unavailable
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setIsCameraOn(false);
            return stream;
        }
    }, []);

    // ── Flush ICE candidates queued before remote description was set ─────────
    const flushCandidates = useCallback(async (pc) => {
        for (const candidate of pendingCandidatesRef.current) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn('[ICE] Could not add queued candidate:', e.message);
            }
        }
        pendingCandidatesRef.current = [];
    }, []);

    // ── Build RTCPeerConnection ───────────────────────────────────────────────
    const buildPeer = useCallback((targetUserId) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = ({ candidate }) => {
            if (candidate && socket) {
                socket.emit('ice_candidate', { to: targetUserId, candidate });
            }
        };

        pc.ontrack = ({ track, streams }) => {
            if (streams && streams.length > 0) {
                const stream = streams[0];
                const streamId = stream.id;

                if (!remoteStreamRef.current) {
                    // First time receiving a stream (assume it's the main camera/audio)
                    remoteStreamIdRef.current = streamId;
                    const newStream = new MediaStream(stream.getTracks());
                    remoteStreamRef.current = newStream;
                    setRemoteStream(newStream);
                    
                    stream.onaddtrack = () => {
                        const updated = new MediaStream(stream.getTracks());
                        remoteStreamRef.current = updated;
                        setRemoteStream(updated);
                    };
                } else if (remoteStreamIdRef.current === streamId) {
                    // It's just a track being added to the existing camera stream, ignore 
                    // (onaddtrack handles this, or just let React stay quiet)
                } else {
                    // It's a completely different stream ID! Must be the screen share.
                    if (!remoteScreenStreamRef.current) {
                        const screenStream = new MediaStream(stream.getTracks());
                        remoteScreenStreamRef.current = screenStream;
                        setRemoteScreenStream(screenStream);

                        stream.onaddtrack = () => {
                            const updated = new MediaStream(stream.getTracks());
                            remoteScreenStreamRef.current = updated;
                            setRemoteScreenStream(updated);
                        };
                        stream.onremovetrack = () => {
                            if (stream.getTracks().length === 0) {
                                remoteScreenStreamRef.current = null;
                                setRemoteScreenStream(null);
                            }
                        };
                    }
                }
            } else {
                // Fallback
                if (!remoteStreamRef.current) {
                    remoteStreamRef.current = new MediaStream();
                    setRemoteStream(remoteStreamRef.current);
                }
                remoteStreamRef.current.addTrack(track);
                setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
            }
        };

        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                cleanupCall();
            }
        };

        return pc;
    }, [socket, cleanupCall]);

    // ── Start Call (alumni only) ──────────────────────────────────────────────
    const startCall = useCallback(async (targetUserId, targetName, sessionId, sessionType) => {
        if (!socket || callStatusRef.current !== 'idle') return;

        setCallStatus('calling');
        setRemoteUserName(targetName);
        setSessionInfo({ targetUserId, targetName, sessionId, sessionType });

        try {
            const stream = await acquireMedia();
            myStreamRef.current = stream;
            setMyStream(stream);

            const pc = buildPeer(targetUserId);
            peerRef.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);

            socket.emit('call_user', {
                userToCall: targetUserId,
                signal: offer,
                from: user._id,
                callerName: user.name,
                sessionId,
                sessionType,
            });
        } catch (err) {
            console.error('[VideoCall] startCall error:', err);
            alert(err.message || 'Could not access camera/microphone. Please allow permissions and try again.');
            cleanupCall();
        }
    }, [socket, user, acquireMedia, buildPeer, cleanupCall, setCallStatus, setSessionInfo]);

    // ── Answer Call (student) ─────────────────────────────────────────────────
    const answerCall = useCallback(async () => {
        const incoming = incomingDataRef.current;
        if (!incoming || !socket) return;

        setCallStatus('active');

        try {
            const stream = await acquireMedia();
            myStreamRef.current = stream;
            setMyStream(stream);

            const pc = buildPeer(incoming.from);
            peerRef.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
            remoteDescReadyRef.current = true;
            await flushCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer_call', { to: incoming.from, signal: answer });
        } catch (err) {
            console.error('[VideoCall] answerCall error:', err);
            alert(err.message || 'Failed to join the call. Please check your camera and microphone.');
            cleanupCall();
        }
    }, [socket, acquireMedia, buildPeer, flushCandidates, cleanupCall, setCallStatus]);

    // ── Reject Incoming Call ──────────────────────────────────────────────────
    const rejectCall = useCallback(() => {
        const incoming = incomingDataRef.current;
        if (incoming && socket) socket.emit('end_call', { to: incoming.from });
        cleanupCall();
    }, [socket, cleanupCall]);

    // ── End Call (either party) ───────────────────────────────────────────────
    const endCall = useCallback(() => {
        const targetId =
            sessionInfoRef.current?.targetUserId ??
            incomingDataRef.current?.from;
        if (targetId && socket) socket.emit('end_call', { to: targetId });
        cleanupCall();
    }, [socket, cleanupCall]);

    // ── Toggle Camera ─────────────────────────────────────────────────────────
    const toggleCamera = useCallback(() => {
        const track = myStreamRef.current?.getVideoTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
    }, []);

    // ── Toggle Microphone ─────────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        const track = myStreamRef.current?.getAudioTracks()[0];
        if (!track) return;
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
    }, []);

    // ── Toggle Screen Share ───────────────────────────────────────────────────
    const toggleScreenShare = useCallback(async () => {
        const pc = peerRef.current;
        if (!pc || !socket) return;

        const renegotiate = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                const targetUserId = sessionInfoRef.current?.targetUserId || incomingDataRef.current?.from;
                if (targetUserId) socket.emit('renegotiate_offer', { to: targetUserId, signal: offer });
            } catch (err) {
                console.error('[WebRTC] renegotiation failed:', err);
            }
        };

        if (isScreenSharing) {
            // Stop sharing
            if (screenSenderRef.current) {
                pc.removeTrack(screenSenderRef.current);
                screenSenderRef.current = null;
            }
            setScreenStream(prev => {
                prev?.getTracks().forEach(t => t.stop());
                return null;
            });
            setIsScreenSharing(false);
            await renegotiate();
        } else {
            // Start sharing
            try {
                const newScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                setScreenStream(newScreenStream);
                const screenTrack = newScreenStream.getVideoTracks()[0];
                
                // Add the screen track as a NEW track so both camera and screen are sent
                screenSenderRef.current = pc.addTrack(screenTrack, newScreenStream);
                await renegotiate();

                // Auto-revert when user stops sharing from browser UI
                screenTrack.onended = async () => {
                    if (screenSenderRef.current) {
                        pc.removeTrack(screenSenderRef.current);
                        screenSenderRef.current = null;
                    }
                    setScreenStream(null);
                    setIsScreenSharing(false);
                    await renegotiate();
                };

                setIsScreenSharing(true);
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('[ScreenShare]', err);
                }
            }
        }
    }, [isScreenSharing, socket]);

    // ── Start Recording (alumni only) ─────────────────────────────────────────
    // Records the remote (student) video+audio stream and downloads as .webm
    const startRecording = useCallback(() => {
        if (user?.role !== 'alumni') return;
        const stream = remoteStreamRef.current;
        if (!stream) {
            alert('Remote video is not yet available. Please wait a moment and try again.');
            return;
        }

        try {
            const mimeType =
                ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
                    .find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';

            recordedChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url  = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                const ts   = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
                anchor.href     = url;
                anchor.download = `interview-recording-${ts}.webm`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            };

            recorder.start(1000); // collect chunks every 1s
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

            // Notify the student that recording has started
            const targetId = sessionInfoRef.current?.targetUserId;
            if (targetId && socket) socket.emit('recording_started', { to: targetId });
        } catch (err) {
            console.error('[Recording]', err);
            alert('Recording failed to start. Your browser may not support this feature.');
        }
    }, [user, socket]);

    // ── Stop Recording (alumni only) ──────────────────────────────────────────
    const stopRecording = useCallback(() => {
        if (user?.role !== 'alumni') return;
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop(); // triggers onstop → downloads the file
            setIsRecording(false);
            const targetId = sessionInfoRef.current?.targetUserId;
            if (targetId && socket) socket.emit('recording_stopped', { to: targetId });
        }
    }, [user, socket]);

    // ── Socket Event Listeners ────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // Alumni calls a student
        const onIncomingCall = ({ signal, from, callerName, sessionId, sessionType }) => {
            if (callStatusRef.current !== 'idle') {
                // Already busy — politely reject
                socket.emit('end_call', { to: from });
                return;
            }
            incomingDataRef.current = { offer: signal, from };
            setRemoteUserName(callerName);
            setSessionInfo({ targetUserId: from, targetName: callerName, sessionId, sessionType });
            setCallStatus('incoming');
        };

        // Student's answer arrives at alumni's side
        const onCallAccepted = async ({ signal }) => {
            const pc = peerRef.current;
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                remoteDescReadyRef.current = true;
                await flushCandidates(pc);
                setCallStatus('active');
            } catch (e) {
                console.error('[VideoCall] onCallAccepted:', e);
            }
        };

        // ICE candidate from the other peer
        const onIceCandidate = async ({ candidate }) => {
            if (!candidate) return;
            const pc = peerRef.current;
            if (pc && remoteDescReadyRef.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('[ICE] addIceCandidate failed:', e.message);
                }
            } else {
                // Queue until remote description is ready
                pendingCandidatesRef.current.push(candidate);
            }
        };

        const onCallEnded = () => cleanupCall();
        const onRecordingStarted = () => setIsBeingRecorded(true);
        const onRecordingStopped = () => setIsBeingRecorded(false);

        const onRenegotiateOffer = async ({ signal }) => {
            const pc = peerRef.current;
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const targetUserId = sessionInfoRef.current?.targetUserId || incomingDataRef.current?.from;
                if (targetUserId) socket.emit('renegotiate_answer', { to: targetUserId, signal: answer });
            } catch (e) {
                console.error('[WebRTC] renegotiate offer:', e);
            }
        };

        const onRenegotiateAnswer = async ({ signal }) => {
            const pc = peerRef.current;
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } catch (e) {
                console.error('[WebRTC] renegotiate answer:', e);
            }
        };

        socket.on('incoming_call',     onIncomingCall);
        socket.on('call_accepted',     onCallAccepted);
        socket.on('ice_candidate',     onIceCandidate);
        socket.on('call_ended',        onCallEnded);
        socket.on('recording_started', onRecordingStarted);
        socket.on('recording_stopped', onRecordingStopped);
        socket.on('renegotiate_offer', onRenegotiateOffer);
        socket.on('renegotiate_answer', onRenegotiateAnswer);

        return () => {
            socket.off('incoming_call',     onIncomingCall);
            socket.off('call_accepted',     onCallAccepted);
            socket.off('ice_candidate',     onIceCandidate);
            socket.off('call_ended',        onCallEnded);
            socket.off('recording_started', onRecordingStarted);
            socket.off('recording_stopped', onRecordingStopped);
            socket.off('renegotiate_offer', onRenegotiateOffer);
            socket.off('renegotiate_answer', onRenegotiateAnswer);
        };
    }, [socket, flushCandidates, cleanupCall, setCallStatus, setSessionInfo]);

    return (
        <VideoCallContext.Provider
            value={{
                callStatus,
                myStream,
                remoteStream,
                remoteScreenStream,
                screenStream,
                isCameraOn,
                isMicOn,
                isScreenSharing,
                isRecording,
                isBeingRecorded,
                remoteUserName,
                sessionInfo,
                startCall,
                answerCall,
                rejectCall,
                endCall,
                toggleCamera,
                toggleMic,
                toggleScreenShare,
                startRecording,
                stopRecording,
            }}
        >
            {children}
        </VideoCallContext.Provider>
    );
};

export const useVideoCall = () => useContext(VideoCallContext);
