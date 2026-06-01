import { StaffType } from "./staff";
import { School } from "./user";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    school_id: number;
    email: string;
    name: string;
    role_id: number;
    is_active: boolean;
    staff_id: number | null;
    permissions: string[];
    staff: StaffType;
    school: School;
  };
  token: string;
}
