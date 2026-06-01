import ApiService from './ApiService'

export interface ChatMessage {
  id: number
  chat_room_id: number
  sender_id: number
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  created_at: string
  updated_at: string
  sender?: {
    id: number
    name: string
    email: string
    username: string
  }
}

export interface ChatRoomMember {
  id: number
  chat_room_id: number
  user_id: number
  role: 'ADMIN' | 'MEMBER'
  created_at: string
  updated_at: string
  user: {
    id: number
    name: string
    email: string
    username: string
    role?: {
      role: string
    }
  }
}

export interface ChatRoom {
  id: number
  organization_id: number
  name: string | null
  type: 'DIRECT' | 'GROUP'
  created_by: number
  created_at: string
  updated_at: string
  members: ChatRoomMember[]
  creator?: {
    id: number
    name: string
  }
  messages?: ChatMessage[]
  unread_count?: number
}

class ChatService {
  static async getColleagues() {
    return ApiService.get('chat/colleagues')
  }

  static async getRooms() {
    return ApiService.get('chat/rooms')
  }

  static async createRoom(data: {
    type: 'DIRECT' | 'GROUP'
    name?: string
    user_ids: number[]
  }) {
    return ApiService.post('chat/rooms', data)
  }

  static async getMessages(roomId: number, page: number = 1, limit: number = 50) {
    return ApiService.get(`chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`)
  }

  static async sendMessage(roomId: number, content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
    return ApiService.post(`chat/rooms/${roomId}/messages`, { content, type })
  }

  static async addMembers(roomId: number, userIds: number[]) {
    return ApiService.post(`chat/rooms/${roomId}/members`, { user_ids: userIds })
  }

  static async removeMember(roomId: number, userId: number) {
    return ApiService.delete(`chat/rooms/${roomId}/members/${userId}`)
  }

  static async markRead(roomId: number) {
    return ApiService.post(`chat/rooms/${roomId}/read`, {})
  }
}

export default ChatService
