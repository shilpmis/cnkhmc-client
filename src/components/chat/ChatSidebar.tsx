import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Plus, Search, Users, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { User, UserRole } from "@/types/user"
import { ChatRoom } from "@/services/ChatService"

// Helper to generate a consistent avatar color based on name
export function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 70%, 45%)`
}

interface ChatSidebarProps {
  rooms: ChatRoom[]
  activeRoomId: number | null
  onSelectRoom: (roomId: number) => void
  colleagues: User[]
  currentUser: User | null
  onCreateRoom: (type: "DIRECT" | "GROUP", name?: string, userIds?: number[]) => Promise<void>
}

export default function ChatSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  colleagues,
  currentUser,
  onCreateRoom,
}: ChatSidebarProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDmModalOpen, setIsDmModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

  // DM search & selection
  const [dmSearch, setDmSearch] = useState("")
  
  // Group create form state
  const [groupName, setGroupName] = useState("")
  const [groupSearch, setGroupSearch] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])

  const isAdmin = useMemo(() => {
    if (!currentUser) return false
    const roleStr = String(currentUser.system_role || currentUser.role || "").toUpperCase()
    return (
      roleStr.includes("ADMIN") ||
      roleStr.includes("DEVELOPER") ||
      currentUser.role_id === 1 || // ADMIN ID
      currentUser.role_id === 8 || // SUPER_ADMIN ID
      currentUser.role_id === 11   // DEVELOPER ID
    )
  }, [currentUser])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return rooms

    return rooms.filter((room) => {
      if (room.type === "GROUP") {
        return room.name?.toLowerCase().includes(query)
      } else {
        // Direct messages: filter by colleague name
        const otherMember = room.members.find((m) => m.user_id !== currentUser?.id)
        return otherMember?.user?.name?.toLowerCase().includes(query)
      }
    })
  }, [rooms, searchQuery, currentUser])

  // Filter colleagues for starting a new DM
  const filteredDmColleagues = useMemo(() => {
    const query = dmSearch.toLowerCase().trim()
    if (!query) return colleagues
    return colleagues.filter(
      (c) => c.name.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
    )
  }, [colleagues, dmSearch])

  // Filter colleagues for adding to a new group
  const filteredGroupColleagues = useMemo(() => {
    const query = groupSearch.toLowerCase().trim()
    if (!query) return colleagues
    return colleagues.filter(
      (c) => c.name.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
    )
  }, [colleagues, groupSearch])

  const handleStartDm = async (userId: number) => {
    try {
      await onCreateRoom("DIRECT", undefined, [userId])
      setIsDmModalOpen(false)
      setDmSearch("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to start direct message",
        variant: "destructive",
      })
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    try {
      await onCreateRoom("GROUP", groupName.trim(), selectedMembers)
      setIsGroupModalOpen(false)
      setGroupName("")
      setSelectedMembers([])
      setGroupSearch("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create group",
        variant: "destructive",
      })
    }
  }

  const toggleMemberSelection = (userId: number) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId))
    } else {
      setSelectedMembers([...selectedMembers, userId])
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 w-80 md:w-96 flex-shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-orange-500" />
          Inbox
        </h2>
        <div className="flex items-center gap-1">
          {/* New DM Button */}
          <Button
            size="icon"
            variant="ghost"
            title="New Direct Message"
            onClick={() => setIsDmModalOpen(true)}
            className="hover:text-orange-600 dark:hover:text-orange-400"
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* New Group Button (Admins only) */}
          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              title="New Group Chat"
              onClick={() => setIsGroupModalOpen(true)}
              className="hover:text-orange-600 dark:hover:text-orange-400"
            >
              <Users className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-1">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No conversations found
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = room.id === activeRoomId
              const lastMessage = room.messages?.[0]
              
              // Get other user's info for DMs
              const otherMember = room.type === "DIRECT"
                ? room.members.find((m) => m.user_id !== currentUser?.id)
                : null
              
              const chatName = room.type === "GROUP"
                ? room.name
                : otherMember?.user?.name || "Direct Message"

              const chatSub = room.type === "GROUP"
                ? `${room.members.length} members`
                : otherMember?.user?.role?.role || "Colleague"

              const avatarLetters = (chatName || "DM")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-sm focus:outline-none",
                    isActive
                      ? "bg-orange-50 dark:bg-orange-950/20 text-orange-950 dark:text-orange-100 border-l-4 border-orange-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0 border border-slate-100 dark:border-slate-800">
                    <AvatarFallback
                      style={{
                        backgroundColor: getAvatarColor(chatName || "Room"),
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {avatarLetters}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">
                        {chatName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(room.unread_count ?? 0) > 0 && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-500 rounded-full leading-none">
                            {room.unread_count! > 99 ? '99+' : room.unread_count}
                          </span>
                        )}
                        {room.type === "GROUP" && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                          >
                            Group
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {lastMessage ? (
                        <>
                          <span className="font-medium">
                            {lastMessage.sender_id === currentUser?.id ? "You" : lastMessage.sender?.name}:{" "}
                          </span>
                          {lastMessage.content}
                        </>
                      ) : (
                        chatSub
                      )}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* New DM Modal */}
      <Dialog open={isDmModalOpen} onOpenChange={setIsDmModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              New Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search colleagues..."
                value={dmSearch}
                onChange={(e) => setDmSearch(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <ScrollArea className="h-64 border border-slate-100 dark:border-slate-900 rounded-md p-2">
              <div className="space-y-1">
                {filteredDmColleagues.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No colleagues found</div>
                ) : (
                  filteredDmColleagues.map((colleague) => (
                    <button
                      key={colleague.id}
                      onClick={() => handleStartDm(colleague.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors duration-150"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          style={{
                            backgroundColor: getAvatarColor(colleague.name),
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        >
                          {colleague.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-slate-850 dark:text-slate-150">
                          {colleague.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{colleague.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Group Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Create Group Chat
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Group Name
              </label>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Members
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search colleagues to add..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <ScrollArea className="h-56 border border-slate-100 dark:border-slate-900 rounded-md p-2">
              <div className="space-y-1">
                {filteredGroupColleagues.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No colleagues found</div>
                ) : (
                  filteredGroupColleagues.map((colleague) => {
                    const isSelected = selectedMembers.includes(colleague.id)
                    return (
                      <button
                        key={colleague.id}
                        onClick={() => toggleMemberSelection(colleague.id)}
                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              style={{
                                backgroundColor: getAvatarColor(colleague.name),
                                color: "#fff",
                                fontSize: "12px",
                              }}
                            >
                              {colleague.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-slate-850 dark:text-slate-150">
                              {colleague.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{colleague.email}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="border-t border-slate-100 dark:border-slate-900 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsGroupModalOpen(false)
                setSelectedMembers([])
                setGroupName("")
                setGroupSearch("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
