import React from 'react';
import '../../styles/Shared/PublicFooter.css';

export const PublicFooter = () => (
  <footer className="public-footer">
    <div className="public-footer-container">
      <div className="public-footer-logo">
        <span className="logo-icon">🎓</span>
        <span className="logo-text">AlumniConnect</span>
      </div>
      <div className="public-footer-copyright">
        © {new Date().getFullYear()} AlumniConnect. All rights reserved.
      </div>
    </div>
  </footer>
);
