import { Link } from 'react-router-dom';
import '../../styles/Shared/NotFound.css';

const NotFound = () => (
  <div className="error-page">
    <div className="error-page-icon error-page-icon--xl">🌌</div>
    <h1 className="error-page-404">404</h1>
    <h2 className="error-page-title">Page Not Found</h2>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn btn-primary error-page-cta">Go Home</Link>
  </div>
);

export default NotFound;
