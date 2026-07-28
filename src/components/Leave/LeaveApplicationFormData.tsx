import type React from "react"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { DateTime } from "luxon"
import type { LeaveApplication } from "@/types/leave"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectLeavePolicyForUser } from "@/redux/slices/leaveSlice"
import {
  useApplyLeaveForStaffMutation,
    useLazyGetAllLeavePoliciesForUserQuery,
    useUpdateLeaveForStaffMutation,
} from "@/services/LeaveService"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"

import { useTranslation } from "@/redux/hooks/useTranslation"

const leaveApplicationSchema = z
    .object({
        leave_type: z.string().nonempty("Leave type is required"),
        from_date: z.string().nonempty("From date is required"),
        to_date: z.string().nonempty("To date is required"),
        reason: z.string().min(1, "Reason is required"),
        is_half_day: z.boolean(),
        half_day_type: z.enum(["first_half", "second_half", "none"]),
        is_hourly_leave: z.boolean(),
        total_hours: z.number().nullable(),
    })
    .refine((data) => {
        const startDate = DateTime.fromISO(data.from_date);
        const endDate = DateTime.fromISO(data.to_date);
        const today = DateTime.now().startOf("day");
        const twoMonthsFromNow = today.plus({ months: 2 });

        return startDate >= today;
    }, {
        message: "Start date cannot be in the past",
        path: ["from_date"],
    })
    .refine((data) => {
        const startDate = DateTime.fromISO(data.from_date);
        const endDate = DateTime.fromISO(data.to_date);

        return startDate <= endDate;
    }, {
        message: "End date must be after start date",
        path: ["to_date"],
    })
    .refine((data) => {
        const endDate = DateTime.fromISO(data.to_date);
        const today = DateTime.now().startOf("day");
        const twoMonthsFromNow = today.plus({ months: 2 });

        return endDate <= twoMonthsFromNow;
    }, {
        message: "End date cannot be more than 2 months in the future",
        path: ["to_date"],
    })
    .refine((data) => {
        const startDate = DateTime.fromISO(data.from_date);
        const endDate = DateTime.fromISO(data.to_date);

        return !data.is_hourly_leave || startDate.equals(endDate);
    }, {
        message: "Hourly leave must be for a single day",
        path: ["to_date"],
    })
    .refine((data) => {
        return !(data.is_hourly_leave && (data.is_half_day || data.half_day_type !== "none"));
    }, {
        message: "Hourly leave cannot be combined with half-day leave",
        path: ["is_hourly_leave"],
    })
    .refine((data) => {
        return !data.is_hourly_leave || (data.total_hours && data.total_hours >= 1 && data.total_hours <= 4);
    }, {
        message: "Hourly leave must be between 1 and 4 hours",
        path: ["total_hours"],
    })
    .refine((data) => {
        const startDate = DateTime.fromISO(data.from_date);
        const endDate = DateTime.fromISO(data.to_date);

        return !data.is_half_day || startDate.equals(endDate);
    }, {
        message: "Half-day leave must be for a single day",
        path: ["to_date"],
    })
    .refine((data) => {
        return !data.is_half_day || data.half_day_type !== "none";
    }, {
        message: "Please select half-day type",
        path: ["half_day_type"],
    })
    .refine((data) => {
        return data.is_hourly_leave || data.total_hours === null;
    }, {
        message: "Total hours should only be set for hourly leave",
        path: ["total_hours"],
    });

type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>

interface LeaveApplicationFormProps {
    initialData?: LeaveApplication | null
    onSucessesfullApplication: (leave: LeaveApplication) => void
    type: "edit" | "create"
    onCancel: () => void 
}

