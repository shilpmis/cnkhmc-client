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
    const response = await ApiService.get(`lesson-plans/reports/coverage/${academicSessionId}`);
    // The backend might return subjects by ID or name depending on the endpoint version
    const report = response.data?.find((r: any) => r.subjectId === subjectId || r.subject_id === subjectId);
    return { data: report || null };
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
}

export default LessonPlanService;
