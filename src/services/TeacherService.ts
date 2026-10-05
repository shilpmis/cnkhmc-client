import ApiService from './ApiService';

class TeacherService {
  static async getMyTimetable(academicSessionId: number) {
    return ApiService.get(`timetable/teacher?academic_session_id=${academicSessionId}`, { timeout: 20000 });
  }

  static async getMyAvailability(academicSessionId: number) {
    return ApiService.get(`timetable/teacher/availability?academic_session_id=${academicSessionId}`, { timeout: 20000 });
  }
}

export default TeacherService;
