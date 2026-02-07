import { useAuth0 } from '@auth0/auth0-react'
import Dashboard from './pages/Dashboard'

function App() {
  const { isLoading } = useAuth0()

  if (isLoading) return <div>Loading...</div>

  return <Dashboard />
}

export default App