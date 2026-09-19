import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Send, 
  Info, 
  UserPlus, 
  Trash2, 
  LogOut, 
  MessageSquare,
  Search,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { User } from "@/types/user"
import { ChatRoom, ChatMessage } from "@/services/ChatService"
import { getAvatarColor } from "./ChatSidebar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ChatWindowProps {
  room: ChatRoom | null
  messages: ChatMessage[]
  currentUser: User | null
  colleagues: User[]
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  onLoadMoreMessages: () => void
  onSendMessage: (content: string) => Promise<void>
  onAddMembers: (userIds: number[]) => Promise<void>
  onRemoveMember: (userId: number) => Promise<void>
}

export default function ChatWindow({
  room,
  messages,
  currentUser,
  colleagues,
  hasMoreMessages,
  isLoadingMessages,
  onLoadMoreMessages,
  onSendMessage,
  onAddMembers,
  onRemoveMember,
}: ChatWindowProps) {
  const { toast } = useToast()
  const [typedMessage, setTypedMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  
  // Member add state
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedForAdd, setSelectedForAdd] = useState<number[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on room or messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, room?.id])

  // Get other user's info for DMs
  const otherMember = useMemo(() => {
    if (!room || room.type !== "DIRECT") return null
    return room.members.find((m) => m.user_id !== currentUser?.id)
  }, [room, currentUser])

  const chatName = useMemo(() => {
    if (!room) return ""
    if (room.type === "GROUP") return room.name || "Group Chat"
    return otherMember?.user?.name || "Direct Message"
  }, [room, otherMember])

  const chatSubtitle = useMemo(() => {
    if (!room) return ""
    if (room.type === "GROUP") return `${room.members.length} members`
    return otherMember?.user?.role?.role || "Colleague"
  }, [room, otherMember])

  // Find if current user is an Admin in this chat room
  const currentUserChatRole = useMemo(() => {
    if (!room) return "MEMBER"
    const currentMember = room.members.find((m) => m.user_id === currentUser?.id)
    return currentMember?.role || "MEMBER"
  }, [room, currentUser])

  const isChatAdmin = currentUserChatRole === "ADMIN"

  // Filter colleagues to add to group (only those who aren't already members)
  const addableColleagues = useMemo(() => {
    if (!room) return []
    const memberIds = room.members.map((m) => m.user_id)
    const filterQuery = memberSearch.toLowerCase().trim()
    
    return colleagues.filter((colleague) => {
      if (memberIds.includes(colleague.id)) return false
      if (!filterQuery) return true
      return (
        colleague.name.toLowerCase().includes(filterQuery) ||
        colleague.email?.toLowerCase().includes(filterQuery)
      )
    })
  }, [colleagues, room, memberSearch])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(typedMessage.trim())
      setTypedMessage("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleAddMembers = async () => {
    if (selectedForAdd.length === 0) return

    try {
      await onAddMembers(selectedForAdd)
      setIsAddMemberDialogOpen(false)
      setSelectedForAdd([])
      setMemberSearch("")
      toast({
        title: "Success",
        description: "Members added successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to add members",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await onRemoveMember(userId)
      toast({
        title: "Success",
        description: "Member removed successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = () => {
    setIsLeaveConfirmOpen(true)
  }

  const confirmLeaveGroup = async () => {
    if (!currentUser) return
    try {
      await onRemoveMember(currentUser.id)
      setIsInfoDialogOpen(false)
      toast({
        title: "Success",
        description: "You have left the group",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to leave group",
        variant: "destructive",
      })
    }
  }

  const toggleSelectForAdd = (userId: number) => {
    if (selectedForAdd.includes(userId)) {
      setSelectedForAdd(selectedForAdd.filter((id) => id !== userId))
    } else {
      setSelectedForAdd([...selectedForAdd, userId])
    }
  }

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 text-center select-none">
        <div className="p-4 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-full mb-4">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Your Conversations</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a chat room or Direct Message from the sidebar, or create a new conversation with a colleague.
        </p>
      </div>
    )
  }

  // Reverse messages to display in chronological order
  const chronologicalMessages = [...messages].reverse()

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Active Room Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
            <AvatarFallback
              style={{
                backgroundColor: getAvatarColor(chatName),
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {(chatName || "Room")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {chatName}
            </h3>
            <p className="text-xs text-slate-500 truncate">{chatSubtitle}</p>
          </div>
        </div>
        <div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsInfoDialogOpen(true)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {hasMoreMessages && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMoreMessages}
                disabled={isLoadingMessages}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                {isLoadingMessages ? "Loading older messages..." : "Load older messages"}
              </Button>
            </div>
          )}

          {chronologicalMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Start the conversation! Send a message below.
            </div>
          ) : (
            chronologicalMessages.map((msg, index) => {
              const isSelf = msg.sender_id === currentUser?.id
              const showSenderName = room.type === "GROUP" && !isSelf
              
              // Only show date divider if date differs from previous message
              const showDateDivider =
                index === 0 ||
                new Date(msg.created_at).toDateString() !==
                  new Date(chronologicalMessages[index - 1].created_at).toDateString()

              return (
                <div key={msg.id} className="space-y-2">
                  {showDateDivider && (
                    <div className="flex justify-center my-4">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {new Date(msg.created_at).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex items-end gap-2 max-w-[80%] md:max-w-[70%]",
                      isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isSelf && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback
                          style={{
                            backgroundColor: getAvatarColor(msg.sender?.name || "Colleague"),
                            color: "#fff",
                            fontSize: "10px",
                          }}
                        >
                          {(msg.sender?.name || "C")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col">
                      {showSenderName && (
                        <span className="text-[10px] text-slate-500 font-semibold mb-0.5 ml-1">
                          {msg.sender?.name}
                        </span>
                      )}
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words whitespace-pre-wrap leading-relaxed",
                          isSelf
                            ? "bg-orange-600 text-white rounded-br-none"
                            : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-150 rounded-bl-none"
                        )}
                      >
                        {msg.content}
                        <span
                          className={cn(
                            "text-[9px] mt-1 text-right block",
                            isSelf ? "text-orange-200" : "text-slate-400"
                          )}
                        >
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input Box */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3 shadow-md"
      >
        <Input
          placeholder="Type your message..."
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="flex-1 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 py-6 text-slate-900 dark:text-slate-100"
        />
        <Button
          type="submit"
          disabled={!typedMessage.trim() || isSending}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-3 h-11 w-11 flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      {/* Info Dialog (Room Info / Group Management) */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {room.type === "GROUP" ? "Group Information" : "Colleague Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="flex flex-col items-center text-center p-3 border-b border-slate-100 dark:border-slate-900 pb-5">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarFallback
                  style={{
                    backgroundColor: getAvatarColor(chatName),
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: 600,
                  }}
                >
                  {(chatName || "Room")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{chatName}</h4>
              <p className="text-xs text-slate-500">{chatSubtitle}</p>
            </div>

            {/* Group Members List */}
            {room.type === "GROUP" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Members ({room.members.length})
                  </span>
                  {isChatAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddMemberDialogOpen(true)
                        setIsInfoDialogOpen(false)
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 h-8 gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add member
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-44 pr-2">
                  <div className="space-y-2">
                    {room.members.map((member) => {
                      const isMemberSelf = member.user_id === currentUser?.id
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback
                                style={{
                                  backgroundColor: getAvatarColor(member.user.name),
                                  color: "#fff",
                                  fontSize: "10px",
                                }}
                              >
                                {member.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                                {member.user.name} {isMemberSelf && "(You)"}
                              </p>
                              <p className="text-[10px] text-slate-450 truncate">
                                {member.user.role?.role || "Member"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {member.role === "ADMIN" && (
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                            {/* Remove button (if current user is admin, and isn't removing themselves) */}
                            {isChatAdmin && !isMemberSelf && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="h-7 w-7 text-slate-400 hover:text-red-600 rounded-full"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900 pt-3">
              {room.type === "GROUP" && (
                <Button variant="destructive" onClick={handleLeaveGroup} className="gap-1.5">
                  <LogOut className="h-4 w-4" />
                  Leave Group
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsInfoDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Add Members to Group
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search colleagues to add..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-orange-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <ScrollArea className="h-48 border border-slate-100 dark:border-slate-900 rounded-md p-2">
              <div className="space-y-1">
                {addableColleagues.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No colleagues available</div>
                ) : (
                  addableColleagues.map((colleague) => {
                    const isSelected = selectedForAdd.includes(colleague.id)
                    return (
                      <button
                        key={colleague.id}
                        onClick={() => toggleSelectForAdd(colleague.id)}
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
                setIsAddMemberDialogOpen(false)
                setSelectedForAdd([])
                setMemberSearch("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedForAdd.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Add Selected ({selectedForAdd.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isLeaveConfirmOpen}
        onOpenChange={setIsLeaveConfirmOpen}
        title="Leave Group"
        description={
          isChatAdmin
            ? "Are you sure you want to leave this group? If you are the last admin, you must promote another member first."
            : "Are you sure you want to leave this group?"
        }
        confirmText="Leave Group"
        variant="destructive"
        onConfirm={confirmLeaveGroup}
      />
    </div>
  )
}
