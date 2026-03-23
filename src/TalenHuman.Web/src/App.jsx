import Brands from './pages/Core/Brands'
import Stores from './pages/Core/Stores'
import Profiles from './pages/Core/Profiles'
import Employees from './pages/Core/Employees'

function App() {
  const [currentPage, setCurrentPage] = React.useState('Dashboard');

  const renderPage = () => {
    switch(currentPage) {
      case 'Marcas': return <Brands />;
      case 'Tiendas': return <Stores />;
      case 'Cargos': return <Profiles />;
      case 'Empleados': return <Employees />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={currentPage} setPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
