import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  AlertCircle, 
  AlertTriangle, 
  Edit, 
  Plus, 
  Trash2, 
  Search, 
  Users, 
  Layers, 
  Briefcase, 
  BadgeCheck, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Shield, 
  SlidersHorizontal,
  X
} from "lucide-react"
import CertificateTemplateSettings from "./CertificateTemplateSettings"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  createStaffRole,
  deleteStaffRole,
  updateStaffRole,
  useLazyGetSchoolStaffRoleQuery,
  useGetStaffConfigurationsQuery,
  useCreateStaffConfigurationMutation,
  useUpdateStaffConfigurationMutation,
  useDeleteStaffConfigurationMutation
} from "@/services/StaffService"
import { StaffRole, StaffConfiguration } from "@/types/staff"
import { selectSchoolStaffRoles } from "@/redux/slices/staffSlice"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchemaForStaffRole = z.object({
  role_id: z.number().nullable(),
  role_name: z
    .string()
    .min(3, 'Role should be at least of 3 characters')
    .max(20, 'Role should not be more than 20 characters')
    .regex(/^[a-zA-Z]+( [a-zA-Z]+)*$/, {
      message: "Only letters are allowed with a single space between words",
    }),
  role_type: z.enum(['non-teaching', 'teaching']),
  formType: z.enum(["create", "edit"])
})

type ConfigType = 'STAFF_TYPE' | 'STAFF_CATEGORY' | 'DESIGNATION' | 'EMPLOYMENT_STATUS' | 'LETTER_TYPE' | 'SUBJECT_SPECIALIZATION' | 'QUALIFICATION'

interface ConfigTabPanelProps {
  title: string
  description: string
  icon: React.ElementType
  configType: ConfigType
  items: StaffConfiguration[]
  parentLabel?: string
  searchPlaceholder?: string
  onAdd: (type: ConfigType) => void
  onEdit: (type: ConfigType, item: StaffConfiguration) => void
  onDelete: (item: StaffConfiguration) => void
}

