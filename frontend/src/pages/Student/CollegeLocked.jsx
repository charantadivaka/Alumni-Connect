import { useAuth } from '../../context/AuthContext';
import '../../styles/Shared/Unauthorized.css'; // We can reuse the unauthorized styles

const CollegeLocked = () => {
  const { logout } = useAuth();

  return (
    <div className="error-page" style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="error-page-icon">🏢🚫</div>
      <h2 className="error-page-title" style={{ color: 'var(--clr-danger)' }}>College Subscription Expired</h2>
      <p style={{ maxWidth: '500px', margin: '1rem auto', fontSize: '1.1rem', lineHeight: 1.5 }}>
        Your college's subscription to the platform has expired. Student access is currently <strong>disabled</strong> until the administration renews the subscription.
      </p>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Please contact your college administration or placement cell for more information.
      </p>
      <div className="error-page-actions" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
};

export default CollegeLocked;
