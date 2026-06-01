import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentActivities = [
  {
    name: "John Doe",
    action: "submitted an assignment",
    time: "2 hours ago",
    avatar: "/avatars/01.png",
    initials: "JD",
  },
  {
    name: "Jane Smith",
    action: "created a new course",
    time: "4 hours ago",
    avatar: "/avatars/02.png",
    initials: "JS",
  },
  {
    name: "Bob Johnson",
    action: "updated student records",
    time: "6 hours ago",
    avatar: "/avatars/03.png",
    initials: "BJ",
  },
  {
    name: "Alice Brown",
    action: "scheduled a parent-teacher meeting",
    time: "1 day ago",
    avatar: "/avatars/04.png",
    initials: "AB",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {recentActivities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.avatar} alt={activity.name} />
            <AvatarFallback>{activity.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.name}</p>
            <p className="text-sm text-muted-foreground">{activity.action}</p>
          </div>
          <div className="ml-auto font-medium text-sm text-muted-foreground">{activity.time}</div>
        </div>
      ))}
    </div>
  )
}

