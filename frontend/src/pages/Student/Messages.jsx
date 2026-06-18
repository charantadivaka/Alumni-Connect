import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { connectionService } from '../../services/otherServices';

const Messages = () => {
  const { user } = useAuth();
  const [threads, setThreads]             = useState([]);
  const [connections, setConnections]     = useState([]);
  const [loadingThreads, setLoadingThreads]   = useState(true);
  const [activeThread, setActiveThread]   = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText]                   = useState('');
  const [sending, setSending]             = useState(false);
  const [showContacts, setShowContacts]   = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch threads + accepted connections (My Circle)
  useEffect(() => {
    Promise.all([messageService.getThreads(), connectionService.getMy()])
      .then(([threadsData, connsData]) => {
        setThreads(threadsData);
        setConnections(connsData.filter(c => c.status === 'Accepted'));
      })
      .catch(console.error)
      .finally(() => setLoadingThreads(false));
  }, []);

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
      await messageService.markRead(partnerId);
      setThreads(prev => prev.map(t => t.partner._id === partnerId ? { ...t, unreadCount: 0 } : t));
    } catch (err) { console.error(err); }
    finally { setLoadingMessages(false); }
  };

  // Open a new chat from a connection
  const startChatWithConnection = async (person) => {
    setShowContacts(false);
    try {
      setLoadingMessages(true);
      setActiveThread({ partner: person, messages: [] });
      const msgs = await messageService.getConversation(person._id);
      setActiveThread({ partner: person, messages: msgs });
      // ensure thread appears in list
      setThreads(prev => {
        if (prev.find(t => t.partner._id === person._id)) return prev;
        return [{ partner: person, unreadCount: 0, lastMessage: null }, ...prev];
      });
    } catch (err) { console.error(err); }
    finally { setLoadingMessages(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;
    try {
      setSending(true);
      const msg = await messageService.send({ receiverId: activeThread.partner._id, text: text.trim() });
      setActiveThread(prev => ({ ...prev, messages: [...prev.messages, msg] }));
      setText('');
      setThreads(prev => {
        const existing = prev.find(t => t.partner._id === activeThread.partner._id);
        if (existing) {
          return [{ ...existing, lastMessage: { text: msg.text, createdAt: msg.createdAt } }, ...prev.filter(t => t.partner._id !== activeThread.partner._id)];
        }
        return [{ partner: activeThread.partner, unreadCount: 0, lastMessage: { text: msg.text, createdAt: msg.createdAt } }, ...prev];
      });
    } catch (err) { alert(err.message || 'Failed to send message.'); }
    finally { setSending(false); }
  };

  // Connections not yet in threads (to start new chats)
  const getOther = (conn) => conn.sender?._id === user?._id ? conn.receiver : conn.sender;
  const circleMembers = connections.map(c => getOther(c)).filter(Boolean);
  const threadPartnerIds = new Set(threads.map(t => t.partner._id));
  const newContactCandidates = circleMembers.filter(p => !threadPartnerIds.has(p._id));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-w)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'margin-left 0.28s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

          {/* Thread list panel */}
          <div style={{ width: 280, borderRight: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Messages</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowContacts(v => !v)}
                title="Start a new conversation with someone in My Circle"
              >
                + New
              </button>
            </div>

            {/* My Circle contacts picker */}
            {showContacts && (
              <div style={{ borderBottom: '1px solid var(--clr-border)', background: 'var(--clr-bg-elevated)', maxHeight: 220, overflowY: 'auto' }}>
                <div style={{ padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-faint)', letterSpacing: 1 }}>
                  My Circle
                </div>
                {circleMembers.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    No connections yet. Add people in Network.
                  </div>
                ) : circleMembers.map(person => (
                  <div
                    key={person._id}
                    onClick={() => startChatWithConnection(person)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                      borderBottom: '1px solid var(--clr-border)', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg-card)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="avatar-placeholder avatar-sm" style={{ width: 32, height: 32, fontSize: '0.8rem', flexShrink: 0 }}>
                      {person.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{person.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>{person.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Thread list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingThreads ? (
                <div style={{ padding: 24, textAlign: 'center' }}><span className="spinner" /></div>
              ) : threads.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                  No conversations yet.<br /><br />
                  Click <strong>+ New</strong> to message someone from your circle.
                </div>
              ) : threads.map(thread => (
                <div
                  key={thread.partner._id}
                  onClick={() => openThread(thread)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                    background: activeThread?.partner._id === thread.partner._id ? 'var(--clr-primary-glow)' : 'transparent',
                    borderBottom: '1px solid var(--clr-border)', transition: 'background 0.15s',
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
                      {thread.lastMessage?.text?.substring(0, 40) || '…'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {!activeThread ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: '2.5rem' }}>💬</span>
                <p>Select a conversation or start a new one from <strong>My Circle</strong></p>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar-placeholder avatar-sm" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                    {activeThread.partner.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{activeThread.partner.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>{activeThread.partner.role}</p>
                  </div>
                </div>
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
                <form onSubmit={handleSend} style={{ padding: '12px 20px', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: 10 }}>
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    placeholder="Type a message…"
                    value={text} onChange={e => setText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
