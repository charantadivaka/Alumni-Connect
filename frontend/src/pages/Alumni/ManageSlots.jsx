import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { slotService } from '../../services/mentorshipService';
import '../../styles/Alumni/ManageSlots.css';

const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', duration: '45', type: 'Both' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const data = await slotService.getMy();
        setSlots(data);
      } catch (err) {
        setError(err.message || 'Failed to load slots.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.date || !form.startTime) { alert('Date and Start Time are required.'); return; }
    try {
      setCreating(true);
      const newSlot = await slotService.create(form);
      setSlots(prev => [...prev, newSlot]);
      setForm({ date: '', startTime: '', duration: '45', type: 'Both' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create slot.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await slotService.remove(id);
      setSlots(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete slot.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h1>My Availability Slots</h1>
            <p>Manage the times you are available for mentorship sessions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Add Slot'}
          </button>
        </div>

        {error && <div className="card" style={{ color: 'var(--clr-danger)', marginBottom: 20 }}>{error}</div>}

        {/* Create Slot Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>New Availability Slot</h3>
            <form onSubmit={handleCreate}>
              <div className="grid-2" style={{ gap: 15, marginBottom: 15 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" name="date" className="form-input" required value={form.date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="time" name="startTime" className="form-input" required value={form.startTime} onChange={handleChange} />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 15, marginBottom: 15 }}>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <select name="duration" className="form-input" value={form.duration} onChange={handleChange}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Session Type</label>
                  <select name="type" className="form-input" value={form.type} onChange={handleChange}>
                    <option value="Both">Both</option>
                    <option value="Mentorship">Mentorship Only</option>
                    <option value="Interview">Mock Interview Only</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Slot'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /> Loading...</div>
        ) : slots.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <h3>No Slots Added Yet</h3>
            <p className="text-muted">Add availability slots so students can book sessions with you.</p>
          </div>
        ) : (
          <div className="grid-2">
            {slots.map(slot => (
              <div key={slot._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>
                    {new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </h3>
                  <p className="text-muted" style={{ margin: '0 0 8px' }}>
                    🕐 {slot.startTime} &nbsp;|&nbsp; ⏱ {slot.duration} min
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-ghost">{slot.type}</span>
                    <span className={`badge ${slot.isBooked ? 'badge-danger' : 'badge-success'}`}>
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                  </div>
                </div>
                {!slot.isBooked && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} onClick={() => handleDelete(slot._id)}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageSlots;
