import React, { useEffect, useState } from 'react'
import { createMongoAbility, AnyMongoAbility } from '@casl/ability'
import { AbilityProvider as CaslAbilityProvider } from '@casl/react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../redux/slices/authSlice'
import { RolePermissions } from '../types/user'

interface AbilityProviderProps {
  children: React.ReactNode
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({ children }) => {
  const user = useSelector(selectCurrentUser)
  const [ability, setAbility] = useState<AnyMongoAbility>(createMongoAbility([]))

  useEffect(() => {
    // Collect rules from user.policies
    // Since we just added this, user.policies might not exist on the Redux store yet
    let rules: any[] = []
    
    if (user?.system_role) {
      if (user.system_role === 'SUPER_ADMIN' || user.system_role === 'DEVELOPER') {
        rules = [{ action: 'manage', subject: 'all' }]
      } else {
        // Use predefined role permissions if available
        const predefinedPermissions = RolePermissions[user.system_role] || []
        rules = predefinedPermissions.map((p: string) => ({ action: p, subject: 'all' }))
      }
    } else if (user?.permissions) {
      // Fallback to explicit permissions array if no known role is found
      rules = user.permissions.map((p: string) => ({ action: p, subject: 'all' }))
    }

    setAbility(createMongoAbility(rules))
  }, [user])

  return (
    <CaslAbilityProvider value={ability}>
      {children}
    </CaslAbilityProvider>
  )
}
