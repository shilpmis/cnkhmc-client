import ApiService from './ApiService';

class DiaryLogPermissionService {
  static async getPermissions() {
    return ApiService.get('diary-log-permissions');
  }

  static async grantPermission(data: { staffId: number; date: string }) {
    return ApiService.post('diary-log-permissions', data);
  }

  static async revokePermission(id: number) {
    return ApiService.delete(`diary-log-permissions/${id}`);
  }
}

export default DiaryLogPermissionService;
