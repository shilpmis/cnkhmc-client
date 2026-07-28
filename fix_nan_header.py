import re

# Update authSlice.ts
with open('src/redux/slices/authSlice.ts', 'r', encoding='utf-8') as f:
    auth_content = f.read()

new_default = """const currentYear = new Date().getFullYear();
export const DEFAULT_ACADEMIC_SESSION: any = {
  id: 1,
  is_active: true,
  academic_year: currentYear,
  session_name: `${currentYear}-${currentYear + 1}`,
  start_year: `${currentYear}`,
  end_year: `${currentYear + 1}`,
  start_month: `01-${currentYear}`,
  end_month: `12-${currentYear}`,
  year: currentYear,
};
"""

auth_content = re.sub(r'const currentYear = new Date\(\)\.getFullYear\(\);[\s\S]*?year: currentYear,\n\};', new_default.strip(), auth_content)

with open('src/redux/slices/authSlice.ts', 'w', encoding='utf-8') as f:
    f.write(auth_content)

print("authSlice updated with full default session fields")

# Update Header.tsx
with open('src/layouts/Admin/Components/Header.tsx', 'r', encoding='utf-8') as f:
    header_content = f.read()

old_format = """  const formatAcademicYear = (session: AcademicSession) => {
    if (!session) return "No Session Selected"
    const startYear = new Date(session.start_year).getFullYear()
    const endYear = new Date(session.end_year).getFullYear()
    return `${startYear}-${endYear}`
  }"""

new_format = """  const formatAcademicYear = (session: AcademicSession) => {
    if (!session) return "No Session Selected"
    if ((session as any).session_name) return (session as any).session_name
    if ((session as any).academic_year) return `${(session as any).academic_year}-${Number((session as any).academic_year) + 1}`
    const startYear = session.start_year ? new Date(session.start_year).getFullYear() : NaN
    const endYear = session.end_year ? new Date(session.end_year).getFullYear() : NaN
    if (!isNaN(startYear) && !isNaN(endYear)) {
      return `${startYear}-${endYear}`
    }
    const currentYear = new Date().getFullYear()
    return `${currentYear}-${currentYear + 1}`
  }"""

header_content = header_content.replace(old_format, new_format)

with open('src/layouts/Admin/Components/Header.tsx', 'w', encoding='utf-8') as f:
    f.write(header_content)

print("Header.tsx formatAcademicYear updated")
