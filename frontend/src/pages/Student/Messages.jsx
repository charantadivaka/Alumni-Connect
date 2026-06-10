import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';

const Messages = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null); // { partner: {...}, messages: [...] }
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // New Chat Modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatId, setNewChatId] = useState('');

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await messageService.getThreads();
        setThreads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingThreads(false);
      }
    };
    fetchThreads();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const openThread = async (thread) => {
    const partnerId = thread.partner._id;
    try {
      setLoadingMessages(true);
      setActiveThread({ partner: thread.partner, messages: [] });
      const msgs = await messageService.getConversation(partnerId);
      setActiveThread({ partner: thread.partner, messages: msgs });
      // mark as read
      await messageService.markRead(partnerId);
      // update unread count in thread list
      setThreads(prev => prev.map(t => t.partner._id === partnerId ? { ...t, unreadCount: 0 } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;
    try {
      setSending(true);
      const msg = await messageService.send({ receiverId: activeThread.partner._id, text: text.trim() });
      setActiveThread(prev => ({ ...prev, messages: [...prev.messages, msg] }));
      setText('');
      // Update thread preview
      setThreads(prev => {
        const existing = prev.find(t => t.partner._id === activeThread.partner._id);
        if (existing) {
          return [{ ...existing, lastMessage: { text: msg.text, createdAt: msg.createdAt } }, ...prev.filter(t => t.partner._id !== activeThread.partner._id)];
        } else {
          return [{ partner: activeThread.partner, unreadCount: 0, lastMessage: { text: msg.text, createdAt: msg.createdAt } }, ...prev];
        }
      });
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async (e) => {
    e.preventDefault();
    if (!newChatId.trim()) return;
    try {
      const msgs = await messageService.getConversation(newChatId.trim());
      setActiveThread({ partner: { _id: newChatId.trim(), name: 'User' }, messages: msgs });
      setShowNewChat(false);
      setNewChatId('');
    } catch (err) {
      alert(err.message || 'Could not find user or start conversation. Ensure the ID is correct.');
    }
  };

  // Block sending only if: conversation has exactly 1 message AND it was sent by me (other person never replied)
  const partnerHasReplied = activeThread?.messages.some(m => {
    const senderId = m.sender?._id || m.sender;
    return senderId !== user._id && senderId?.toString() !== user._id?.toString();
  });
  const isFirstMessageMine = activeThread?.messages.length === 1 && 
    (activeThread.messages[0].sender === user._id || 
     activeThread.messages[0].sender?._id === user._id ||
     activeThread.messages[0].sender?.toString() === user._id?.toString());
  const isInitiatorWaiting = isFirstMessageMine && !partnerHasReplied;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-w)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          {/* Thread List */}
          <div style={{ width: 280, borderRight: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Messages</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewChat(true)} title="New Conversation">+</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingThreads ? (
                <div style={{ padding: 24, textAlign: 'center' }}><span className="spinner" /></div>
              ) : threads.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
                  No conversations yet. <br/><br/>Click the '+' icon above and paste a User ID to start chatting!
                </div>
              ) : threads.map(thread => (
                <div
                  key={thread.partner._id}
                  onClick={() => openThread(thread)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                    background: activeThread?.partner._id === thread.partner._id ? 'var(--clr-primary-glow)' : 'transparent',
                    borderBottom: '1px solid var(--clr-border)',
                    transition: 'background 0.15s'
                  }}
                >
                  <div className="avatar-placeholder avatar-sm" style={{ flexShrink: 0, width: 36, height: 36, fontSize: '0.875rem' }}>
                    {thread.partner.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: thread.unreadCount > 0 ? 700 : 500, fontSize: '0.875rem' }}>{thread.partner.name}</span>
                      {thread.unreadCount > 0 && (
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{thread.unreadCount}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {thread.lastMessage?.text?.substring(0, 40) || '...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {!activeThread ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: '2.5rem' }}>💬</span>
                <p>Select a conversation or start a new one</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar-placeholder avatar-sm" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                    {activeThread.partner.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{activeThread.partner.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>{activeThread.partner.role}</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div>
                  ) : activeThread.messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', marginTop: 40 }}>No messages yet. Say hello! 👋</div>
                  ) : activeThread.messages.map(msg => {
                    const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                    return (
                      <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMine ? 'var(--clr-primary)' : 'var(--clr-bg-card)',
                          color: isMine ? '#fff' : 'var(--clr-text)',
                          border: isMine ? 'none' : '1px solid var(--clr-border)',
                          fontSize: '0.9rem', lineHeight: 1.5,
                        }}>
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={{ padding: '12px 20px', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={isInitiatorWaiting ? "Waiting for response..." : "Type a message..."}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={isInitiatorWaiting}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !text.trim() || isInitiatorWaiting}>
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 400, padding: 30, position: 'relative' }}>
              <button onClick={() => setShowNewChat(false)}
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                ✕
              </button>
              <h3 style={{ marginBottom: 16 }}>Start New Conversation</h3>
              <p className="text-sm text-muted" style={{ marginBottom: 20 }}>Paste the User ID of the person you want to message.</p>
              <form onSubmit={handleStartNewChat} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input type="text" className="form-input" required value={newChatId} onChange={e => setNewChatId(e.target.value)} placeholder="e.g. 64b9a8f27..." />
                <button type="submit" className="btn btn-primary">Start Chat</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
