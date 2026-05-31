import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import useAuthStore from '../store/auth'

export default function Meetings() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [attendeeIds, setAttendeeIds] = useState('') // comma-separated UUIDs

  const canCreate = ['ADMIN','SENIOR_TL','TL'].includes(user?.role)

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/meetings', data),
    onSuccess: () => { queryClient.invalidateQueries('meetings'); setShowForm(false); }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/meetings/${id}`),
    onSuccess: () => queryClient.invalidateQueries('meetings')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const ids = attendeeIds.split(',').map(s => s.trim()).filter(Boolean)
    createMutation.mutate({ title, description, meetingDate, startTime, endTime, attendeeIds: ids })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Meetings</h2>
      {canCreate && (
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
          {showForm ? 'Cancel' : 'Schedule Meeting'}
        </button>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-2">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" />
          <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="border p-2 w-full" required />
          <div className="flex gap-2">
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border p-2" />
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border p-2" />
          </div>
          <input type="text" placeholder="Attendee IDs (comma separated)" value={attendeeIds} onChange={e => setAttendeeIds(e.target.value)} className="border p-2 w-full" />
          <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">Create</button>
        </form>
      )}

      {isLoading && <p>Loading...</p>}
      {meetings?.map(m => (
        <div key={m.id} className="bg-white p-3 rounded shadow mb-2">
          <h3 className="font-bold">{m.title}</h3>
          <p>{m.description}</p>
          <p className="text-sm">Date: {m.meeting_date} {m.start_time ? `at ${m.start_time}` : ''}{m.end_time ? ` - ${m.end_time}` : ''}</p>
          {m.created_by === user?.id && (
            <button onClick={() => deleteMutation.mutate(m.id)} className="text-red-500 text-sm mt-1">Delete</button>
          )}
        </div>
      ))}
    </div>
  )
}
