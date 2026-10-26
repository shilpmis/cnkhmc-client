import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { ModuleId } from "./catalog"
import { useCan, type CanAction } from "./useCan"

interface RequireActionProps {
  action: CanAction
  module: ModuleId
  children: ReactNode
}

/**
 * Wraps a page that only makes sense for one action (a "create" or "edit" screen).
 * Users whose role or permission template does not allow the action see a short notice instead.
 */
export function RequireAction({ action, module, children }: RequireActionProps) {
  const { can } = useCan()
  const navigate = useNavigate()

  if (can(action, module)) return <>{children}</>

  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold">You do not have access to this action</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your role or permission template allows viewing here, but not to {action} in this area.
      </p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
        Go back
      </Button>
    </div>
  )
}

export default RequireAction
