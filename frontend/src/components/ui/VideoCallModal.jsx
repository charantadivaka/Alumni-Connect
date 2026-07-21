import { useRef, useEffect } from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { useAuth } from '../../context/AuthContext';
import './VideoCallModal.css';

// ── Video element that auto-attaches a MediaStream ────────────────────────────
const VideoEl = ({ stream, muted = false, className = '', label = '' }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={ref}
            className={className}
            autoPlay
            playsInline
            muted={muted}
            aria-label={label}
        />
    );
};

// ── Icon button ───────────────────────────────────────────────────────────────
const CtrlBtn = ({ icon, label, onClick, variant = '', disabled = false, title = '' }) => (
    <button
        className={`vc-ctrl-btn ${variant}`}
        onClick={onClick}
        disabled={disabled}
        title={title || label}
        aria-label={label}
    >
        <span className="vc-ctrl-icon" aria-hidden="true">{icon}</span>
        <span className="vc-ctrl-label">{label}</span>
    </button>
);

// ── Main modal ────────────────────────────────────────────────────────────────
const VideoCallModal = () => {
    const {
        callStatus,
        myStream, remoteStream,
        isCameraOn, isMicOn, isScreenSharing,
        isRecording, isBeingRecorded,
        remoteUserName,
        answerCall, rejectCall, endCall,
        toggleCamera, toggleMic, toggleScreenShare,
        startRecording, stopRecording,
    } = useVideoCall();

    const { user } = useAuth();
    const isAlumni = user?.role === 'alumni';

    // ── Incoming call panel ───────────────────────────────────────────────────
    if (callStatus === 'incoming') {
        return (
            <div className="vc-backdrop" role="dialog" aria-modal="true" aria-label="Incoming video call">
                <div className="vc-panel">
                    <div className="vc-panel-ring-icon">📹</div>
                    <p className="vc-panel-sub">Incoming Video Call</p>
                    <h2 className="vc-panel-title">{remoteUserName}</h2>
                    <div className="vc-panel-actions">
                        <button
                            id="vc-accept-btn"
                            className="vc-accept-btn"
                            onClick={answerCall}
                            aria-label="Accept call"
                        >
                            <span>📞</span> Accept
                        </button>
                        <button
                            id="vc-reject-btn"
                            className="vc-reject-btn"
                            onClick={rejectCall}
                            aria-label="Decline call"
                        >
                            <span>✕</span> Decline
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Calling (waiting for answer) panel ────────────────────────────────────
    if (callStatus === 'calling') {
        return (
            <div className="vc-backdrop" role="dialog" aria-modal="true" aria-label="Outgoing video call">
                <div className="vc-panel">
                    <div className="vc-panel-ring-icon vc-ring-pulse">📹</div>
                    <p className="vc-panel-sub">Calling</p>
                    <h2 className="vc-panel-title">{remoteUserName}</h2>
                    <div className="vc-calling-dots" aria-label="Waiting for answer">
                        <span className="vc-dot" />
                        <span className="vc-dot" />
                        <span className="vc-dot" />
                    </div>
                    <p className="vc-panel-hint">Waiting for them to answer…</p>
                    <button
                        id="vc-cancel-call-btn"
                        className="vc-reject-btn"
                        onClick={endCall}
                        style={{ marginTop: '1.5rem' }}
                    >
                        ✕ Cancel
                    </button>
                </div>
            </div>
        );
    }

    // ── Active call ───────────────────────────────────────────────────────────
    if (callStatus === 'active') {
        return (
            <div className="vc-overlay" role="dialog" aria-modal="true" aria-label="Active video call">

                {/* ── Video stage ── */}
                <div className="vc-stage">

                    {/* Remote video (large) */}
                    {remoteStream ? (
                        <VideoEl
                            stream={remoteStream}
                            className="vc-remote-video"
                            label={`${remoteUserName}'s video`}
                        />
                    ) : (
                        <div className="vc-connecting">
                            <div className="vc-spinner" />
                            <span>Connecting…</span>
                        </div>
                    )}

                    {/* Remote name tag */}
                    <div className="vc-name-tag">
                        {remoteUserName}
                        {isBeingRecorded && (
                            <span className="vc-being-recorded-badge">🔴 Recording</span>
                        )}
                    </div>

                    {/* Alumni's active recording indicator */}
                    {isRecording && (
                        <div className="vc-rec-pill">
                            <span className="vc-rec-dot" />
                            REC
                        </div>
                    )}

                    {/* Self preview (bottom-right) */}
                    <div className="vc-self-preview">
                        {myStream && isCameraOn ? (
                            <VideoEl
                                stream={myStream}
                                muted
                                className="vc-self-video"
                                label="Your camera"
                            />
                        ) : (
                            <div className="vc-self-cam-off">
                                <span>{isCameraOn ? '⏳' : '📵'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Controls bar ── */}
                <div className="vc-controls" role="toolbar" aria-label="Call controls">

                    {/* Microphone */}
                    <CtrlBtn
                        id="vc-mic-btn"
                        icon={isMicOn ? '🎤' : '🔇'}
                        label={isMicOn ? 'Mute' : 'Unmute'}
                        variant={!isMicOn ? 'vc-btn-off' : ''}
                        onClick={toggleMic}
                    />

                    {/* Camera */}
                    <CtrlBtn
                        id="vc-cam-btn"
                        icon={isCameraOn ? '📷' : '📵'}
                        label={isCameraOn ? 'Camera' : 'Cam Off'}
                        variant={!isCameraOn ? 'vc-btn-off' : ''}
                        onClick={toggleCamera}
                    />

                    {/* Screen share */}
                    <CtrlBtn
                        id="vc-share-btn"
                        icon="🖥️"
                        label={isScreenSharing ? 'Stop Share' : 'Share'}
                        variant={isScreenSharing ? 'vc-btn-active' : ''}
                        onClick={toggleScreenShare}
                    />

                    <div className="vc-ctrl-divider" aria-hidden="true" />

                    {/* Recording — alumni can click, student sees the button but disabled */}
                    {isAlumni ? (
                        <CtrlBtn
                            id="vc-record-btn"
                            icon={isRecording ? '⏹️' : '⏺️'}
                            label={isRecording ? 'Stop Rec' : 'Record'}
                            variant={isRecording ? 'vc-btn-recording' : ''}
                            onClick={isRecording ? stopRecording : startRecording}
                            title={isRecording ? 'Stop recording' : 'Record this session'}
                        />
                    ) : (
                        <CtrlBtn
                            id="vc-record-indicator"
                            icon="⏺️"
                            label={isBeingRecorded ? 'Recording' : 'Record'}
                            variant={isBeingRecorded ? 'vc-btn-recording' : ''}
                            disabled
                            title="Only the interviewer can control recording"
                        />
                    )}

                    <div className="vc-ctrl-divider" aria-hidden="true" />

                    {/* End call */}
                    <CtrlBtn
                        id="vc-end-btn"
                        icon="📵"
                        label="End Call"
                        variant="vc-btn-end"
                        onClick={endCall}
                    />
                </div>
            </div>
        );
    }

    return null;
};

export default VideoCallModal;
