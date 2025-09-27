"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRow } from './user-row'
import { UserFilters } from './user-filters'

import type { UserProfile } from '@/hooks/use-users'

interface User extends Omit<UserProfile, 'id'> {
  id: string
  role: 'admin' | 'supervisor' | 'operario'
}

interface UserTableProps {
  users: User[]
  currentUserId?: string
  searchTerm: string
  onSearchChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
}

export function UserTable({
  users,
  currentUserId,
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onEditUser,
  onDeleteUser
}: UserTableProps) {
  return (
    <Card>
      <CardHeader>        
        <UserFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          roleFilter={roleFilter}
          onRoleFilterChange={onRoleFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader >
              <TableRow className="hover:bg-background">
                <TableHead className="min-w-[200px]">Usuario</TableHead>
                <TableHead className="text-center min-w-[120px]">Rol</TableHead>
                <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    onEdit={onEditUser}
                    onDelete={onDeleteUser}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}