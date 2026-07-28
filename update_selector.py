with open('src/redux/slices/authSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_selector = """export const selectAccademicSessionsForSchool = (state: RootState) =>
  state.auth.user?.school?.academicSessions || [];"""

new_selector = """export const selectAccademicSessionsForSchool = (state: RootState) =>
  state.auth.user?.school?.academicSessions?.length
    ? state.auth.user.school.academicSessions
    : [DEFAULT_ACADEMIC_SESSION];"""

content = content.replace(old_selector, new_selector)

with open('src/redux/slices/authSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("selectAccademicSessionsForSchool updated successfully")
