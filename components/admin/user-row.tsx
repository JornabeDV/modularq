"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableRow, TableCell } from '@/components/ui/table'
import { Edit, Shield, Users, Wrench } from 'lucide-react'
import { DeleteUserButton } from './delete-user-button'

import type { UserProfile } from '@/hooks/use-users'

interface User extends Omit<UserProfile, 'id'> {
  id: string
  role: 'admin' | 'supervisor' | 'operario'
}

interface UserRowProps {
  user: User
  currentUserId?: string
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

export function UserRow({ user, currentUserId, onEdit, onDelete }: UserRowProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'supervisor':
        return <Users className="h-4 w-4" />
      case 'operario':
        return <Wrench className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'supervisor':
        return 'default'
      case 'operario':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleEdit = () => {
    onEdit(user)
  }

  const handleDelete = () => {
    onDelete(user.id)
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{user.name}</div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getRoleColor(user.role)}>
          {getRoleIcon(user.role)}
          <span className="ml-1 capitalize">{user.role}</span>
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <DeleteUserButton
            userId={user.id}
            userName={user.name}
            currentUserId={currentUserId}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}