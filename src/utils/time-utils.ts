export function formatTime(hours: number, minutes: number, seconds: number): string {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  
  export function calculateTimeDifference(startTime: string, endTime?: string): string {
    if (!startTime) return "00:00:00"
  
    const [startHours, startMinutes] = startTime.split(":").map(Number)
  
    let endHours: number, endMinutes: number
  
    if (endTime) {
      ;[endHours, endMinutes] = endTime.split(":").map(Number)
    } else {
      const now = new Date()
      endHours = now.getHours()
      endMinutes = now.getMinutes()
    }
  
    let diffHours = endHours - startHours
    let diffMinutes = endMinutes - startMinutes
  
    if (diffMinutes < 0) {
      diffHours--
      diffMinutes += 60
    }
  
    if (diffHours < 0) {
      diffHours += 24
    }
  
    return formatTime(diffHours, diffMinutes, 0)
  }
  
  export function getCurrentTimeString(): string {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }
  