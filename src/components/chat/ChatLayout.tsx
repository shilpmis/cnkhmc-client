import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import ChatService, { ChatRoom, ChatMessage } from "@/services/ChatService"
import ChatSidebar from "./ChatSidebar"
import ChatWindow from "./ChatWindow"
import { useToast } from "@/hooks/use-toast"
import { User } from "@/types/user"

// Global event for unread count so the app sidebar can listen
const UNREAD_COUNT_EVENT = 'chat:unread-count-change'

export function dispatchUnreadCount(count: number) {
  window.dispatchEvent(new CustomEvent(UNREAD_COUNT_EVENT, { detail: count }))
}

export function useChatUnreadCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const handler = (e: Event) => setCount((e as CustomEvent).detail)
    window.addEventListener(UNREAD_COUNT_EVENT, handler)
    return () => window.removeEventListener(UNREAD_COUNT_EVENT, handler)
  }, [])
  return count
}

export default function ChatLayout() {
  const { toast } = useToast()
  const currentUser = useAppSelector(selectCurrentUser) as User | null
  
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [colleagues, setColleagues] = useState<User[]>([])
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Use refs to keep polling callbacks fresh without triggering effect runs
  const activeRoomIdRef = useRef<number | null>(null)
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  // 1. Fetch colleagues
  useEffect(() => {
    if (!currentUser) return

    ChatService.getColleagues()
      .then((res) => {
        setColleagues(res.data)
      })
      .catch((err) => {
        console.error("Failed to fetch colleagues", err)
      })
  }, [currentUser])

  // 2. Fetch rooms helper
  const fetchRooms = useCallback(() => {
    if (!currentUser) return
    ChatService.getRooms()
      .then((res) => {
        setRooms(res.data)
      })
      .catch((err) => {
        console.error("Failed to fetch chat rooms", err)
      })
  }, [currentUser])

  // 3. Fetch messages helper
  const fetchMessages = useCallback((roomId: number, pageNum: number, append: boolean = false) => {
    setIsLoadingMessages(true)
    ChatService.getMessages(roomId, pageNum, 50)
      .then((res) => {
        const fetchedMessages = res.data.data
        const meta = res.data.meta
        
        if (append) {
          setMessages((prev) => [...prev, ...fetchedMessages])
        } else {
          setMessages(fetchedMessages)
        }
        
        setHasMore(meta.currentPage < meta.lastPage)
      })
      .catch((err) => {
        console.error("Failed to fetch messages", err)
      })
      .finally(() => {
        setIsLoadingMessages(false)
      })
  }, [])

  // Initial fetch on mount & select room
  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    if (activeRoomId) {
      setPage(1)
      fetchMessages(activeRoomId, 1, false)
    } else {
      setMessages([])
    }
  }, [activeRoomId, fetchMessages])

  // Compute and broadcast total unread count
  const totalUnreadCount = useMemo(() => {
    return rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0)
  }, [rooms])

  useEffect(() => {
    dispatchUnreadCount(totalUnreadCount)
  }, [totalUnreadCount])

  // 4. Polling for rooms and active room's new messages
  useEffect(() => {
    if (!currentUser) return

    // Poll rooms list every 3.5 seconds
    const roomsInterval = setInterval(() => {
      ChatService.getRooms()
        .then((res) => {
          const currentActiveId = activeRoomIdRef.current
          // Keep unread_count at 0 for the actively viewed room
          const updatedRooms = res.data.map((r: ChatRoom) =>
            r.id === currentActiveId ? { ...r, unread_count: 0 } : r
          )
          setRooms(updatedRooms)
        })
        .catch((err) => {
          console.error("Failed to fetch chat rooms", err)
        })
    }, 3500)

    // Poll active room messages (page 1) every 2 seconds
    const messagesInterval = setInterval(() => {
      const currentRoomId = activeRoomIdRef.current
      if (currentRoomId) {
        ChatService.getMessages(currentRoomId, 1, 50)
          .then((res) => {
            const latestMessages = res.data.data
            // Simple check: if message count differs or latest message ID differs, update
            setMessages((prev) => {
              const hasNewMessages =
                (prev.length === 0 && latestMessages.length > 0) ||
                (latestMessages.length > 0 && prev[0]?.id !== latestMessages[0]?.id) ||
                prev.length !== latestMessages.length

              if (hasNewMessages) {
                // Auto mark as read since user is viewing this room
                ChatService.markRead(currentRoomId).catch(() => {})
                return latestMessages
              }
              return prev
            })
          })
          .catch((err) => {
            console.error("Polling messages error", err)
          })
      }
    }, 2000)

    return () => {
      clearInterval(roomsInterval)
      clearInterval(messagesInterval)
    }
  }, [currentUser])

  // Get active room details from state
  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === activeRoomId) || null
  }, [rooms, activeRoomId])

  // Load more messages (older)
  const handleLoadMore = () => {
    if (!activeRoomId || isLoadingMessages || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchMessages(activeRoomId, nextPage, true)
  }

  // Send Message
  const handleSendMessage = async (content: string) => {
    if (!activeRoomId) return
    const res = await ChatService.sendMessage(activeRoomId, content)
    const newMessage = res.data
    
    // Optimistically update message list
    setMessages((prev) => [newMessage, ...prev])
    fetchRooms() // Refresh rooms to update latest message in sidebar
  }

  // Select room and mark as read
  const handleSelectRoom = useCallback(async (roomId: number) => {
    setActiveRoomId(roomId)
    try {
      await ChatService.markRead(roomId)
      // Optimistically clear unread count for this room
      setRooms((prev) =>
        prev.map((r) => r.id === roomId ? { ...r, unread_count: 0 } : r)
      )
    } catch (err) {
      console.error('Failed to mark messages as read', err)
    }
  }, [])

  // Create Chat Room
  const handleCreateRoom = async (type: "DIRECT" | "GROUP", name?: string, userIds?: number[]) => {
    const res = await ChatService.createRoom({
      type,
      name,
      user_ids: userIds || [],
    })
    const newRoom = res.data
    
    // Add to list and select it
    setRooms((prev) => [newRoom, ...prev])
    setActiveRoomId(newRoom.id)
    
    toast({
      title: "Success",
      description: type === "GROUP" ? `Group "${name}" created!` : "Direct message started!",
    })
  }

  // Add Members to Group
  const handleAddMembers = async (userIds: number[]) => {
    if (!activeRoomId) return
    const res = await ChatService.addMembers(activeRoomId, userIds)
    const updatedMembers = res.data

    // Update active room members locally
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === activeRoomId) {
          return { ...r, members: updatedMembers }
        }
        return r
      })
    )
  }

  // Remove Member from Group (or leave group)
  const handleRemoveMember = async (userId: number) => {
    if (!activeRoomId) return
    await ChatService.removeMember(activeRoomId, userId)

    if (userId === currentUser?.id) {
      // Current user left, deselect room
      setActiveRoomId(null)
      fetchRooms()
    } else {
      // Another user removed, update members locally
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === activeRoomId) {
            return { ...r, members: r.members.filter((m) => m.user_id !== userId) }
          }
          return r
        })
      )
    }
  }

  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-[calc(100vh-140px)] shadow-lg transition-all duration-300">
      <ChatSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        colleagues={colleagues}
        currentUser={currentUser}
        onCreateRoom={handleCreateRoom}
      />
      <ChatWindow
        room={activeRoom}
        messages={messages}
        currentUser={currentUser}
        colleagues={colleagues}
        hasMoreMessages={hasMore}
        isLoadingMessages={isLoadingMessages}
        onLoadMoreMessages={handleLoadMore}
        onSendMessage={handleSendMessage}
        onAddMembers={handleAddMembers}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  )
}
