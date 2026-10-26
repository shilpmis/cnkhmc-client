import { useMemo } from "react"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import type { ModuleId, PolicyAction } from "./catalog"
import { buildPolicyAbility, roleGrantsModule } from "./policyAbility"

export type CanAction = PolicyAction | "export" | "import"

/**
 * Action-level check for buttons and menus, e.g. can("create", "Student").
 *
 * A user can act when their ROLE already gives them the module (existing behaviour, unchanged) or
 * when one of their permission templates allows that action on the module. Exporting counts as
 * read and importing counts as create.
 */
export function useCan() {
  const user = useSelector(selectCurrentUser)
  const ability = useMemo(() => buildPolicyAbility(user?.policies), [user?.policies])

  const can = (action: CanAction, module: ModuleId): boolean => {
    if (!user) return false
    if (roleGrantsModule(user, module)) return true
    const mapped: PolicyAction = action === "export" ? "read" : action === "import" ? "create" : action
    return ability.can(mapped, module)
  }

  /** Template grants only (ignores the role). Use with an existing role check: roleOk || canByTemplate(...). */
  const canByTemplate = (action: CanAction, module: ModuleId): boolean => {
    if (!user) return false
    const mapped: PolicyAction = action === "export" ? "read" : action === "import" ? "create" : action
    return ability.can(mapped, module)
  }

  return { can, canByTemplate }
}
