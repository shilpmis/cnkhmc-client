import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import type { AcademicSession } from "@/types/user"
import { cn } from "@/lib/utils"

/**
 * Lets a page look at another academic session without changing the session for the whole app (the
 * selector in the header). A page wraps itself in <PageAcademicSessionProvider>; every component inside
 * that reads the session through useAcademicSession() then follows the page's choice. Outside such a
 * page, useAcademicSession() is the header's session, exactly as before.
 *
 * The page starts on the header's session, keeps its own choice while the user moves around (per tab,
 * in sessionStorage), and follows the header again whenever the header's session is changed.
 */

type PageAcademicSessionValue = {
  session: AcademicSession
  sessions: AcademicSession[]
  setSessionId: (id: number) => void
  /** True when the page is showing a different session from the header */
  differsFromGlobal: boolean
}

const PageAcademicSessionContext = createContext<PageAcademicSessionValue | null>(null)

const readStored = (key: string): number | null => {
  try {
    const value = Number(sessionStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

const writeStored = (key: string, id: number | null) => {
  try {
    if (id === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, String(id))
  } catch {
    // storage unavailable: the choice just is not remembered
  }
}

export function PageAcademicSessionProvider({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const globalSession = useAppSelector(selectActiveAccademicSessionsForSchool) as AcademicSession
  const sessions = useAppSelector(selectAccademicSessionsForSchool) as AcademicSession[]
  const key = `page_academic_session:${storageKey}`
  const [selectedId, setSelectedId] = useState<number | null>(() => readStored(key))

  // When the header's session changes, the page follows it
  const lastGlobalId = useRef(globalSession?.id)
  useEffect(() => {
    if (lastGlobalId.current !== globalSession?.id) {
      lastGlobalId.current = globalSession?.id
      setSelectedId(null)
      writeStored(key, null)
    }
  }, [globalSession?.id, key])

  const value = useMemo<PageAcademicSessionValue>(() => {
    const picked = selectedId !== null ? sessions?.find((s) => Number(s.id) === selectedId) : undefined
    const session = picked || globalSession
    return {
      session,
      sessions: sessions || [],
      differsFromGlobal: !!picked && Number(picked.id) !== Number(globalSession?.id),
      setSessionId: (id: number) => {
        const next = Number(id) === Number(globalSession?.id) ? null : Number(id)
        setSelectedId(next)
        writeStored(key, next)
      },
    }
  }, [selectedId, sessions, globalSession, key])

  return <PageAcademicSessionContext.Provider value={value}>{children}</PageAcademicSessionContext.Provider>
}

/** The session this screen should use: the page's own choice inside a provider, else the header's. */
export function useAcademicSession(): AcademicSession {
  const page = useContext(PageAcademicSessionContext)
  const globalSession = useAppSelector(selectActiveAccademicSessionsForSchool) as AcademicSession
  return page ? page.session : globalSession
}

/** Session dropdown for a page wrapped in PageAcademicSessionProvider. */
export function PageAcademicSessionSelect({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const page = useContext(PageAcademicSessionContext)
  const { t } = useTranslation()
  if (!page) return null

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabel && <span className="text-xs font-medium text-muted-foreground">{t("academic_session", "Academic session")}</span>}
      <Select value={page.session?.id ? String(page.session.id) : undefined} onValueChange={(v) => page.setSessionId(Number(v))}>
        <SelectTrigger className={cn("w-[180px] bg-background", page.differsFromGlobal && "border-amber-400 ring-1 ring-amber-200")}>
          <SelectValue placeholder={t("select_academic_year")} />
        </SelectTrigger>
        <SelectContent>
          {page.sessions.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.session_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {page.differsFromGlobal && (
        <span className="text-[11px] text-amber-700">{t("viewing_other_session", "Only this page; the header session is unchanged")}</span>
      )}
    </div>
  )
}
