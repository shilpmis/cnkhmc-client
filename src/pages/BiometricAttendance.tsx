import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Fingerprint, FileUp, Link2, CalendarDays, Settings2, Loader2, Wand2, Save, AlertTriangle, CheckCircle2 } from "lucide-react"
import { openBiometricDatabase, type BiometricDatabase } from "@/utils/biometricMdb"
import {
  BiometricApi,
  type BiometricRules,
  type DaySummary,
  type ProcessResult,
  useGetBiometricDailyQuery,
  useGetBiometricMappingQuery,
  useGetBiometricSettingsQuery,
  useGetBiometricSummaryQuery,
  useProcessBiometricAttendanceMutation,
  useSaveBiometricMappingMutation,
  useSaveBiometricSettingsMutation,
  useStoreBiometricEmployeesMutation,
  useStoreBiometricPunchesMutation,
} from "@/services/BiometricService"

const PUNCH_BATCH = 2000
const EMPLOYEE_BATCH = 1000
const PROCESS_WINDOW_DAYS = 31

const pad = (n: number) => String(n).padStart(2, "0")
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const lastDayOfMonth = (year: number, month: number) => isoDate(new Date(year, month, 0))
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}
const minutesLabel = (m: number | null | undefined) => (m === null || m === undefined ? "—" : `${Math.floor(m / 60)}h ${pad(m % 60)}m`)

const errorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback

