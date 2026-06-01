// types/auth.ts
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    IT_ADMIN = 'IT_ADMIN',
    CLERK = 'CLERK',
    PRINCIPAL = 'PRINCIPAL',
    TEACHER = 'TEACHER'
}

export interface ResetPasswordCredentials {
    employee_code: string
    date_of_birth: string
    mobile_number: string
    password: string
    confirm_password: string
  }
  
  export interface ResetPasswordResponse {
    message: string
  }