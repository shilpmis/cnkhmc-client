import ApiService from './ApiService';

class LessonPlanService {
  static async getLessonPlans() {
    return ApiService.get('lesson-plans');
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
    return ApiService.get(`lesson-plans/reports/coverage/${academicSessionId}`);
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