const STATUS_STYLE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800 border-emerald-200",
  late: "bg-amber-100 text-amber-800 border-amber-200",
  half_day: "bg-sky-100 text-sky-800 border-sky-200",
  absent: "bg-rose-100 text-rose-800 border-rose-200",
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className={STATUS_STYLE[status] || ""}>
      {status.replace("_", " ")}
    </Badge>
  )
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Import                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function ImportTab() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const academicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { data: summary, isLoading: summaryLoading } = useGetBiometricSummaryQuery()
  const [storeEmployees] = useStoreBiometricEmployeesMutation()
  const [storePunches] = useStoreBiometricPunchesMutation()
  const [processAttendance] = useProcessBiometricAttendanceMutation()

  const [database, setDatabase] = useState<BiometricDatabase | null>(null)
  const [fileName, setFileName] = useState("")
  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ read: number; inserted: number; duplicates: number; employees: number } | null>(null)

  const [processFrom, setProcessFrom] = useState("")
  const [processTo, setProcessTo] = useState("")
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)

  const fileRange = useMemo(() => {
    if (!database?.months.length) return null
    const first = database.months[0]
    const last = database.months[database.months.length - 1]
    return { from: `${first.year}-${pad(first.month)}-01`, to: lastDayOfMonth(last.year, last.month) }
  }, [database])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setOpening(true)
    setOpenError(null)
    setDatabase(null)
    setImportResult(null)
    setFileName(file.name)
    try {
      const db = await openBiometricDatabase(file)
      setDatabase(db)
      const first = db.months[0]
      const last = db.months[db.months.length - 1]
      const fileTo = lastDayOfMonth(last.year, last.month)
      // Continue from the last stored punch; re-sending that day is harmless because duplicates are skipped
      const resumeFrom = summary?.last_punch ? summary.last_punch.slice(0, 10) : `${first.year}-${pad(first.month)}-01`
      setFrom(resumeFrom > fileTo ? `${first.year}-${pad(first.month)}-01` : resumeFrom)
      setTo(fileTo)
    } catch (error: any) {
      setOpenError(errorMessage(error, "Could not read this file."))
    } finally {
      setOpening(false)
    }
  }

  const runImport = async () => {
    if (!database || !from || !to || from > to) return
    setImporting(true)
    setProgress(0)
    setImportResult(null)
    try {
      for (let i = 0; i < database.employees.length; i += EMPLOYEE_BATCH) {
        await storeEmployees({ employees: database.employees.slice(i, i + EMPLOYEE_BATCH) }).unwrap()
      }

      const punches = database.readPunches(from, to)
      let inserted = 0
      let duplicates = 0
      for (let i = 0; i < punches.length; i += PUNCH_BATCH) {
        const res = await storePunches({ punches: punches.slice(i, i + PUNCH_BATCH), source: "mdb" }).unwrap()
        inserted += res.inserted
        duplicates += res.duplicates
        setProgress(Math.round(((i + PUNCH_BATCH) / Math.max(punches.length, 1)) * 100))
      }
      setProgress(100)
      setImportResult({ read: punches.length, inserted, duplicates, employees: database.employees.length })
      setProcessFrom(from)
      setProcessTo(to)
      toast({ title: "Import finished", description: `${inserted} new punches stored, ${duplicates} already there.` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import stopped", description: errorMessage(error, "Could not send punches to the server.") })
    } finally {
      dispatch(BiometricApi.util.invalidateTags(["BiometricSummary", "BiometricMapping", "BiometricDaily"]))
      setImporting(false)
    }
  }

  const runProcess = async () => {
    if (!processFrom || !processTo || processFrom > processTo || !academicSession?.id) return
    setProcessing(true)
    setProcessResult(null)
    const total: ProcessResult = { days_with_punches: 0, created: 0, updated: 0, unchanged: 0, skipped_manual: 0, skipped_edited: 0, skipped_leave: 0, missing_punch: 0 }
    try {
      // The server takes at most ~3 months per call; go one month-sized window at a time
      for (let start = processFrom; start <= processTo; start = addDays(start, PROCESS_WINDOW_DAYS)) {
        const windowEnd = addDays(start, PROCESS_WINDOW_DAYS - 1)
        const end = windowEnd < processTo ? windowEnd : processTo
        const res = await processAttendance({ from: start, to: end, academic_session_id: Number(academicSession.id) }).unwrap()
        ;(Object.keys(total) as (keyof ProcessResult)[]).forEach((k) => (total[k] += res[k]))
      }
      setProcessResult(total)
      toast({ title: "Attendance filled", description: `${total.created} days added, ${total.updated} updated.` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could not fill attendance", description: errorMessage(error, "Processing failed.") })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Punches stored" value={summaryLoading ? "…" : (summary?.punches ?? 0).toLocaleString()} />
        <Stat label="Latest punch" value={summary?.last_punch ? summary.last_punch.slice(0, 16) : "—"} hint={summary?.first_punch ? `Since ${summary.first_punch.slice(0, 10)}` : undefined} />
        <Stat label="Staff linked to the device" value={`${summary?.linked_staff ?? 0} / ${summary?.active_staff ?? 0}`} hint="Linked / active staff" />
        <Stat label="Device users not linked" value={summary?.unlinked_device_users ?? 0} hint="Their punches are kept until they are linked" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4" /> 1. Read the eSSL database
          </CardTitle>
          <CardDescription>
            Choose the eTimeTrackLite <code>.mdb</code> file. It is read in this browser; only the punches for the dates you pick
            are sent to the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".mdb,.accdb" disabled={opening || importing} onChange={(e) => onFile(e.target.files?.[0])} />
          {opening && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading {fileName}… large files take a few seconds.
            </div>
          )}
          {openError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could not open the file</AlertTitle>
              <AlertDescription>{openError}</AlertDescription>
            </Alert>
          )}
          {database && fileRange && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div>
                <span className="font-medium">{fileName}</span>: punches from {fileRange.from} to {fileRange.to} (
                {database.months.reduce((n, m) => n + m.rows, 0).toLocaleString()} in {database.months.length} months),{" "}
                {database.employees.length} employees.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={!database ? "opacity-60" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-4 w-4" /> 2. Import punches
          </CardTitle>
          <CardDescription>
            Starts from the latest punch already stored. Punches already on the server are skipped, so importing the same dates
            twice is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="import-from">From</Label>
              <Input id="import-from" type="date" value={from} min={fileRange?.from} max={fileRange?.to} disabled={!database || importing} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="import-to">To</Label>
              <Input id="import-to" type="date" value={to} min={fileRange?.from} max={fileRange?.to} disabled={!database || importing} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={runImport} disabled={!database || importing || !from || !to || from > to} className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {importing ? "Importing…" : "Import punches"}
            </Button>
          </div>
          {importing && <Progress value={progress} />}
          {importResult && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Read {importResult.read.toLocaleString()} punches: {importResult.inserted.toLocaleString()} new,{" "}
                {importResult.duplicates.toLocaleString()} already stored. Employee list updated ({importResult.employees}). Link any new staff in{" "}
                <span className="font-medium">Staff links</span>, then fill attendance below.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> 3. Fill staff attendance
          </CardTitle>
          <CardDescription>
            Turns stored punches of linked staff into daily attendance using the rules. Only days with punches are written. Days
            marked by hand, days with an approved edit request, and days on approved full-day leave are never changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="process-from">From</Label>
              <Input id="process-from" type="date" value={processFrom} disabled={processing} onChange={(e) => setProcessFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="process-to">To</Label>
              <Input id="process-to" type="date" value={processTo} disabled={processing} onChange={(e) => setProcessTo(e.target.value)} />
            </div>
            <Button
              onClick={runProcess}
              disabled={processing || !processFrom || !processTo || processFrom > processTo || !academicSession?.id}
              className="gap-2"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {processing ? "Filling…" : "Fill attendance"}
            </Button>
          </div>
          {!academicSession?.id && <p className="text-sm text-destructive">Select an academic session in the header first.</p>}
          {processResult && (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Days added" value={processResult.created} />
              <Stat label="Days updated" value={processResult.updated} />
              <Stat label="Already up to date" value={processResult.unchanged} />
              <Stat label="Kept (marked by hand)" value={processResult.skipped_manual + processResult.skipped_edited} />
              <Stat label="Kept (on leave)" value={processResult.skipped_leave} />
              <Stat label="Missing a punch" value={processResult.missing_punch} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Staff links                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function LinksTab() {
  const { toast } = useToast()
  const { data, isLoading, isFetching } = useGetBiometricMappingQuery()
  const [saveMapping, { isLoading: saving }] = useSaveBiometricMappingMutation()
  const [draft, setDraft] = useState<Record<number, string>>({})
  const [search, setSearch] = useState("")
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  useEffect(() => setDraft({}), [data])

  const employeesByCode = useMemo(() => new Map((data?.employees || []).map((e) => [e.device_user_id, e])), [data])
  const valueFor = (staffId: number, saved: string | null) => (staffId in draft ? draft[staffId] : saved || "")

  const changed = useMemo(
    () => (data?.staff || []).filter((s) => s.id in draft && (draft[s.id] || "") !== (s.biometric_code || "")),
    [data, draft]
  )

  const codeOwners = useMemo(() => {
    const owners = new Map<string, number[]>()
    for (const s of data?.staff || []) {
      const code = valueFor(s.id, s.biometric_code).trim()
      if (code) owners.set(code, [...(owners.get(code) || []), s.id])
    }
    return owners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, draft])

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (data?.staff || []).filter((s) => {
      if (onlyUnlinked && valueFor(s.id, s.biometric_code)) return false
      if (!term) return true
      return [s.name, s.employee_code, s.department, s.biometric_code].some((v) => String(v || "").toLowerCase().includes(term))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, draft, search, onlyUnlinked])

  const suggestionsLeft = (data?.staff || []).filter((s) => !valueFor(s.id, s.biometric_code) && s.suggested_code)

  const applySuggestions = () => {
    const next = { ...draft }
    for (const s of suggestionsLeft) next[s.id] = s.suggested_code!
    setDraft(next)
  }

  const save = async () => {
    const duplicate = [...codeOwners.entries()].find(([, ids]) => ids.length > 1)
    if (duplicate) {
      toast({ variant: "destructive", title: "Same device code twice", description: `Device code ${duplicate[0]} is given to more than one staff member.` })
      return
    }
    try {
      const res = await saveMapping({ links: changed.map((s) => ({ staff_id: s.id, biometric_code: (draft[s.id] || "").trim() || null })) }).unwrap()
      toast({ title: "Links saved", description: `${res.saved} staff updated.` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could not save links", description: errorMessage(error, "Saving failed.") })
    }
  }

  const linkedCodes = new Set((data?.staff || []).map((s) => valueFor(s.id, s.biometric_code)).filter(Boolean))
  const unlinkedWithPunches = (data?.employees || []).filter((e) => e.punches > 0 && !linkedCodes.has(e.device_user_id))

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(data?.employees.length ?? 0) === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No eSSL employee list yet</AlertTitle>
          <AlertDescription>Import the .mdb file once (Import tab) to get name suggestions. You can still type device codes by hand.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base">Link staff to device codes</CardTitle>
            <CardDescription>
              The device code is the number the person punches with in eSSL (for example 1050). Suggestions come from matching names;
              check each one before saving.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={suggestionsLeft.length === 0} onClick={applySuggestions}>
              <Wand2 className="h-4 w-4" /> Use {suggestionsLeft.length} suggestions
            </Button>
            <Button size="sm" className="gap-1.5" disabled={changed.length === 0 || saving} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {changed.length || ""} changes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <Input placeholder="Search name, code or department" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={onlyUnlinked} onCheckedChange={setOnlyUnlinked} /> Only staff without a device code
            </label>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <datalist id="essl-employees">
            {(data?.employees || []).map((e) => (
              <option key={e.device_user_id} value={e.device_user_id}>
                {`${e.name || ""}${e.department ? ` · ${e.department}` : ""}`}
              </option>
            ))}
          </datalist>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-40">Device code</TableHead>
                  <TableHead>Name in eSSL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const value = valueFor(s.id, s.biometric_code)
                  const match = employeesByCode.get(value.trim())
                  const clash = value.trim() && (codeOwners.get(value.trim())?.length || 0) > 1
                  const isChanged = s.id in draft && (draft[s.id] || "") !== (s.biometric_code || "")
                  return (
                    <TableRow key={s.id} className={isChanged ? "bg-amber-50/60" : ""}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.employee_code}
                          {!s.is_active && " · inactive"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.department || "—"}</TableCell>
                      <TableCell>
                        <Input
                          list="essl-employees"
                          value={value}
                          placeholder={s.suggested_code ? `Suggested ${s.suggested_code}` : "Not linked"}
                          className={`h-8 ${clash ? "border-destructive" : ""}`}
                          onChange={(e) => setDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {value ? (
                          match ? (
                            <span>
                              {match.name}
                              <span className="text-muted-foreground">
                                {match.department ? ` · ${match.department}` : ""} · {match.punches.toLocaleString()} punches
                              </span>
                            </span>
                          ) : (
                            <span className="text-amber-700">Not in the eSSL list</span>
                          )
                        ) : s.suggested_code ? (
                          <button
                            type="button"
                            className="text-left text-primary hover:underline"
                            onClick={() => setDraft((d) => ({ ...d, [s.id]: s.suggested_code! }))}
                          >
                            Use {s.suggested_code}: {employeesByCode.get(s.suggested_code)?.name}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {clash && <div className="text-xs text-destructive">Also given to another staff member</div>}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No staff match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {unlinkedWithPunches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device users with punches but no staff link ({unlinkedWithPunches.length})</CardTitle>
            <CardDescription>
              Usually hospital staff, interns or people not added as staff in this app. Their punches are kept, so linking them later
              brings their history in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name in eSSL</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Punches</TableHead>
                    <TableHead>Last punch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedWithPunches.map((e) => (
                    <TableRow key={e.device_user_id}>
                      <TableCell className="font-mono text-sm">{e.device_user_id}</TableCell>
                      <TableCell>{e.name || "—"}</TableCell>
                      <TableCell className="text-sm">{e.department || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.punches.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{e.last_punch || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Daily view                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

function DailyTab() {
  const { data: summary } = useGetBiometricSummaryQuery()
  const [date, setDate] = useState("")
  const [onlyWithPunches, setOnlyWithPunches] = useState(true)

  useEffect(() => {
    if (!date) setDate(summary?.last_punch ? summary.last_punch.slice(0, 10) : isoDate(new Date()))
  }, [summary, date])

  const { data, isFetching } = useGetBiometricDailyQuery({ date }, { skip: !date })
  const rows = (data?.rows || []).filter((r) => !onlyWithPunches || r.punches.length > 0)
  const withPunches = (data?.rows || []).filter((r) => r.punches.length > 0).length

  const renderComputed = (c: DaySummary | null) => {
    if (!c) return <span className="text-muted-foreground">No punches</span>
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={c.status} />
        {c.missing_punch && (
          <Badge variant="outline" className="border-amber-300 text-amber-800">
            {c.check_in ? "missing out-punch" : "missing in-punch"}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base">Day by day</CardTitle>
          <CardDescription>
            Punches of linked staff, the in/out and status the rules give, and what is saved in staff attendance.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="daily-date">Date</Label>
            <Input id="daily-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <Switch checked={onlyWithPunches} onCheckedChange={setOnlyWithPunches} /> Only staff who punched
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            {withPunches} of {data?.rows.length ?? 0} linked staff punched
          </span>
          {(data?.unlinked_device_users ?? 0) > 0 && <span>{data?.unlinked_device_users} device users punched but are not linked</span>}
          {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Punches</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Worked</TableHead>
                <TableHead>From punches</TableHead>
                <TableHead>Saved attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.staff_id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.biometric_code}
                      {r.department ? ` · ${r.department}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-muted-foreground">{r.punches.join(", ") || "—"}</TableCell>
                  <TableCell className="tabular-nums">{r.computed?.check_in || "—"}</TableCell>
                  <TableCell className="tabular-nums">{r.computed?.check_out || "—"}</TableCell>
                  <TableCell className="tabular-nums">{minutesLabel(r.computed?.worked_minutes)}</TableCell>
                  <TableCell>{renderComputed(r.computed)}</TableCell>
                  <TableCell>
                    {r.stored ? (
                      <div className="space-y-1">
                        <StatusBadge status={r.stored.status} />
                        <div className="text-xs text-muted-foreground">
                          {r.stored.check_in_time || "—"} – {r.stored.check_out_time || "—"} · {r.stored.from_biometric ? "from punches" : "marked by hand"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not filled yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {data?.rows.length ? "Nobody linked punched on this day." : "No staff are linked to device codes yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------------------------------------ */
/* Rules                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

function RulesTab() {
  const { toast } = useToast()
  const { data, isLoading } = useGetBiometricSettingsQuery()
  const [saveSettings, { isLoading: saving }] = useSaveBiometricSettingsMutation()
  const [form, setForm] = useState<BiometricRules | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
      </div>
    )
  }

  const numberField = (key: "grace_minutes" | "half_day_minutes" | "full_day_minutes" | "duplicate_window_minutes", label: string, hint: string) => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} type="number" min={0} max={1440} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )

  const save = async () => {
    try {
      await saveSettings(form).unwrap()
      toast({ title: "Rules saved", description: "Fill attendance again for past dates to apply them there." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could not save rules", description: errorMessage(error, "Saving failed.") })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rules for turning punches into attendance</CardTitle>
        <CardDescription>
          First punch of the day is the check-in, last punch is the check-out. Worked time below the half-day minimum is absent,
          below the full-day minimum is half day, otherwise present (or late, when the check-in is after shift start plus grace).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="shift_start">Shift start</Label>
            <Input id="shift_start" type="time" value={form.shift_start} onChange={(e) => setForm({ ...form, shift_start: e.target.value })} />
            <p className="text-xs text-muted-foreground">Teaching staff start at 09:00 in eSSL.</p>
          </div>
          {numberField("grace_minutes", "Grace (minutes)", `Check-in after ${form.shift_start} plus this is late.`)}
          {numberField("duplicate_window_minutes", "Duplicate punch window (minutes)", "Repeated taps closer than this count once.")}
          {numberField("half_day_minutes", "Half-day minimum (minutes)", `${minutesLabel(form.half_day_minutes)} worked or more is at least a half day.`)}
          {numberField("full_day_minutes", "Full-day minimum (minutes)", `${minutesLabel(form.full_day_minutes)} worked or more is a full day.`)}
        </div>
        <label className="flex items-start gap-3 rounded-md border p-3">
          <Switch checked={form.overwrite_self_marked} onCheckedChange={(v) => setForm({ ...form, overwrite_self_marked: v })} />
          <span className="text-sm">
            <span className="font-medium">Replace self check-ins with punch data</span>
            <span className="block text-muted-foreground">
              Off: a day a staff member checked in themselves in the app is kept as it is. Days marked by an admin are always kept.
            </span>
          </span>
        </label>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rules
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export default function BiometricAttendance() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Fingerprint className="h-6 w-6 text-primary" /> Biometric Attendance
        </h1>
        <p className="text-sm text-muted-foreground">Import punches from the eSSL device software and turn them into staff attendance.</p>
      </div>
      <Tabs defaultValue="import">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="import" className="gap-1.5">
            <FileUp className="h-4 w-4" /> Import
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5">
            <Link2 className="h-4 w-4" /> Staff links
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Daily view
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Settings2 className="h-4 w-4" /> Rules
          </TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-4">
          <ImportTab />
        </TabsContent>
        <TabsContent value="links" className="mt-4">
          <LinksTab />
        </TabsContent>
        <TabsContent value="daily" className="mt-4">
          <DailyTab />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          <RulesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
