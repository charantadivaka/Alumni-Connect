import React from 'react';
import './ui.css';

export const Card = ({ children, className = '' }) => (
    <div className={`ui-card ${className}`}>{children}</div>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => (
    <button className={`ui-btn ui-btn--${variant} ${className}`} {...props}>
        {children}
    </button>
);

export const Input = ({ label, id, error, className = '', ...props }) => (
    <div className={`ui-input-group ${className}`}>
        {label && <label htmlFor={id}>{label}</label>}
        <input id={id} className="ui-input" {...props} />
        {error && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }}>{error}</span>}
    </div>
);

export const Textarea = ({ label, id, error, className = '', ...props }) => (
    <div className={`ui-input-group ${className}`}>
        {label && <label htmlFor={id}>{label}</label>}
        <textarea id={id} className="ui-textarea" {...props} />
        {error && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }}>{error}</span>}
    </div>
);

export const Badge = ({ children, variant = 'primary', className = '' }) => (
    <span className={`ui-badge ui-badge--${variant} ${className}`}>{children}</span>
);

export const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-xl)' }}>
        <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--clr-border)',
            borderTopColor: 'var(--clr-primary)',
            animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

export const Modal = ({ open, onClose, title, children }) => {
    if (!open) return null;
    return (
        <div className="ui-modal-overlay" onClick={onClose}>
            <div className="ui-modal-content" onClick={e => e.stopPropagation()}>
                {title && <h2 style={{ marginTop: 0, marginBottom: 'var(--sp-lg)' }}>{title}</h2>}
                {children}
            </div>
        </div>
    );
};

export const SkeletonCard = () => (
    <div className="ui-card">
        <div className="ui-skeleton" style={{ height: 20, width: '60%', marginBottom: 16 }} />
        <div className="ui-skeleton" style={{ height: 16, width: '40%', marginBottom: 24 }} />
        <div className="ui-skeleton" style={{ height: 60, width: '100%', marginBottom: 16 }} />
        <div className="ui-skeleton" style={{ height: 36, width: '30%' }} />
    </div>
);

export const EmptyState = ({ icon = '📭', title, message }) => (
    <div style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-md)' }}>{icon}</div>
        <h3 style={{ color: 'var(--clr-text)', marginBottom: 'var(--sp-sm)' }}>{title}</h3>
        <p>{message}</p>
    </div>
);

export const ErrorBanner = ({ error }) => {
    if (!error) return null;
    return (
        <div style={{ 
            background: 'rgba(248, 113, 113, 0.1)', 
            color: 'var(--clr-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--r-sm)',
            borderLeft: '4px solid var(--clr-danger)',
            marginBottom: 'var(--sp-md)'
        }}>
            {error}
        </div>
    );
};
