/**
 * Reads the eSSL eTimeTrackLite database (.mdb) in the browser, so only the punches needed are sent
 * to the server instead of uploading the whole file (hundreds of MB).
 *
 * Layout (eTimeTrackLite):
 * - DeviceLogs_<month>_<year>: one table per month of raw punches (UserId, LogDate, DeviceId, C1). On
 *   this college's device C1 is always "in", so attendance never relies on direction: first and last
 *   punch of the day decide in and out.
 * - Employees: EmployeeCode (= the device user ID, e.g. 1050), EmployeeName, DepartmentId, Status
 * - Departments: DepartmentId, DepartmentFName
 *
 * Dates: the database stores the device's local clock time with no time zone, and mdb-reader returns
 * it as if it were UTC. Reading the UTC parts gives back exactly what the device showed, so no time
 * zone conversion happens anywhere.
 */

export type MdbPunch = {
  device_user_id: string
  punch_time: string // 'YYYY-MM-DD HH:mm:ss', device local time
  direction: string | null
  device_id: number | null
}

export type MdbEmployee = {
  device_user_id: string
  name: string | null
  department: string | null
  status: string | null
}

export type MdbMonth = { table: string; year: number; month: number; rows: number }

export type BiometricDatabase = {
  months: MdbMonth[]
  employees: MdbEmployee[]
  readPunches: (from: string, to: string) => MdbPunch[]
}

const pad = (n: number) => String(n).padStart(2, "0")

const formatDeviceTime = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

const monthKey = (year: number, month: number) => year * 100 + month

/** Opens the database. Throws a readable error when the file is not an eTimeTrackLite database. */
export async function openBiometricDatabase(file: File): Promise<BiometricDatabase> {
  // mdb-reader expects Node's Buffer as a global; load it before the reader itself
  const { Buffer } = await import("buffer")
  ;(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer
  const { default: MDBReader } = await import("mdb-reader")

  const reader = new MDBReader(Buffer.from(await file.arrayBuffer()) as any)
  const names = reader.getTableNames()

  const months: MdbMonth[] = names
    .map((table) => {
      const m = /^DeviceLogs_(\d{1,2})_(\d{4})$/.exec(table)
      if (!m) return null
      const month = Number(m[1])
      const year = Number(m[2])
      // A device whose clock was reset logs a few punches in year 2000 (DeviceLogs_1_2000); skip those
      if (month < 1 || month > 12 || year < 2010) return null
      return { table, year, month, rows: reader.getTable(table).rowCount }
    })
    .filter((m): m is MdbMonth => !!m && m.rows > 0)
    .sort((a, b) => monthKey(a.year, a.month) - monthKey(b.year, b.month))

  if (months.length === 0 || !names.includes("Employees")) {
    throw new Error("This file does not look like an eSSL eTimeTrackLite database (no DeviceLogs or Employees tables).")
  }

  const departments = new Map<number, string>()
  if (names.includes("Departments")) {
    for (const d of reader.getTable("Departments").getData({ columns: ["DepartmentId", "DepartmentFName"] }) as any[]) {
      departments.set(Number(d.DepartmentId), String(d.DepartmentFName || "").trim())
    }
  }

  const employees: MdbEmployee[] = (
    reader
      .getTable("Employees")
      .getData({ columns: ["EmployeeCode", "EmployeeCodeInDevice", "EmployeeName", "DepartmentId", "Status"] }) as any[]
  )
    .map((e) => ({
      // Punches carry the code enrolled on the device; it equals EmployeeCode unless someone changed one
      device_user_id: String(
        e.EmployeeCodeInDevice && String(e.EmployeeCodeInDevice).trim() !== "0" ? e.EmployeeCodeInDevice : e.EmployeeCode ?? ""
      ).trim(),
      name: e.EmployeeName ? String(e.EmployeeName).trim() : null,
      department: departments.get(Number(e.DepartmentId)) || null,
      status: e.Status ? String(e.Status).trim() : null,
    }))
    // Deleted test entries are renamed "del_..." by eTimeTrackLite
    .filter((e) => e.device_user_id && !e.device_user_id.startsWith("del_") && !(e.name || "").startsWith("del_"))

  const readPunches = (from: string, to: string): MdbPunch[] => {
    const fromKey = monthKey(Number(from.slice(0, 4)), Number(from.slice(5, 7)))
    const toKey = monthKey(Number(to.slice(0, 4)), Number(to.slice(5, 7)))
    const lower = `${from} 00:00:00`
    const upper = `${to} 23:59:59`
    const punches: MdbPunch[] = []

    for (const m of months) {
      const key = monthKey(m.year, m.month)
      if (key < fromKey || key > toKey) continue
      const rows = reader.getTable(m.table).getData({ columns: ["UserId", "LogDate", "DeviceId", "C1", "Direction"] }) as any[]
      for (const r of rows) {
        if (!(r.LogDate instanceof Date) || Number.isNaN(r.LogDate.getTime())) continue
        const punchTime = formatDeviceTime(r.LogDate)
        if (punchTime < lower || punchTime > upper) continue
        const userId = String(r.UserId ?? "").trim()
        if (!userId || userId === "0") continue
        const direction = String(r.C1 || r.Direction || "").trim().toLowerCase()
        punches.push({
          device_user_id: userId,
          punch_time: punchTime,
          direction: direction === "in" || direction === "out" ? direction : null,
          device_id: Number.isFinite(Number(r.DeviceId)) ? Number(r.DeviceId) : null,
        })
      }
    }
    return punches.sort((a, b) => (a.punch_time < b.punch_time ? -1 : a.punch_time > b.punch_time ? 1 : 0))
  }

  return { months, employees, readPunches }
}
