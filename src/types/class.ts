import { Division } from "./academic";

export type AvailableClasses =
  | "Nursery"
  | "LKG"
  | "UKG"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12";

export interface Class {
  id: number;
  school_id: number;
  class: AvailableClasses;
  academic_session_id: number;
}

export interface AssignedClasses {
  id: number;
  class_id: number;
  staff_id: number;
  academic_session_id: number;
  status: "Active" | "Inactive";
  class: Division;
}
