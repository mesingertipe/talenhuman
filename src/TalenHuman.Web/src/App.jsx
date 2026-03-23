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

function App() {
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState('Dashboard');
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-bold">Iniciando TalenHuman...</div>;

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
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
