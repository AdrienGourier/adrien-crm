import React, { useState, useEffect } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { cognitoConfig, adminConfig } from './config';
import CrmDashboard from './components/CrmDashboard';

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId: cognitoConfig.clientId,
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
      cognitoUser.getSession((err, session) => {
        if (err || !session.isValid()) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Get user attributes
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            console.error('Error getting user attributes:', err);
            setLoading(false);
            return;
          }

          const email = attributes.find(attr => attr.Name === 'email')?.Value;
          const name = attributes.find(attr => attr.Name === 'name')?.Value || email;
          
          setUser({ email, name });
          setIsAuthenticated(true);
          setIsAdmin(adminConfig.adminEmails.includes(email));
          
          // Store token for API calls
          const idToken = session.getIdToken().getJwtToken();
          localStorage.setItem('idToken', idToken);
          
          setLoading(false);
        });
      });
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    localStorage.removeItem('idToken');
    // Redirect back to main portfolio site
    window.location.href = 'https://adriengourier.com';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px' }}>Authentication Required</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Please log in through adriengourier.com to access the CRM.
          </p>
          <a 
            href="https://adriengourier.com" 
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Go to adriengourier.com
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--color-danger)' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            This CRM is only accessible to administrators.
            <br />
            Logged in as: {user?.email}
          </p>
          <button onClick={handleLogout} className="btn btn-secondary">
            Return to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return <CrmDashboard user={user} onLogout={handleLogout} />;
}

export default App;
