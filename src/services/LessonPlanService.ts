import ApiService from './ApiService';

export interface SyllabusStatus {
  subject_id: number;
  topics: number;
  subtopics: number;
  total_hours: number;
  /** Hours already taught (logged) against this syllabus */
  taught_hours: number;
  updated_on: string | null;
}

export interface TopicResetPreview {
  topic_id: number;
  topic_name: string;
  subtopics: number;
  completed_hours: number;
  logged_hours: number;
  diaries: number;
  dates: string[];
}

class LessonPlanService {
  static async getLessonPlans() {
    return ApiService.get('lesson-plans');
  }

  /**
   * Syllabus a timetable period is logged against: subject and session come from the period itself,
   * so a lecture always counts towards the session it was taught in.
   */
  static async getLessonPlanForPeriod(periodsConfigId: number, subjectId?: number) {
    const query = subjectId ? `?subjectId=${subjectId}` : ''
    return ApiService.get(`lesson-plans/for-period/${periodsConfigId}${query}`);
  }

  /** Subjects that have a syllabus in a session, with topic, subtopic and hour counts. */
  static async getSyllabusStatus(academicSessionId: number): Promise<SyllabusStatus[]> {
    const response = await ApiService.get(`lesson-plans/syllabus-status?academic_session_id=${academicSessionId}`);
    return Array.isArray(response.data) ? response.data : [];
  }

  static async getLessonPlan(subjectId: number, academicSessionId: number) {
    return ApiService.get(`lesson-plans/subject/${subjectId}?academic_session_id=${academicSessionId}`);
  }

  static async createLessonPlan(data: any) {
    return ApiService.post('lesson-plans', data);
  }

  static async addTopic(lessonPlanId: number, data: { name: string, description?: string, requiredHours: number }) {
    return ApiService.post(`lesson-plans/${lessonPlanId}/topics`, data);
  }

  static async getCoverageReport(subjectId: number, academicSessionId: number) {
    const response = await ApiService.get(`lesson-plans/reports/coverage/${academicSessionId}?subjectId=${subjectId}`);
    const data = Array.isArray(response.data)
      ? response.data.find((r: any) => r.subjectId === subjectId || r.subject_id === subjectId) || response.data[0]
      : response.data;
    return { data: data || null };
  }

  static async getAllCoverageReports(academicSessionId: number) {
    return ApiService.get(`lesson-plans/reports/coverage/${academicSessionId}`, { timeout: 20000 });
  }

  static async exportPDF(academicSessionId: number) {
    return ApiService.post(`lesson-plans/reports/export/${academicSessionId}`, {}, { 
      responseType: 'blob',
      timeout: 30000
    });
  }

  static async bulkUploadSyllabus(formData: FormData) {
    return ApiService.post('lesson-plans/bulk-upload', formData, {
      timeout: 60000 // 60 seconds for large Excel files
    });
  }

  static async deleteSyllabus(subjectId: number, academicSessionId: number) {
    return ApiService.delete(`lesson-plans/subject/${subjectId}?academicSessionId=${academicSessionId}`);
  }

  static async exportLP(subjectId: number, academicSessionId: number, lpNumber: string) {
    return ApiService.get(`/lesson-plans/export/${subjectId}/${lpNumber}?academicSessionId=${academicSessionId}`, {
      responseType: 'blob',
      timeout: 30000
    });
  }

  static async updateSubtopicStatus(id: number, isCompleted: boolean) {
    return ApiService.patch(`lesson-plans/subtopics/${id}/status`, { isCompleted });
  }

  /** What setting a taught topic back to pending would undo (diary entries, hours, dates). */
  static async getTopicResetPreview(topicId: number): Promise<TopicResetPreview> {
    const response = await ApiService.get(`lesson-plans/topics/${topicId}/reset-preview`);
    return response.data;
  }

  /** Sets a topic back to pending: unlinks it from every diary entry and zeroes its progress. */
  static async resetTopic(topicId: number): Promise<{ message: string; diaries_updated: number }> {
    const response = await ApiService.post(`lesson-plans/topics/${topicId}/reset`, {});
    return response.data;
  }

  static async updateTopicStatus(id: number, isCompleted: boolean) {
    return ApiService.patch(`lesson-plans/topics/${id}/status`, { isCompleted });
  }

  static async assignTopicToTeacher(topicId: number, staffIds: number[] | null) {
    return ApiService.put(`lesson-plans/topics/${topicId}/assign`, { staff_ids: staffIds });
  }

  static async assignSubtopicToTeacher(subtopicId: number, staffIds: number[] | null) {
    return ApiService.put(`lesson-plans/subtopics/${subtopicId}/assign`, { staff_ids: staffIds });
  }
}

export default LessonPlanService;
