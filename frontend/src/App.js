import React, { useState, useEffect } from 'react';
import { adminConfig, portfolioApiConfig } from './config';
import CrmDashboard from './components/CrmDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for portfolio token (same auth as adriengourier.com)
    const token = localStorage.getItem('portfolio_token');
    const email = localStorage.getItem('portfolio_email');
    
    if (!token || !email) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Verify token with portfolio API
      const response = await fetch(`${portfolioApiConfig.baseUrl}/auth/verify`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token invalid, clear it
        localStorage.removeItem('portfolio_token');
        localStorage.removeItem('portfolio_email');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.valid) {
        setUser({ email, name: email });
        setIsAuthenticated(true);
        setIsAdmin(adminConfig.adminEmails.includes(email));
        
        // Store token for CRM API calls (use same token)
        localStorage.setItem('idToken', token);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    // Clear all auth tokens
    localStorage.removeItem('portfolio_token');
    localStorage.removeItem('portfolio_email');
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