export const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ initialData, onSucessesfullApplication, type , onCancel }) => {
    const user = useAppSelector(selectCurrentUser)
    const leavePolicyForUser = useAppSelector(selectLeavePolicyForUser)
      const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool);
    const [getAllLeavePoliciesForUser] = useLazyGetAllLeavePoliciesForUserQuery()
    const [applyLeaveForTeacher] = useApplyLeaveForStaffMutation()
    const [updateLeaveForTeacher] = useUpdateLeaveForStaffMutation()
    const {t} = useTranslation()

    const form = useForm<LeaveApplicationFormData>({
        resolver: zodResolver(leaveApplicationSchema),
        defaultValues: {
            leave_type: "",
            from_date: "",
            to_date: "",
            reason: "",
            is_half_day: false,
            half_day_type: "none",
            is_hourly_leave: false,
            total_hours: null,
        },
    })

    const handleSubmit: SubmitHandler<LeaveApplicationFormData> = async (data) => {
        try {
            if (type === "create" && user?.staff_id && CurrentAcademicSessionForSchool?.id) {
                const response = await applyLeaveForTeacher({
                    staff_id: user.staff_id,
                    academic_session_id : CurrentAcademicSessionForSchool.id,
                    school_id: CurrentAcademicSessionForSchool.school_id,
                    leave_type_id: Number(data.leave_type),
                    from_date: data.from_date,
                    to_date: data.to_date,
                    reason: data.reason,
                    is_half_day: data.is_half_day,
                    half_day_type: data.half_day_type,
                    is_hourly_leave: data.is_hourly_leave,
                    total_hour: data.total_hours != null ? String(data.total_hours) : null,
                }) // Fix this

                if (response.error) {
                    toast({
                        variant: "destructive",
                        title: 'Error submitting leave application',
                    })
                }

                if (response.data) {
                    console.log("response.data", response.data)
                    onSucessesfullApplication(response.data)
                    toast({
                        variant: "default",
                        title: "Successfully added leave application!",
                        duration: 3000
                    })
                }

            } else if (type === "edit" && initialData) {
                let response : any = await updateLeaveForTeacher({
                    payload: {
                        leave_type_id: Number(data.leave_type),
                        from_date: data.from_date,
                        to_date: data.to_date,
                        reason: data.reason,
                        is_half_day: data.is_half_day,
                        half_day_type: data.half_day_type,
                        is_hourly_leave: data.is_hourly_leave,
                        total_hour: data.total_hours != null ? String(data.total_hours) : null,
                    },
                    application_id: initialData.uuid
                })  

                if(response.data){
                    onSucessesfullApplication(response.data)
                    toast({
                        variant: "default",
                        title: "Successfully updated leave application!",
                    })
                }else{
                    toast({
                        variant: "destructive",
                        title: response.error.data.message,
                    })   
                }

            }
        } catch (error) {
            console.log("response.data", error)
            toast({
                variant: "destructive",
                title: "Error submitting leave application",
                description: "Please try again later.",
            })
        }
    }

    useEffect(() => {
        if (initialData) {
            form.reset({
                leave_type: initialData.leave_type_id.toString(),
                from_date: initialData.from_date,
                to_date: initialData.to_date,
                reason: initialData.reason,
                is_half_day: Boolean(initialData.is_half_day),
                half_day_type: initialData.half_day_type,
                is_hourly_leave: Boolean(initialData.is_hourly_leave),
                total_hours: initialData.total_hour ? Number(initialData.total_hour) : null,
            })
        }
    }, [initialData, form])

    useEffect(() => {
        if (!leavePolicyForUser && user?.staff_id && CurrentAcademicSessionForSchool?.id) {
            getAllLeavePoliciesForUser({
              academic_session_id : CurrentAcademicSessionForSchool.id
            })
        }
    }, [leavePolicyForUser, getAllLeavePoliciesForUser, user?.staff_id, CurrentAcademicSessionForSchool])

    useEffect(()=>{
      console.log("Chevk this " , form.formState.errors)
    },[form.formState.errors])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="leave_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("leave_type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("select_leave_type")}/>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {leavePolicyForUser &&
                                        leavePolicyForUser.map((leavePolicy) => (
                                            <SelectItem key={leavePolicy.leave_type_id} value={leavePolicy.leave_type.id.toString()}>
                                                {leavePolicy.leave_type.leave_type_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="from_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("from_date")}</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="to_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("to_date")}</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("reason")}</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_half_day"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked)
                                        if (checked) {
                                            form.setValue("is_hourly_leave", false)
                                            form.setValue("total_hours", null)
                                        }
                                    }}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{t("half_day")}</FormLabel>
                                <FormDescription>{t("check_if_this_is_a_half-day_leave")}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {form.watch("is_half_day") && (
                    <FormField
                        control={form.control}
                        name="half_day_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("half_day_type")}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("select_half_day_type")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="first_half">{t("first_half")}</SelectItem>
                                        <SelectItem value="second_half">{t("second_half")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="is_hourly_leave"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked)
                                        if (checked) {
                                            form.setValue("is_half_day", false)
                                            form.setValue("half_day_type", "none")
                                        } else {
                                            form.setValue("total_hours", null)
                                        }
                                    }}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{t("hourly_leave")}</FormLabel>
                                <FormDescription>{t("check_if_this_is_an_hourly_leave")}</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {form.watch("is_hourly_leave") && (
                    <FormField
                        control={form.control}
                        name="total_hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("total_hours")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                field.onChange(Number(e.target.value));
                                            } else {
                                                field.onChange(null); // Handle clearing input
                                            }
                                        }}
                                        min={1}
                                        max={4}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("cancel")}
                    </Button>
                    <Button type="submit">{t("submit")}</Button>
                </div>
            </form>
        </Form>
    )
}

