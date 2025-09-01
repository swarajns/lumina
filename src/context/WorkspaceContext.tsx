// contexts/WorkspaceContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Account {
  id: string
  name: string
  plan_id: string
  plan_name: string
  max_users: number
  max_storage_gb: number
  current_users_count: number
  subscription_status: string
}

interface Workspace {
  id: string
  account_id: string
  name: string
  slug: string
  current_users_count: number
  account?: Account
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  currentAccount: Account | null
  workspaces: Workspace[]
  switchWorkspace: (workspaceId: string) => Promise<void>
  canInviteUsers: () => boolean
  remainingUserSlots: () => number
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    fetchWorkspaceData()
  }, [])

  const fetchWorkspaceData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's current workspace
    const { data: userData } = await supabase
      .from('users')
      .select(`
        workspace_id,
        workspaces (
          id,
          name,
          slug,
          account_id,
          current_users_count,
          accounts (
            id,
            name,
            plan_id,
            plan_name,
            max_users,
            max_storage_gb,
            subscription_status,
            current_users_count
          )
        )
      `)
      .eq('id', user.id)
      .single()

    if (userData?.workspaces) {
      setCurrentWorkspace(userData.workspaces)
      setCurrentAccount(userData.workspaces.accounts)
    }

    // Get all workspaces user has access to
    const { data: allWorkspaces } = await supabase
      .from('users')
      .select(`
        workspaces (
          id,
          name,
          slug,
          account_id,
          current_users_count
        )
      `)
      .eq('id', user.id)

    if (allWorkspaces) {
      setWorkspaces(allWorkspaces.map(w => w.workspaces))
    }
  }

  const switchWorkspace = async (workspaceId: string) => {
    // Implementation to switch workspace context
  }

  const canInviteUsers = () => {
    if (!currentAccount || !currentWorkspace) return false
    return currentAccount.current_users_count < currentAccount.max_users
  }

  const remainingUserSlots = () => {
    if (!currentAccount) return 0
    return Math.max(0, currentAccount.max_users - currentAccount.current_users_count)
  }

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      currentAccount,
      workspaces,
      switchWorkspace,
      canInviteUsers,
      remainingUserSlots
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
