with open('src/redux/slices/authSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_gen_func = """const currentYear = new Date().getFullYear();

export const generateDefaultAcademicYears = () => {
  let customYears: any[] = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_academic_years') : null;
    customYears = raw ? JSON.parse(raw) : [];
  } catch {
    customYears = [];
  }

  const defaultYears: any[] = [];
  for (let year = currentYear - 3; year <= currentYear + 5; year++) {
    defaultYears.push({
      id: year,
      academic_year: year,
      session_name: `${year}-${year + 1}`,
      start_year: `${year}`,
      end_year: `${year + 1}`,
      start_month: `01-${year}`,
      end_month: `12-${year}`,
      year: year,
      is_active: year === currentYear,
    });
  }

  const map = new Map();
  defaultYears.forEach((y) => map.set(y.id, y));
  customYears.forEach((y: any) => map.set(y.id || y.academic_year, y));

  return Array.from(map.values());
};

export const DEFAULT_ACADEMIC_SESSION: any = generateDefaultAcademicYears().find((y: any) => y.academic_year === currentYear) || generateDefaultAcademicYears()[0];
"""

import re
content = re.sub(r'const currentYear = new Date\(\)\.getFullYear\(\);[\s\S]*?year: currentYear,\n\};', new_gen_func.strip(), content)

old_sel = """export const selectAccademicSessionsForSchool = (state: RootState) =>
  state.auth.user?.school?.academicSessions?.length
    ? state.auth.user.school.academicSessions
    : [DEFAULT_ACADEMIC_SESSION];"""

new_sel = """export const selectAccademicSessionsForSchool = (state: RootState) =>
  state.auth.user?.school?.academicSessions?.length
    ? state.auth.user.school.academicSessions
    : generateDefaultAcademicYears();"""

content = content.replace(old_sel, new_sel)

with open('src/redux/slices/authSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("authSlice updated with dynamic multi-year support")
