import { useAuth0 } from '@auth0/auth0-react'
import TeachMode from '../components/TeachMode'

function Dashboard() {
  const { user, loginWithRedirect, logout } = useAuth0()

  if (!user) {
    return <button onClick={() => loginWithRedirect()}>Login</button>
  }

  return (
    <div>
      <button onClick={() => logout()}>Logout</button>
      <TeachMode />
    </div>
  )
}

export default Dashboard