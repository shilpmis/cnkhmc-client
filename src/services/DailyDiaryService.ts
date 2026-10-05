import ApiService from './ApiService';

export interface ManualDiaryEntryInput {
  date: string;
  time: string;
  description: string;
}

class DailyDiaryService {
  static async logActivity(data: {
    periodsConfigId: number;
    date: string;
    topicCovered: string;
    resourcesUsed?: string;
    attendanceRemarks?: string;
    conclusion?: string;
    referenceBook?: string;
    attendance?: string;
    topicIds?: number[];
    subtopicIds?: number[];
    topicDurations?: Record<number, number>;
  }) {
    return ApiService.post('daily-diaries', data);
  }

  static async logManualEntries(entries: ManualDiaryEntryInput[], staffId?: number) {
    return ApiService.post('daily-diaries/manual', { entries, staffId });
  }

  static async getManualLogs(params: { startDate?: string; endDate?: string; staffId?: number }) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return ApiService.get(`daily-diaries/manual?${query}`);
  }

  static async deleteManualLog(id: number) {
    return ApiService.delete(`daily-diaries/manual/${id}`);
  }

  static async getLogs(params: { startDate?: string; endDate?: string; staffId?: number }) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return ApiService.get(`daily-diaries?${query}`);
  }

  static async exportPDF(params?: { startDate?: string; endDate?: string; staffId?: number }) {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return ApiService.get(`daily-diaries/export-pdf?${query}`, { responseType: 'blob' });
  }
}

export default DailyDiaryService;
