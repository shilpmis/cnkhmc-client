with open('src/redux/slices/authSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

default_def = """const currentYear = new Date().getFullYear();
export const DEFAULT_ACADEMIC_SESSION: any = {
  id: 1,
  is_active: true,
  academic_year: currentYear,
  session_name: `${currentYear}-${currentYear + 1}`,
  year: currentYear,
};
"""

if 'DEFAULT_ACADEMIC_SESSION' not in content:
    content = default_def + "\n" + content

# replace initialState currentActiveAcademicSession
content = content.replace("currentActiveAcademicSession: null,", "currentActiveAcademicSession: DEFAULT_ACADEMIC_SESSION,")

# replace null fallbacks for currentActiveAcademicSession
content = content.replace(") || null;\n      state.token = action.payload.token;", ") || DEFAULT_ACADEMIC_SESSION;\n      state.token = action.payload.token;")
content = content.replace(") || null;\n        \n        // Persist for Super Admin", ") || DEFAULT_ACADEMIC_SESSION;\n        \n        // Persist for Super Admin")
content = content.replace(") || null;\n      }\n    },\n  },\n  extraReducers:", ") || DEFAULT_ACADEMIC_SESSION;\n      }\n    },\n  },\n  extraReducers:")
content = content.replace(") || null;\n        state.token = action.payload.token;\n      })", ") || DEFAULT_ACADEMIC_SESSION;\n        state.token = action.payload.token;\n      })")

# replace selector fallback
content = content.replace(
    "export const selectActiveAccademicSessionsForSchool = (state: RootState) =>\n  state.auth.currentActiveAcademicSession;",
    "export const selectActiveAccademicSessionsForSchool = (state: RootState) =>\n  state.auth.currentActiveAcademicSession || DEFAULT_ACADEMIC_SESSION;"
)

with open('src/redux/slices/authSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("authSlice fixed")
