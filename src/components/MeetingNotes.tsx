'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  StickyNote,
  MessageSquare 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'

interface Note {
  id: string
  meeting_id: string
  content: string
  created_at: string
  updated_at: string
}

interface MeetingNotesProps {
  meetingId: string
  className?: string
}

export default function MeetingNotes({ meetingId, className = '' }: MeetingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [meetingId])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      setAdding(true)
      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          meeting_id: meetingId, 
          content: newNote.trim() 
        }])
        .select()
        .single()

      if (error) throw error

      setNotes([data, ...notes])
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setAdding(false)
    }
  }

  const updateNote = async (id: string, content: string) => {
    if (!content.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setNotes(notes.map(note => 
        note.id === id ? data : note
      ))
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotes(notes.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const startEditing = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Meeting Notes
          <span className="text-sm font-normal text-gray-500">
            ({notes.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this meeting..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                addNote()
              }
            }}
          />
          <Button
            onClick={addNote}
            disabled={!newNote.trim() || adding}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {adding ? 'Adding...' : 'Add Note'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Ctrl+Enter to add quickly
          </p>
        </div>

        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notes yet</p>
              <p className="text-sm text-gray-400">
                Add your first note above to get started
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 transition-all hover:shadow-sm"
              >
                {editingId === note.id ? (
                  // Editing Mode
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateNote(note.id, editContent)}
                        disabled={!editContent.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <p className="text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(note.created_at)}
                        {note.updated_at !== note.created_at && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNote(note.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
