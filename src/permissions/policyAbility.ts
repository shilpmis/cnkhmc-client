import { createMongoAbility, type AnyMongoAbility, type RawRuleOf } from "@casl/ability"
import { Permission, RolePermissions, UserRole } from "@/types/user"
import type { PolicyRule, PolicyTemplate, User } from "@/types/user"
import { MODULE_ROLES, PERMISSION_MODULE, SUBJECT_ALIASES, type ModuleId } from "./catalog"

/**
 * Evaluates the permission templates assigned to a user.
 *
 * Rules from every assigned template are combined. Subjects are mapped onto catalog modules
 * (so "Room" and "Bed" count as Hostel), "manage" covers every action, and a deny (inverted) rule
 * always wins over an allow rule, whichever template it came from.
 */

type Rule = RawRuleOf<AnyMongoAbility>

const toList = (value: string | string[] | undefined): string[] =>
  Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]

export function normalizeSubject(subject: string): string {
  const key = String(subject).trim().toLowerCase()
  if (key === "all" || key === "*") return "all"
  return SUBJECT_ALIASES[key] ?? String(subject).trim()
}

export function normalizeRules(policies: PolicyTemplate[] | undefined | null): Rule[] {
  const allow: Rule[] = []
  const deny: Rule[] = []

  for (const policy of policies ?? []) {
    if (!Array.isArray(policy?.rules)) continue
    for (const rule of policy.rules as PolicyRule[]) {
      const actions = toList(rule.action)
      const subjects = toList(rule.subject).map(normalizeSubject)
      if (actions.length === 0 || subjects.length === 0) continue
      const normalized: Rule = { action: actions, subject: subjects }
      if (rule.inverted) deny.push({ ...normalized, inverted: true })
      else allow.push(normalized)
    }
  }

  // CASL lets a later rule override an earlier one, so denies go last.
  return [...allow, ...deny]
}

export function buildPolicyAbility(policies: PolicyTemplate[] | undefined | null): AnyMongoAbility {
  return createMongoAbility(normalizeRules(policies))
}

const ACCESS_ACTIONS = ["read", "create", "update", "delete"] as const

/** True when the template allows at least one action on the module (enough to open its screens). */
export function canAccessModule(ability: AnyMongoAbility, module: ModuleId): boolean {
  return ACCESS_ACTIONS.some((action) => ability.can(action, module))
}

/** Module access a user already has through their role, independent of templates. */
export function roleGrantsModule(user: Pick<User, "system_role" | "permissions"> | null, module: ModuleId): boolean {
  if (!user) return false
  if (user.system_role === UserRole.SUPER_ADMIN || user.system_role === UserRole.DEVELOPER) return true
  const rolePermissions: Permission[] = [
    ...(user.system_role ? RolePermissions[user.system_role as UserRole] ?? [] : []),
    ...((user.permissions ?? []) as Permission[]),
  ]
  if (rolePermissions.some((p) => PERMISSION_MODULE[p] === module)) return true
  // roles the page guards already let into this module
  return !!user.system_role && (MODULE_ROLES[module] ?? []).includes(user.system_role as UserRole)
}
