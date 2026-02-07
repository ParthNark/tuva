import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-react'

const apiUrl = import.meta.env.VITE_API_URL

const client = axios.create({
  baseURL: apiUrl,
})

export const useApiClient = () => {
  const { getAccessTokenSilently } = useAuth0()

  client.interceptors.request.use(async (config) => {
    const token = await getAccessTokenSilently()
    config.headers.Authorization = `Bearer ${token}`
    return config
  })

  return client
}

export default client