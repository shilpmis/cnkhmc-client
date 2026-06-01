import ApiService from './ApiService';

class TeacherService {
  static async getMyTimetable(academicSessionId: number) {
    return ApiService.get(`timetable/teacher?academic_session_id=${academicSessionId}`);
  }
}

export default TeacherService;
