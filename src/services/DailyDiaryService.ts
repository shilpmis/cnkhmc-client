import ApiService from './ApiService';

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

  static async getLogs(params: { startDate?: string; endDate?: string; staffId?: number }) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return ApiService.get(`daily-diaries?${query}`);
  }
}

export default DailyDiaryService;
