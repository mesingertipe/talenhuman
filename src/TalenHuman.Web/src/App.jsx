import React from 'react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Brands from './pages/Core/Brands'
import Stores from './pages/Core/Stores'
import Profiles from './pages/Core/Profiles'
import Employees from './pages/Core/Employees'
import Users from './pages/SuperAdmin/Users'
import Companies from './pages/SuperAdmin/Companies'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetForgottenPassword from './pages/ResetForgottenPassword'
import SelfServiceReset from './pages/SelfServiceReset';

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authView, setAuthView] = React.useState('login'); // 'login', 'forgot', 'reset'
  const [resetEmail, setResetEmail] = React.useState('');
  const [token, setToken] = React.useState(null); // Added token state

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); // Renamed to avoid conflict
    if (savedUser && storedToken) {
      setUser(JSON.parse(savedUser));
      setToken(storedToken); // Set token state
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = (userData, userToken) => { // Modified handleLogin to accept token
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken); // Set token state on login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null); // Clear token state on logout
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold">Iniciando TalenHuman...</div>;

  if (!token) {
    if (authView === 'forgot') {
        return <ForgotPassword
          onBack={() => setAuthView('login')}
          onNext={(email) => {
            setResetEmail(email);
            setAuthView('reset');
          }}
        />;
    }
    if (authView === 'reset') {
        return <ResetForgottenPassword
          email={resetEmail}
          onBack={() => setAuthView('login')}
        />;
    }
    if (authView === 'self-service') {
      return <SelfServiceReset onBack={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onForgotPassword={() => setAuthView('forgot')}
        onSelfServiceReset={() => setAuthView('self-service')}
      />
    );
  }

  if (user.mustChangePassword) {
    return <ResetPassword user={user} onPasswordChanged={(u) => setUser(u)} />;
  }

  const renderPage = () => {
    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    const isAdmin = user.roles?.includes('Admin');

    switch(currentPage) {
      case 'Marcas': 
        if (isSuperAdmin || isAdmin) return <Brands />;
        return <Dashboard />;
      case 'Tiendas': 
        if (isSuperAdmin || isAdmin) return <Stores />;
        return <Dashboard />;
      case 'Cargos': 
        if (isSuperAdmin || isAdmin) return <Profiles />;
        return <Dashboard />;
      case 'Empleados': return <Employees />;
      case 'Usuarios': 
        if (isSuperAdmin || isAdmin) return <Users />;
        return <Dashboard />;
      case 'Empresas': 
        if (isSuperAdmin) return <Companies />;
        return <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={currentPage} setPage={setCurrentPage} user={user} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  )
}

export default App
