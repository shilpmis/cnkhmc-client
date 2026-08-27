import { useState, useEffect } from "react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, CalendarIcon, ShieldCheck } from "lucide-react"
import DiaryLogPermissionService from "@/services/DiaryLogPermissionService"
import { format } from "date-fns"
import ApiService from "@/services/ApiService"

export default function DiaryLogPermissionsTab() {
  const { t } = useTranslation()
  const { toast } = useToast()
  
  const [permissions, setPermissions] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchPermissions()
    fetchStaff()
  }, [])

  const fetchPermissions = async () => {
    try {
      setIsLoading(true)
      const res = await DiaryLogPermissionService.getPermissions()
      setPermissions(res.data)
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_permissions") })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await ApiService.get("staff?alldata=true")
      // Use standard getStaff list or however the project handles it. 
      // If ApiService.get("staff") returns an array inside data:
      setStaffList(res.data.data || res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleGrantPermission = async () => {
    if (!selectedStaffId || !selectedDate) return
    try {
      setIsLoading(true)
      await DiaryLogPermissionService.grantPermission({ 
        staffId: parseInt(selectedStaffId), 
        date: selectedDate 
      })
      toast({ title: t("success"), description: t("permission_granted") })
      setSelectedStaffId("")
      fetchPermissions()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: t("error"), description: t("failed_to_grant_permission") })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      setIsLoading(true)
      await DiaryLogPermissionService.revokePermission(id)
      toast({ title: t("success"), description: t("permission_revoked") })
      fetchPermissions()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: t("error"), description: t("failed_to_revoke_permission") })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-6 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("teacher")}</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="h-11 border-gray-200 focus:ring-indigo-500 rounded-xl w-full">
                  <SelectValue placeholder={t("select_teacher")} />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.first_name} {s.last_name} ({s.employee_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1 max-w-xs">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("date_to_allow")}</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="date" 
                  className="pl-10 h-11 border-gray-200 focus:ring-indigo-500 rounded-xl" 
                  value={selectedDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md gap-2 transition-all h-11 rounded-xl px-6"
              onClick={handleGrantPermission}
              disabled={isLoading || !selectedStaffId || !selectedDate}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t("grant_permission")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[120px] text-[10px] font-black text-gray-400 uppercase py-5 pl-8">{t("date_allowed")}</TableHead>
                <TableHead className="text-[10px] font-black text-gray-400 uppercase">{t("teacher")}</TableHead>
                <TableHead className="text-[10px] font-black text-gray-400 uppercase">{t("granted_by")}</TableHead>
                <TableHead className="w-[120px] text-[10px] font-black text-gray-400 uppercase text-right pr-8">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-gray-500 font-medium">
                    {t("no_permissions_granted")}
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((p) => (
                  <TableRow key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                    <TableCell className="pl-8 py-4 font-bold text-gray-900">
                      {format(new Date(p.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-800">
                        {p.staff?.first_name} {p.staff?.last_name}
                      </span>
                      <div className="text-[10px] text-gray-500">{p.staff?.employee_code}</div>
                    </TableCell>
                    <TableCell>
                      {p.grantedByUser?.first_name} {p.grantedByUser?.last_name}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRevoke(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