function ConfigTabPanel({
  title,
  description,
  icon: Icon,
  configType,
  items,
  parentLabel,
  searchPlaceholder = "Search items...",
  onAdd,
  onEdit,
  onDelete
}: ConfigTabPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter((item) => 
      item.name.toLowerCase().includes(term) ||
      (item.parent?.name && item.parent.name.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  return (
    <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
      <CardHeader className="p-6 pb-5 border-b border-border/60 bg-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <CardDescription className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {items.length > 0 && (
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-lg"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <Button 
              onClick={() => onAdd(configType)} 
              className="h-9 px-4 text-xs font-medium rounded-lg shadow-sm gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add {title.replace(/s$/, '')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3.5">
              <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No {title} configured yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
              Get started by adding your first {title.toLowerCase().replace(/s$/, '')} for your institution.
            </p>
            <Button 
              onClick={() => onAdd(configType)}
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {title.replace(/s$/, '')}
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No results matching "{searchTerm}"</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchTerm("")} 
              className="mt-2 text-xs text-primary"
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 font-semibold text-xs uppercase tracking-wider text-muted-foreground">#</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                  {parentLabel && (
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{parentLabel}</TableHead>
                  )}
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-sm text-foreground">
                      {item.name}
                    </TableCell>
                    {parentLabel && (
                      <TableCell>
                        {item.parent?.name ? (
                          <Badge variant="outline" className="text-xs bg-background font-normal border-border/80">
                            {item.parent.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={() => onEdit(configType, item)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function StaffSettings() {
  const [createConfig] = useCreateStaffConfigurationMutation()
  const [updateConfig] = useUpdateStaffConfigurationMutation()
  const [deleteConfig] = useDeleteStaffConfigurationMutation()
  const { data: allConfigs, isLoading: isConfigsLoading } = useGetStaffConfigurationsQuery()

  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [configDialogMode, setConfigDialogMode] = useState<"add" | "edit">("add")
  const [configDialogType, setConfigDialogType] = useState<ConfigType>('STAFF_TYPE')
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [configName, setConfigName] = useState("")
  const [configParentId, setConfigParentId] = useState<string>("")
  const [isConfigDeleteOpen, setIsConfigDeleteOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<any>(null)

  const staffTypes = useMemo(() => allConfigs?.filter(c => c.config_type === 'STAFF_TYPE') || [], [allConfigs])
  const staffCategories = useMemo(() => allConfigs?.filter(c => c.config_type === 'STAFF_CATEGORY') || [], [allConfigs])
  const designations = useMemo(() => allConfigs?.filter(c => c.config_type === 'DESIGNATION') || [], [allConfigs])
  const employmentStatuses = useMemo(() => allConfigs?.filter(c => c.config_type === 'EMPLOYMENT_STATUS') || [], [allConfigs])
  const letterTypes = useMemo(() => allConfigs?.filter(c => c.config_type === 'LETTER_TYPE') || [], [allConfigs])
  const subjectSpecializations = useMemo(() => allConfigs?.filter(c => c.config_type === 'SUBJECT_SPECIALIZATION') || [], [allConfigs])
  const qualifications = useMemo(() => allConfigs?.filter(c => c.config_type === 'QUALIFICATION') || [], [allConfigs])

  const handleOpenConfigDialog = (type: ConfigType, mode: "add" | "edit", item?: any) => {
    setConfigDialogType(type)
    setConfigDialogMode(mode)
    if (mode === "edit" && item) {
      setSelectedConfig(item)
      setConfigName(item.name)
      setConfigParentId(item.parent_id?.toString() || "")
    } else {
      setSelectedConfig(null)
      setConfigName("")
      setConfigParentId("")
    }
    setIsConfigDialogOpen(true)
  }

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configName.trim()) return

    const payload = {
      config_type: configDialogType,
      name: configName.trim(),
      parent_id: configParentId ? Number(configParentId) : null
    }

    try {
      if (configDialogMode === "edit" && selectedConfig) {
        await updateConfig({
          id: selectedConfig.id,
          payload: {
            name: payload.name,
            parent_id: payload.parent_id
          }
        }).unwrap()
        toast({
          title: "Configuration Updated",
          description: `Successfully updated "${configName}".`,
        })
      } else {
        await createConfig(payload).unwrap()
        toast({
          title: "Configuration Created",
          description: `Successfully created "${configName}".`,
        })
      }
      setIsConfigDialogOpen(false)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving configuration",
        description: err.data?.message || "Something went wrong",
      })
    }
  }

  const handleConfigDelete = async () => {
    if (!configToDelete) return
    try {
      await deleteConfig(configToDelete.id).unwrap()
      toast({
        title: "Configuration Deleted",
        description: "Successfully deleted.",
      })
      setIsConfigDeleteOpen(false)
      setConfigToDelete(null)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting configuration",
        description: err.data?.message || "Something went wrong",
      })
    }
  }

  const formForStaffRole = useForm<z.infer<typeof formSchemaForStaffRole>>({
    resolver: zodResolver(formSchemaForStaffRole),
    defaultValues: {
      role_id: null,
      role_name: "",
      role_type: "teaching",
      formType: 'create'
    },
  })

  const dispatch = useAppDispatch()
  const authState = useAppSelector(selectAuthState)
  const StaffRoleState = useAppSelector(selectSchoolStaffRoles)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const [
    getSchoolStaff, 
    { isLoading: isRoleLoading, isFetching },
  ] = useLazyGetSchoolStaffRoleQuery();
 
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogForDeleteStaffOpen, setIsDialogForDeleteStaffOpen] = useState<boolean>(false)
  const [roleToDelete, setRoleToDelete] = useState<StaffRole | null>(null)
  const { t } = useTranslation()
  const [roleSearchTerm, setRoleSearchTerm] = useState("")

  const filteredRoles = useMemo(() => {
    if (!StaffRoleState) return []
    if (!roleSearchTerm.trim()) return StaffRoleState
    const term = roleSearchTerm.toLowerCase()
    return StaffRoleState.filter((r) => 
      r.role.toLowerCase().includes(term) ||
      (r.is_teaching_role ? "teaching" : "non-teaching").includes(term)
    )
  }, [StaffRoleState, roleSearchTerm])

  const handleOpenDialog = (mode: "add" | "edit", role?: StaffRole) => {
    if (mode === "edit" && role) {
      formForStaffRole.reset({
        role_id: role.id,
        formType: 'edit',
        role_name: role.role,
        role_type: role.is_teaching_role ? 'teaching' : 'non-teaching'
      })
    } else {
      formForStaffRole.reset({
        role_id: null,
        formType: 'create',
        role_name: "",
        role_type: 'teaching'
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleSubmit = async () => {
    try {
      if (formForStaffRole.getValues('formType') === "edit") {
        let role_id = formForStaffRole.getValues('role_id')
        if (role_id) {
          await dispatch(updateStaffRole({
            staff_id: role_id,
            payload: { role: formForStaffRole.getValues('role_name') }
          }))
        } else {
          toast({ variant: "destructive", title: "Role ID Missing", description: "Role ID has not been provided." })
        }
        toast({
          title: "Role Updated",
          description: `${formForStaffRole.getValues('role_name')} has been updated.`,
        })
      } else {
        let new_staff = await dispatch(createStaffRole({
          payload: {
            role: formForStaffRole.getValues('role_name'),
            is_teaching_role: formForStaffRole.getValues('role_type') === 'teaching',
            school_id: authState.user!.school_id,
          },
          academic_session: CurrentAcademicSessionForSchool!.id
        }))
        if (new_staff.meta.requestStatus === 'rejected') {
          toast({
            variant: "destructive",
            title: "Error!",
            description: `${new_staff.payload.message}!`,
          })
        } else {
          toast({
            title: "Role Created!",
            description: `${formForStaffRole.getValues('role_name')} has been created.`,
          })
          handleCloseDialog()
        }
      }
      getSchoolStaff(authState.user!.school_id);
      handleCloseDialog()
    } catch (error) {
      toast({
        title: `Failed to ${formForStaffRole.getValues('formType')} role. Already Present`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (id: number) => {
    try {
      await dispatch(deleteStaffRole(id)).unwrap()
      toast({
        title: "Role Removed",
        description: "The role has been removed from the list.",
      })
      setIsDialogForDeleteStaffOpen(false)
      setRoleToDelete(null)
      getSchoolStaff(authState.user!.school_id);
      handleCloseDialog()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete role",
        description: error?.message || (typeof error === 'string' ? error : "Failed to delete role.")
      })
    }
  }

  useEffect(() => {
    if (!StaffRoleState) {
      getSchoolStaff(authState.user!.school_id)
    }
  }, [])

  const configTypeTitles: Record<ConfigType, string> = {
    STAFF_TYPE: "Staff Option",
    STAFF_CATEGORY: "Staff Category",
    DESIGNATION: "Designation",
    EMPLOYMENT_STATUS: "Staff Type",
    LETTER_TYPE: "Letter Type",
    SUBJECT_SPECIALIZATION: "Subject Specialization",
    QUALIFICATION: "Qualification"
  }

  if (isRoleLoading && isConfigsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t("staff_settings")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage roles, classifications, qualifications, letter templates, and subject specializations
              </p>
            </div>
          </div>
        </div>

        {isFetching && (
          <Badge variant="outline" className="animate-pulse gap-1.5 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            Syncing changes...
          </Badge>
        )}
      </div>

      <Tabs defaultValue="subject-specializations" className="w-full space-y-6">
        {/* Modern 2-Row Tabs Navigation Bar */}
        <div className="p-2 bg-muted/60 rounded-2xl border border-border/60 backdrop-blur-xs">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent p-0 h-auto w-full">
            <TabsTrigger 
              value="legacy-roles" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Legacy Roles</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {StaffRoleState?.length || 0}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="staff-types" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Staff</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {staffTypes.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="employment-statuses" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <BadgeCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Staff Types</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {employmentStatuses.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="letter-types" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Letter Types</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {letterTypes.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="subject-specializations" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Subject Specializations</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {subjectSpecializations.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="qualifications" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Qualifications</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-mono shrink-0">
                {qualifications.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger 
              value="certificate-templates" 
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all w-full border border-transparent data-[state=active]:border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Certificates & Letters</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Legacy Roles Tab */}
        <TabsContent value="legacy-roles">
          <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <CardHeader className="p-6 pb-5 border-b border-border/60 bg-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <CardTitle className="text-xl font-bold tracking-tight">{t("manage_satff_designation")}</CardTitle>
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold rounded-full">
                        {StaffRoleState?.length || 0} roles
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {t("add,_edit,_or_remove_staff_roles_for_your_school")}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {StaffRoleState && StaffRoleState.length > 0 && (
                    <div className="relative w-full md:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search roles..."
                        value={roleSearchTerm}
                        onChange={(e) => setRoleSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-lg"
                      />
                      {roleSearchTerm && (
                        <button
                          onClick={() => setRoleSearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <Button onClick={() => handleOpenDialog("add")} className="h-9 px-4 text-xs font-medium rounded-lg shadow-sm gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" />
                    {t("add_role")}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {StaffRoleState && StaffRoleState.length > 0 ? (
                filteredRoles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                    <Search className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm font-medium">No roles matching "{roleSearchTerm}"</p>
                    <Button variant="ghost" size="sm" onClick={() => setRoleSearchTerm("")} className="mt-2 text-xs text-primary">
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16 font-semibold text-xs uppercase tracking-wider text-muted-foreground">#</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{t("role_name")}</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{t("role_type")}</TableHead>
                          <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((staff, idx) => (
                          <TableRow key={staff.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-foreground">{staff.role}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${
                                  staff.is_teaching_role 
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                }`}
                              >
                                {staff.is_teaching_role ? "Teaching" : "Non-Teaching"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                                  onClick={() => handleOpenDialog("edit", staff)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />{t("edit")}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setRoleToDelete(staff)
                                    setIsDialogForDeleteStaffOpen(true)
                                  }}
                                  className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />{t("delete")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3.5">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t("no_staff_role_available")}</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                    {t("please_create_role_for_your_school_staff!")}
                  </p>
                  <Button onClick={() => handleOpenDialog("add")} size="sm" className="gap-1.5 rounded-lg text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    {t("add_role")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Options Tab */}
        <TabsContent value="staff-types">
          <ConfigTabPanel
            title="Staff Options"
            description="Manage primary staff selections (e.g. Teaching, Non Teaching, Hospital, Mess, Hostel, Other)"
            icon={Users}
            configType="STAFF_TYPE"
            items={staffTypes}
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Staff Categories Tab */}
        <TabsContent value="staff-categories">
          <ConfigTabPanel
            title="Staff Categories"
            description="Manage hospital staff categories (e.g. Medical, Para-Medical, Auxillary, Administrative)"
            icon={Layers}
            configType="STAFF_CATEGORY"
            items={staffCategories}
            parentLabel="Parent Staff"
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Designations Tab */}
        <TabsContent value="designations">
          <ConfigTabPanel
            title="Designations"
            description="Define specific job titles under respective staff categories"
            icon={Briefcase}
            configType="DESIGNATION"
            items={designations}
            parentLabel="Parent Category"
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Staff Types Tab */}
        <TabsContent value="employment-statuses">
          <ConfigTabPanel
            title="Staff Types"
            description="Manage staff type selections (e.g. Full Time, Guest/Visiting, On Call, Part Time, Practising Consultant, Adhoc, Contractual)"
            icon={BadgeCheck}
            configType="EMPLOYMENT_STATUS"
            items={employmentStatuses}
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Letter Types Tab */}
        <TabsContent value="letter-types">
          <ConfigTabPanel
            title="Letter Types"
            description="Configure institutional letters (e.g., Approval Letters, Appointment Orders, Experience Certificates)"
            icon={FileText}
            configType="LETTER_TYPE"
            items={letterTypes}
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Subject Specializations Tab */}
        <TabsContent value="subject-specializations">
          <ConfigTabPanel
            title="Subject Specializations"
            description="Manage subject disciplines selectable when onboarding teaching staff"
            icon={BookOpen}
            configType="SUBJECT_SPECIALIZATION"
            items={subjectSpecializations}
            searchPlaceholder="Search subjects..."
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Qualifications Tab */}
        <TabsContent value="qualifications">
          <ConfigTabPanel
            title="Qualifications"
            description="Define educational degrees and certifications selectable in staff profiles"
            icon={GraduationCap}
            configType="QUALIFICATION"
            items={qualifications}
            searchPlaceholder="Search qualifications..."
            onAdd={(type) => handleOpenConfigDialog(type, "add")}
            onEdit={(type, item) => handleOpenConfigDialog(type, "edit", item)}
            onDelete={(item) => {
              setConfigToDelete(item)
              setIsConfigDeleteOpen(true)
            }}
          />
        </TabsContent>

        {/* Certificate Templates Tab */}
        <TabsContent value="certificate-templates">
          <CertificateTemplateSettings />
        </TabsContent>
      </Tabs>

      {/* Configurations Add/Edit Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {configDialogMode === "add" ? "Add " : "Edit "} 
              {configTypeTitles[configDialogType]}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configDialogMode === "add" 
                ? `Enter details to create a new ${configTypeTitles[configDialogType].toLowerCase()}.` 
                : `Update details for this ${configTypeTitles[configDialogType].toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfigSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="config-name" className="text-xs font-semibold">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="config-name" 
                type="text" 
                placeholder={`Enter ${configTypeTitles[configDialogType].toLowerCase()} name`}
                value={configName} 
                onChange={(e) => setConfigName(e.target.value)} 
                className="h-10 rounded-xl text-sm"
                required
                autoFocus
              />
            </div>

            {configDialogType === 'STAFF_CATEGORY' && (
              <div className="space-y-1.5">
                <Label htmlFor="parent-type" className="text-xs font-semibold">
                  Parent Staff Type <span className="text-destructive">*</span>
                </Label>
                <Select value={configParentId} onValueChange={setConfigParentId} required>
                  <SelectTrigger id="parent-type" className="h-10 rounded-xl text-sm">
                    <SelectValue placeholder="Select Parent Staff Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {configDialogType === 'DESIGNATION' && (
              <div className="space-y-1.5">
                <Label htmlFor="parent-category" className="text-xs font-semibold">
                  Parent Category <span className="text-destructive">*</span>
                </Label>
                <Select value={configParentId} onValueChange={setConfigParentId} required>
                  <SelectTrigger id="parent-category" className="h-10 rounded-xl text-sm">
                    <SelectValue placeholder="Select Parent Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name} ({cat.parent?.name || "No Type"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                {configDialogMode === "add" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfigDeleteOpen} onOpenChange={setIsConfigDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">Delete Confirmation</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">"{configToDelete?.name}"</strong>? Any staff records associated with this may be affected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex justify-center gap-2 sm:justify-center">
            <Button type="button" variant="outline" onClick={() => setIsConfigDeleteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfigDelete} className="rounded-xl">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Staff Role Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {formForStaffRole.getValues('formType') === "create" ? t("create_role") : t("edit_role")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("enter_role_details_below")}
            </DialogDescription>
          </DialogHeader>
          <Form {...formForStaffRole}>
            <form onSubmit={formForStaffRole.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
              <FormField
                control={formForStaffRole.control}
                name="role_name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">{t("role_name")} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} className="h-10 rounded-xl text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={formForStaffRole.control}
                name="role_type"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">{t("role_type")} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue placeholder="Select a role type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="teaching">Teaching</SelectItem>
                        <SelectItem value="non-teaching">Non-Teaching</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-3 gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="rounded-xl">
                  {t("cancel")}
                </Button>
                <Button type="submit" className="rounded-xl">
                  {formForStaffRole.getValues('formType') === "create" ? t("create_role") : t("save_changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Legacy Staff Role Delete Dialog */}
      <Dialog open={isDialogForDeleteStaffOpen} onOpenChange={(open) => {
        setIsDialogForDeleteStaffOpen(open)
        if (!open) setRoleToDelete(null)
      }}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-lg font-bold">{t("delete_role_confirmation")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {roleToDelete
                ? `Are you sure you want to delete the role "${roleToDelete.role}"? This action cannot be undone.`
                : t("are_you_sure_you_want_to_delete_this_role?_this_action_cannot_be_undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => {
              setIsDialogForDeleteStaffOpen(false)
              setRoleToDelete(null)
            }} className="rounded-xl">
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const id = roleToDelete?.id || formForStaffRole.getValues('role_id')
                if (id) {
                  handleDeleteRole(id)
                }
              }}
              className="rounded-xl"
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
