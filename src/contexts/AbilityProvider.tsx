import React, { useEffect, useState } from 'react'
import { createMongoAbility, AnyMongoAbility } from '@casl/ability'
import { AbilityProvider as CaslAbilityProvider } from '@casl/react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../redux/slices/authSlice'
import { RolePermissions } from '../types/user'
import { normalizeRules } from '../permissions/policyAbility'

interface AbilityProviderProps {
  children: React.ReactNode
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({ children }) => {
  const user = useSelector(selectCurrentUser)
  const [ability, setAbility] = useState<AnyMongoAbility>(createMongoAbility([]))

  useEffect(() => {
    let rules: any[] = []

    // 1. Always include base role default permissions
    if (user?.system_role) {
      if (user.system_role === 'SUPER_ADMIN' || user.system_role === 'DEVELOPER') {
        rules.push({ action: 'manage', subject: 'all' })
      } else {
        const predefinedPermissions = RolePermissions[user.system_role] || []
        rules.push(...predefinedPermissions.map((p: string) => ({ action: p, subject: 'all' })))
      }
    } else if (user?.permissions && Array.isArray(user.permissions)) {
      rules.push(...user.permissions.map((p: string) => ({ action: p, subject: 'all' })))
    }

    // 2. Supplement with the user's permission templates (subjects normalised to catalog modules,
    //    so "Inventory" and "DeadStock" are the same module; deny rules are applied last)
    rules.push(...normalizeRules(user?.policies))

    setAbility(createMongoAbility(rules))
  }, [user])

  return (
    <CaslAbilityProvider value={ability}>
      {children}
    </CaslAbilityProvider>
  )
}
