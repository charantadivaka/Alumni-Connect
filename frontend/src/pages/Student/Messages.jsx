import { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { connectionService } from '../../services/otherServices';
import '../../styles/Student/Messages.css';

const MOBILE_BREAKPOINT = 768;
const EMOJIS = ['😀', '😂', '🥺', '😍', '🙏', '👍', '🔥', '🎉', '💔', '💯', '😊', '🤔'];

const Messages = () => {
  const { user } = useAuth();
  const [threads, setThreads]                 = useState([]);
  const [connections, setConnections]         = useState([]);
  const [loadingThreads, setLoadingThreads]   = useState(true);
  const [activeThread, setActiveThread]       = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Input State
  const [text, setText]                       = useState('');
  const [sending, setSending]                 = useState(false);
  const [replyToMsg, setReplyToMsg]           = useState(null);
  const [attachment, setAttachment]           = useState(null); // { url, type, name }
  
  // UI State
  const [showContacts, setShowContacts]       = useState(false);
  const [contactSearch, setContactSearch]     = useState('');
  const [threadSearch, setThreadSearch]       = useState('');
  const [isMobile, setIsMobile]               = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [showConversation, setShowConversation] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen]   = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchThreads = async () => {
    try {
      const [threadsData, connsData] = await Promise.all([
        messageService.getThreads(),
        connectionService.getMy()
      ]);
      setThreads(threadsData);
      setConnections(connsData.filter(c => c.status === 'Accepted'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const openThread = async (thread) => {
    const partnerId = thread.partner._id;
    try {
      setLoadingMessages(true);
      setActiveThread({ partner: thread.partner, messages: [] });
      setReplyToMsg(null);
      setAttachment(null);
      setHeaderMenuOpen(false);
      
      if (isMobile) setShowConversation(true);
      
      const msgs = await messageService.getConversation(partnerId);
      setActiveThread({ partner: thread.partner, messages: msgs });
      await messageService.markRead(partnerId);
      setThreads(prev => prev.map(t => t.partner._id === partnerId ? { ...t, unreadCount: 0 } : t));
    } catch (err) { console.error(err); }
    finally { setLoadingMessages(false); }
  };

  const startChatWithConnection = async (person) => {
    setShowContacts(false);
    if (isMobile) setShowConversation(true);
    try {
      setLoadingMessages(true);
      setActiveThread({ partner: person, messages: [] });
      setReplyToMsg(null);
      setAttachment(null);
      setHeaderMenuOpen(false);

      const msgs = await messageService.getConversation(person._id);
      setActiveThread({ partner: person, messages: msgs });
      setThreads(prev => {
        if (prev.find(t => t.partner._id === person._id)) return prev;
        return [{ partner: person, unreadCount: 0, lastMessage: null }, ...prev];
      });
    } catch (err) { console.error(err); }
    finally { setLoadingMessages(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('File size must be under 5MB');
    
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ url: ev.target.result, type: isImage ? 'image' : 'document', name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !attachment) || !activeThread) return;
    try {
      setSending(true);
      
      const payload = {
        receiverId: activeThread.partner._id,
        text: text.trim(),
        replyTo: replyToMsg?._id || null,
        fileUrl: attachment?.url || '',
        fileType: attachment?.type || '',
        fileName: attachment?.name || ''
      };

      const msg = await messageService.send(payload);
      setActiveThread(prev => ({ ...prev, messages: [...prev.messages, msg] }));
      setText('');
      setReplyToMsg(null);
      setAttachment(null);
      setShowEmojiPicker(false);
      
      setThreads(prev => {
        const existing = prev.find(t => t.partner._id === activeThread.partner._id);
        const lastMsg = { text: msg.text || 'Attachment', createdAt: msg.createdAt };
        if (existing) {
          return [{ ...existing, lastMessage: lastMsg }, ...prev.filter(t => t.partner._id !== activeThread.partner._id)];
        }
        return [{ partner: activeThread.partner, unreadCount: 0, lastMessage: lastMsg }, ...prev];
      });
    } catch (err) { alert(err.message || 'Failed to send message.'); }
    finally { setSending(false); }
  };

  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await messageService.delete(msgId);
      setActiveThread(prev => ({
        ...prev, 
        messages: prev.messages.map(m => m._id === msgId ? { ...m, isDeleted: true, text: 'This message was deleted', fileUrl: '' } : m)
      }));
    } catch (e) { alert('Failed to delete message'); }
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Are you sure you want to block ${activeThread.partner.name}?`)) return;
    try {
      const res = await messageService.block(activeThread.partner._id);
      setActiveThread(prev => ({ ...prev, partner: { ...prev.partner, isBlocked: res.blocked } }));
      fetchThreads(); // refresh list
      setHeaderMenuOpen(false);
    } catch(e) { alert('Failed to block user'); }
  };

  const handleReportUser = async () => {
    const reason = window.prompt("Why are you reporting this user?");
    if (!reason) return;
    try {
      await messageService.report(activeThread.partner._id, reason);
      alert('User reported successfully.');
      setHeaderMenuOpen(false);
    } catch(e) { alert('Failed to report user'); }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm('Delete entire conversation for you? This cannot be undone.')) return;
    try {
      await messageService.deleteConversation(activeThread.partner._id);
      setActiveThread(null);
      fetchThreads();
    } catch(e) { alert('Failed to delete conversation'); }
  };

  const getOther = (conn) => conn.sender?._id === user?._id ? conn.receiver : conn.sender;
  const circleMembers = connections.map(c => getOther(c)).filter(Boolean);
  const threadPartnerIds = new Set(threads.map(t => t.partner._id));
  
  const filteredCircleMembers = circleMembers.filter(p => 
    p.name?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const filteredThreads = threads.filter(t => 
    t.partner.name?.toLowerCase().includes(threadSearch.toLowerCase())
  );

  const isConnected = !activeThread?.partner || connections.some(c => 
    c.sender?._id === activeThread.partner._id || 
    c.receiver?._id === activeThread.partner._id
  );

  // Unread logic
  const firstUnreadIndex = activeThread?.messages.findIndex(m => !m.isRead && m.sender !== user._id && m.sender?._id !== user._id);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

          {/* Thread list panel */}
          <div style={{
            width: isMobile ? '100%' : 320,
            borderRight: isMobile ? 'none' : '1px solid var(--clr-border)',
            display: isMobile && showConversation ? 'none' : 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--clr-bg)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--clr-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Messages</h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setShowContacts(v => !v); setContactSearch(''); }}
                  title="Start a new conversation"
                >+ New</button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search conversations..." 
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {showContacts && (
                <div style={{ borderBottom: '1px solid var(--clr-border)', background: 'var(--clr-bg-elevated)' }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--clr-border)' }}>
                    <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      className="form-input" 
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', height: 'auto' }}
                    />
                  </div>
                  <div style={{ padding: '8px 14px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-faint)', letterSpacing: 1 }}>
                    My Circle
                  </div>
                  {filteredCircleMembers.length === 0 ? (
                     <div style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>No connections found.</div>
                  ) : filteredCircleMembers.map(person => (
                    <div
                      key={person._id}
                      onClick={() => startChatWithConnection(person)}
                      style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--clr-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="avatar-placeholder avatar-sm" style={{ flexShrink: 0 }}>{person.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{person.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{person.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loadingThreads ? (
                <div style={{ padding: 24, textAlign: 'center' }}><span className="spinner" /></div>
              ) : filteredThreads.length === 0 && !showContacts ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                  No conversations found.
                </div>
              ) : filteredThreads.map(thread => (
                <div
                  key={thread.partner._id}
                  onClick={() => openThread(thread)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                    background: activeThread?.partner._id === thread.partner._id ? 'var(--clr-primary-glow)' : 'transparent',
                    borderBottom: '1px solid var(--clr-border)', transition: 'background 0.2s',
                  }}
                >
                  <div className="avatar-placeholder avatar-sm" style={{ flexShrink: 0, width: 44, height: 44, fontSize: '1.2rem' }}>
                    {thread.partner.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontWeight: thread.unreadCount > 0 ? 700 : 600, fontSize: '0.95rem', color: 'var(--clr-text)' }}>{thread.partner.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-faint)' }}>
                        {thread.lastMessage?.createdAt && new Date(thread.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.85rem', color: thread.unreadCount > 0 ? 'var(--clr-text)' : 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: thread.unreadCount > 0 ? 600 : 400 }}>
                         {thread.lastMessage?.isDeleted ? '🚫 This message was deleted' : (thread.lastMessage?.text || (thread.lastMessage?.fileUrl ? '📎 Attachment' : '…'))}
                       </span>
                       {thread.unreadCount > 0 && (
                         <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{thread.unreadCount}</span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation panel */}
          <div style={{
            flex: 1,
            display: isMobile && !showConversation ? 'none' : 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--clr-bg-card)'
          }}>
            {!activeThread ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: '3.5rem' }}>💬</span>
                <h3 style={{ margin: 0 }}>Your Messages</h3>
                <p>Select a conversation or start a new one to begin.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--clr-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isMobile && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowConversation(false)} style={{ padding: '6px 10px', fontSize: '1.2rem', marginRight: -4 }}>←</button>
                    )}
                    <div className="avatar-placeholder avatar-sm" style={{ width: 40, height: 40 }}>{activeThread.partner.name?.[0]}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{activeThread.partner.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>
                         {activeThread.partner.role} {activeThread.partner.isBlocked ? ' • (Blocked)' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Header Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost" onClick={() => setHeaderMenuOpen(v => !v)} style={{ fontSize: '1.2rem', padding: '4px 10px' }}>⋮</button>
                    {headerMenuOpen && (
                      <div className="card" style={{ position: 'absolute', right: 0, top: '100%', padding: '8px 0', zIndex: 100, minWidth: 160, boxShadow: 'var(--shadow-lg)' }}>
                        <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '8px 16px' }} onClick={handleBlockUser}>
                          {activeThread.partner.isBlocked ? 'Unlock User' : 'Block User'}
                        </button>
                        <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '8px 16px', color: 'var(--clr-warning)' }} onClick={handleReportUser}>
                          Report User
                        </button>
                        <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '8px 16px', color: 'var(--clr-danger)' }} onClick={handleDeleteConversation}>
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div>
                  ) : activeThread.messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', marginTop: 40 }}>Say hello! 👋</div>
                  ) : activeThread.messages.map((msg, idx) => {
                    const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                    const showUnread = idx === firstUnreadIndex;
                    
                    return (
                      <div key={msg._id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {showUnread && (
                          <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
                            <div style={{ borderBottom: '1px solid var(--clr-primary)', position: 'absolute', top: '50%', left: 0, right: 0, opacity: 0.3 }}></div>
                            <span style={{ background: 'var(--clr-bg-card)', padding: '0 12px', fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 600, position: 'relative', textTransform: 'uppercase', letterSpacing: 1 }}>Unread Messages</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative' }} className="msg-row">
                          <div style={{
                            maxWidth: '75%', minWidth: 100, padding: '8px 12px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: msg.isDeleted ? 'transparent' : (isMine ? 'var(--clr-primary)' : 'var(--clr-bg)'),
                            color: msg.isDeleted ? 'var(--clr-text-faint)' : (isMine ? '#fff' : 'var(--clr-text)'),
                            border: msg.isDeleted ? '1px dashed var(--clr-border)' : (isMine ? 'none' : '1px solid var(--clr-border)'),
                            boxShadow: msg.isDeleted ? 'none' : 'var(--shadow-sm)',
                            fontSize: '0.95rem', lineHeight: 1.5, position: 'relative',
                            fontStyle: msg.isDeleted ? 'italic' : 'normal'
                          }}>
                            {/* Hover Actions */}
                            {!msg.isDeleted && (
                              <div className="msg-actions" style={{ position: 'absolute', top: 4, [isMine ? 'left' : 'right']: -35, display: 'flex', flexDirection: 'column', gap: 4, opacity: 0, transition: 'opacity 0.2s' }}>
                                <button className="btn btn-ghost btn-sm" style={{ padding: 4, background: 'var(--clr-bg-elevated)', borderRadius: '50%' }} title="Reply" onClick={() => setReplyToMsg(msg)}>↩️</button>
                                {isMine && <button className="btn btn-ghost btn-sm" style={{ padding: 4, background: 'var(--clr-bg-elevated)', borderRadius: '50%' }} title="Delete" onClick={() => handleDeleteMsg(msg._id)}>🗑️</button>}
                              </div>
                            )}

                            {/* Reply Block */}
                            {msg.replyTo && !msg.isDeleted && (
                              <div style={{ background: isMine ? 'rgba(255,255,255,0.2)' : 'var(--clr-bg-elevated)', padding: '6px 10px', borderRadius: 8, marginBottom: 8, fontSize: '0.8rem', borderLeft: `3px solid ${isMine ? '#fff' : 'var(--clr-primary)'}` }}>
                                <div style={{ fontWeight: 600, marginBottom: 2 }}>{msg.replyTo.sender === user._id ? 'You' : activeThread.partner.name}</div>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.replyTo.isDeleted ? 'Message deleted' : (msg.replyTo.text || 'Attachment')}</div>
                              </div>
                            )}

                            {/* Attachment Block */}
                            {msg.fileUrl && !msg.isDeleted && (
                              <div style={{ marginBottom: msg.text ? 8 : 0 }}>
                                {msg.fileType === 'image' ? (
                                  <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />
                                ) : (
                                  <a href={msg.fileUrl} download={msg.fileName} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: isMine ? 'rgba(255,255,255,0.1)' : 'var(--clr-bg-elevated)', borderRadius: 8, color: 'inherit', textDecoration: 'none' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.fileName || 'Document'}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.text}</p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && !msg.isDeleted && (
                                <span style={{ fontSize: '0.8rem', color: msg.isRead ? '#38bdf8' : 'rgba(255,255,255,0.7)', letterSpacing: -2, marginRight: 2 }}>✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                {activeThread.partner.isBlocked ? (
                  <div style={{ padding: '16px', background: 'var(--clr-bg)', color: 'var(--clr-danger)', textAlign: 'center', fontWeight: 500 }}>
                    You have blocked this user. Unblock them to send messages.
                  </div>
                ) : !isConnected ? (
                  <div style={{ padding: '16px', background: 'var(--clr-bg)', color: 'var(--clr-text-muted)', textAlign: 'center', fontWeight: 500 }}>
                    🔒 You can only message connections in your circle.
                  </div>
                ) : (
                  <div style={{ background: 'var(--clr-bg)', borderTop: '1px solid var(--clr-border)', padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Reply To Preview */}
                    {replyToMsg && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--clr-bg-elevated)', borderRadius: '8px 8px 0 0', borderLeft: '4px solid var(--clr-primary)' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 600 }}>Replying to {replyToMsg.sender === user._id ? 'yourself' : activeThread.partner.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{replyToMsg.text || 'Attachment'}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setReplyToMsg(null)}>✕</button>
                      </div>
                    )}
                    
                    {/* Attachment Preview */}
                    {attachment && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--clr-bg-elevated)', borderBottom: '1px solid var(--clr-border)' }}>
                        <span style={{ fontSize: '1.5rem' }}>{attachment.type === 'image' ? '🖼️' : '📄'}</span>
                        <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAttachment(null)}>✕</button>
                      </div>
                    )}

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
                      
                      {/* Emoji Picker Popover */}
                      {showEmojiPicker && (
                         <div className="card" style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 8, width: 220, zIndex: 10 }}>
                           {EMOJIS.map(em => (
                             <span key={em} style={{ cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => { setText(p => p + em); setShowEmojiPicker(false); }}>{em}</span>
                           ))}
                         </div>
                      )}
                      
                      <button type="button" className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => setShowEmojiPicker(v => !v)} title="Emojis">
                        😀
                      </button>

                      <button type="button" className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => fileInputRef.current?.click()} title="Attach file">
                        📎
                      </button>
                      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />

                      <input
                        type="text" className="form-input" style={{ flex: 1, borderRadius: 20 }}
                        placeholder="Type a message…"
                        value={text} onChange={e => setText(e.target.value)}
                        onFocus={() => setShowEmojiPicker(false)}
                      />
                      <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={sending || (!text.trim() && !attachment)}>
                        {sending ? '…' : '➤'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
