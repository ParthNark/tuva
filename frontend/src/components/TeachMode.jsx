import { useState } from 'react'
import { useApiClient } from '../api/client'

function TeachMode() {
  const [lesson, setLesson] = useState('')
  const [response, setResponse] = useState('')
  const api = useApiClient()

  const handleTeach = async () => {
    const res = await api.post('/teach', { lesson })
    setResponse(res.data.response)
  }

  return (
    <div>
      <textarea value={lesson} onChange={(e) => setLesson(e.target.value)} />
      <button onClick={handleTeach}>Teach</button>
      <p>{response}</p>
    </div>
  )
}

export default TeachMode