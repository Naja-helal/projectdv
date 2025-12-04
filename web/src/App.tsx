import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import ExpectedExpenses from './pages/ExpectedExpenses'
import Categories from './pages/CategoriesNew'
import ProjectItems from './pages/ProjectItems'
import PaymentMethods from './pages/PaymentMethods'
import Units from './pages/Units'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import ProjectsPage from './pages/active/projects/ProjectsPage'
import ProjectDetailsPage from './pages/active/projects/ProjectDetailsPage'
import ProjectSharedPage from './pages/active/projects/ProjectSharedPage'
import StatisticsPage from './pages/StatisticsPage'
import ChartsPage from './pages/ChartsPage'
import BackupsPage from './pages/BackupsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Public shared project page - no authentication required */}
      <Route path="/projects/:id/shared" element={<ProjectSharedPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/expected-expenses" element={<ExpectedExpenses />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/project-items" element={<ProjectItems />} />
              <Route path="/payment-methods" element={<PaymentMethods />} />
              <Route path="/units" element={<Units />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/backups" element={<BackupsPage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
