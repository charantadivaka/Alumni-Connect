import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Shared/Unauthorized.css';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="error-page">
      <div className="error-page-icon">🔒</div>
      <h2 className="error-page-title">Access Denied</h2>
      <p>You don't have permission to view this page.</p>
      <div className="error-page-actions">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Go Back</button>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
};

export default Unauthorized;
