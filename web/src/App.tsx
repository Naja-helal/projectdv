import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Categories from './pages/CategoriesNew'
import ProjectItems from './pages/ProjectItems'
import PaymentMethods from './pages/PaymentMethods'
import ProjectTypes from './pages/ProjectTypes'
import ProjectsPage from './pages/active/projects/ProjectsPage'
import ProjectDetailsPage from './pages/active/projects/ProjectDetailsPage'
import StatisticsPage from './pages/StatisticsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/project-items" element={<ProjectItems />} />
              <Route path="/payment-methods" element={<PaymentMethods />} />
              <Route path="/project-types" element={<ProjectTypes />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
