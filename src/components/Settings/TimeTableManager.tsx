"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Copy, Download, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Label } from "@radix-ui/react-label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { DialogFooter, DialogHeader } from "../ui/dialog";
import { selectAcademicClasses } from "@/redux/slices/academicSlice";
import { useAppSelector } from "@/redux/hooks/useAppSelector";
import type { AcademicClasses } from "@/types/academic";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import { useGetAcademicClassesQuery } from "@/services/AcademicService";
import { SidebarTrigger } from "../ui/sidebar";
import { useTranslation } from "@/redux/hooks/useTranslation";

export default function TimeTableManager() {
  const [selecteddivision, setSelecteddivision] = useState("");
  const [selectedShift, setSelectedShift] = useState("morning");
  const {t} = useTranslation();
  const [periods, setPeriods] = useState([
    {
      id: 1,
      name: "Period 1",
      startTime: "00:00",
      endTime: "00:00",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      day: "",
    },
]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [notifyGroup, setNotifyGroup] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const user = useAppSelector(selectCurrentUser);
  const { data: AcademicClasses } = useGetAcademicClassesQuery(user!.school_id);

  const availableDivisions = useMemo<AcademicClasses | null>(() => {
    if (AcademicClasses && selectedClass) {
      return AcademicClasses.filter(
        (cls: any) => cls.class.toString() === selectedClass
      )[0];
    } else {
      return null;
    }
  }, [AcademicClasses, selectedClass]);


  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);

      // Show success message
      toast({
        title: "Holiday notice sent successfully",
        description: "All selected recipients have been notified.",
      });

      // Reset and close dialog after 1.5 seconds
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 1500);
    }, 2000);
  };

  const subjects = [
    "Mathematics",
    "Science",
    "English",
  ];

  const addPeriod = () => {
    const lastPeriod = periods[periods.length - 1];
    const newPeriodId = lastPeriod.id + 1;
    const startTime = lastPeriod.endTime;

    // Calculate end time (45 minutes later)
    const [hours, minutes] = lastPeriod.endTime.split(":").map(Number);
    let newHours = hours;
    let newMinutes = minutes + 45;

    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
    }

    const endTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;

    setPeriods([
      ...periods,
      {
        id: newPeriodId,
        name: `Period ${newPeriodId}`,
        startTime,
        endTime,
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        day: "",
      },
    ]);
  };

  const removePeriod = (id: number) => {
    setPeriods(periods.filter((period) => period.id !== id));
  };

  const updatePeriod = (id: number, field: any, value: any) => {
    setPeriods(
      periods.map((period) =>
        period.id === id ? { ...period, [field]: value } : period
      )
    );
  };

  const updateSubject = (id: number, field: any, value: any) => {
    setPeriods(
      periods.map((period) =>
        period.id === id ? { ...period, day: value } : period
      )
    );
  };

  const getShiftTimes = () => {
    return selectedShift === "morning"
      ? { start: "08:00", end: "13:30" }
      : { start: "12:30", end: "18:00" };
  };

  const resetTimetable = () => {
    const defaultPeriods =
      selectedShift === "morning"
        ? [
            {
              id: 1,
              name: "Period 1",
              startTime: "08:00",
              endTime: "08:45",
              monday: "",
              tuesday: "",
              wednesday: "",
              thursday: "",
              friday: "",
              saturday: "",
              day: "",
            },
          ]
        : [
            {
              id: 1,
              name: "Period 1",
              startTime: "12:30",
              endTime: "13:15",
              monday: "",
              tuesday: "",
              wednesday: "",
              thursday: "",
              friday: "",
              saturday: "",
              day: "",
            },
          ];

    setPeriods(defaultPeriods);
  };

  const handleShiftChange = (value: any) => {
    setSelectedShift(value);
    resetTimetable();
  };

  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selecteddivision !== null && selectedClass !== null) {
      sidebarTriggerRef.current?.click();
      return;
    }
  }, [selecteddivision]);

  return (
    <div className="flex flex-col max-w-[1120px]">
      <header className="sticky top-0 z-10 bg-white border-b border-orange-200">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold text-orange-600">
              {t("school_time_table_manager")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Download className="w-4 h-4" />
              {t("export")}
            </Button>
            <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
              <Save className="w-4 h-4" />
              {t("save_time_table")}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 p-4 overflow-auto">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-orange-50">
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                {t("create_time_table")}
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                {t("manage_time_tables")}
              </TabsTrigger>
              <TabsTrigger
                value="holidays"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                {t("holiday")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">{t("class")}</Label>
                      <Select
                        value={selectedClass}
                        onValueChange={setSelectedClass}
                      >
                        <SelectTrigger id="class">
                          <SelectValue placeholder={t("select_class")} />
                        </SelectTrigger>
                        <SelectContent>
                          {AcademicClasses?.map((cls: any, index: any) =>
                            cls.divisions.length > 0 ? (
                              <SelectItem
                                key={index}
                                value={cls.class.toString()}
                              >
                                Class {cls.class}
                              </SelectItem>
                            ) : null
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="division">{t("division")}</Label>
                      <Select
                        value={selecteddivision}
                        onValueChange={setSelecteddivision}
                      >
                        <SelectTrigger id="division">
                          <SelectValue placeholder={t("select_division")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDivisions &&
                            availableDivisions.divisions.map(
                              (division, index) => (
                                <SelectItem
                                  key={index}
                                  value={division.division}
                                >
                                  {`${division.division} ${
                                    division.aliases
                                      ? "-" + division.aliases
                                      : ""
                                  }`}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shift">{t("shift")}</Label>
                      <Select
                        value={selectedShift}
                        onValueChange={handleShiftChange}
                      >
                        <SelectTrigger id="shift">
                          <SelectValue placeholder={t("select_shift")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">{t("morning_shift")}</SelectItem>
                          <SelectItem value="afternoon">
                            {t("afternoon_shift")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={addPeriod}
                        className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Plus className="w-4 h-4" />
                        {t("add_period")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={resetTimetable}
                      >
                        {t("reset")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedClass && selecteddivision && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-orange-700">
                          {selectedClass} - {t("division")} {selecteddivision} (
                          {selectedShift === "morning"
                            ? t("morning_shift")
                            : t("afternoon_shift")}
                          )
                        </h2>
                        <p className="text-sm text-orange-600">
                          {t("school_hours")}: {getShiftTimes().start} -{" "}
                          {getShiftTimes().end}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <SidebarTrigger ref={sidebarTriggerRef} />
                          <Switch id="saturday" />
                          <Label htmlFor="saturday">{t("include_saturday")}</Label>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[300px] ">
                      <Table className="border">
                        <TableHeader className="bg-orange-50">
                          <TableRow>
                            <TableHead className="w-[120px] font-bold">
                              {t("period")}
                            </TableHead>
                            <TableHead className="w-[120px] font-bold">
                              {t("time")}
                            </TableHead>
                            <TableHead className="font-bold">{t("monday")}</TableHead>
                            <TableHead className="font-bold">{t("tuesday")}</TableHead>
                            <TableHead className="font-bold">
                              {t("wednesday")}
                            </TableHead>
                            <TableHead className="font-bold">
                              {t("thursday")}
                            </TableHead>
                            <TableHead className="font-bold">{t("friday")}</TableHead>
                            <TableHead className="font-bold">
                              {t("saturday")}
                            </TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {periods.map((period) => (
                            <TableRow
                              key={period.id}
                              className={
                                period.name.includes("Break")
                                  ? "bg-orange-50"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Input
                                  value={period.name}
                                  onChange={(e) =>
                                    updatePeriod(
                                      period.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="h-8"
                                  disabled={period.name.includes("Break")}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="time"
                                    value={period.startTime}
                                    onChange={(e) =>
                                      updatePeriod(
                                        period.id,
                                        "startTime",
                                        e.target.value
                                      )
                                    }
                                    className="h-8"
                                  />
                                  <span>-</span>
                                  <Input
                                    type="time"
                                    value={period.endTime}
                                    onChange={(e) =>
                                      updatePeriod(
                                        period.id,
                                        "endTime",
                                        e.target.value
                                      )
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </TableCell>
                              {[
                                "monday",
                                "tuesday",
                                "wednesday",
                                "thursday",
                                "friday",
                                "saturday",
                              ].map((day) => (
                                <TableCell key={day}>
                                  {period.name.includes("Break") ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-100 text-orange-800 border-orange-200"
                                    >
                                      {t("break")}
                                    </Badge>
                                  ) : (
                                    <Select
                                      value={period.day}
                                      onValueChange={(value) =>
                                        updateSubject(period.id, day, value)
                                      }
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder={t("select_subject")} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          None
                                        </SelectItem>
                                        {subjects.map((subject) => (
                                          <SelectItem
                                            key={subject}
                                            value={subject}
                                          >
                                            {subject}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePeriod(period.id)}
                                  disabled={period.name.includes("Break")}
                                  className="h-8 w-8 text-orange-700 hover:bg-orange-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manage">
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="filter-class">{t("filter_by_class")}</Label>
                      <Select>
                        <SelectTrigger id="filter-class">
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("all_classes")}</SelectItem>
                          {AcademicClasses?.map((cls: any, index: any) => (
                            <SelectItem
                              key={index}
                              value={cls.class.toString()}
                            >
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-shift">{t("filter_by_shift")}</Label>
                      <Select defaultValue="all">
                        <SelectTrigger id="filter-shift">
                          <SelectValue placeholder="All Shifts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("all_shifts")}</SelectItem>
                          <SelectItem value="morning">{t("morning_shift")}</SelectItem>
                          <SelectItem value="afternoon">
                            {t("afternoon_shift")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search">{t("search")}</Label>
                      <Input id="search" placeholder={t("search_time_tables...")} />
                    </div>
                  </div>

                  <div className="mt-6"></div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="holidays">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-orange-700">
                        {t("school_holidays")}
                      </h2>
                      <p className="text-sm text-orange-600">
                      {t("manage_and_announce_school_holidays")}
                      </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                          {t("set_holiday")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-orange-200">
                        {success ? (
                          <div className="py-10 flex flex-col items-center justify-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-center">
                              Holiday Notice Sent Successfully!
                            </h3>
                            <p className="text-sm text-gray-500 text-center mt-2">
                              All selected recipients have been notified.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="px-6 py-5 border-b border-orange-100">
                              <h2 className="text-2xl font-semibold text-orange-700">
                                {t("announce_school_holiday")}
                              </h2>
                            </div>

                            <form onSubmit={handleSendNotice} className="p-6">
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="holiday-name"
                                    className="text-base font-medium text-orange-700"
                                  >
                                    {t("holiday_name")}
                                  </Label>
                                  <Input
                                    id="holiday-name"
                                    placeholder="e.g. Diwali Break, Summer Vacation"
                                    required
                                    className="border-orange-200 focus:border-orange-400 focus-visible:ring-orange-400 h-12 rounded-md"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-base font-medium text-orange-700">
                                      {t("start_date")}
                                    </Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal border-orange-200 h-12 rounded-md",
                                            !date && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
                                          {date ? (
                                            format(date, "PPP")
                                          ) : (
                                            <span>{t("select_date")}</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        {/* <Calendar mode="single" selected={date} onSelect={setDate} initialFocus /> */}
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-base font-medium text-orange-700">
                                      {t("end_date")}
                                    </Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal border-orange-200 h-12 rounded-md",
                                            !endDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
                                          {endDate ? (
                                            format(endDate, "PPP")
                                          ) : (
                                            <span>{t("select_date")}</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        {/* <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /> */}
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label
                                    htmlFor="holiday-description"
                                    className="text-base font-medium text-orange-700"
                                  >
                                    {t("holiday_description")}
                                  </Label>
                                  <Textarea
                                    id="holiday-description"
                                    placeholder={t("provide_details_about_the_holiday...")}
                                    className="min-h-[120px] border-orange-200 focus:border-orange-400 focus-visible:ring-orange-400 rounded-md resize-none"
                                    required
                                  />
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-base font-medium text-orange-700">
                                    {t("send_notification_to")}
                                  </Label>
                                  <RadioGroup
                                    defaultValue="all"
                                    onValueChange={setNotifyGroup}
                                    className="flex flex-col space-y-3"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <RadioGroupItem
                                        value="all"
                                        id="all"
                                        className="border-orange-300 text-orange-600"
                                      />
                                      <Label
                                        htmlFor="all"
                                        className="text-base"
                                      >
                                        {t("all_staff_&_students")}
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <RadioGroupItem
                                        value="staff"
                                        id="staff"
                                        className="border-orange-300 text-orange-600"
                                      />
                                      <Label
                                        htmlFor="staff"
                                        className="text-base"
                                      >
                                        {t("staff_only")}
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <RadioGroupItem
                                        value="students"
                                        id="students"
                                        className="border-orange-300 text-orange-600"
                                      />
                                      <Label
                                        htmlFor="students"
                                        className="text-base"
                                      >
                                        {t("students_only")}
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>

                                <Button
                                  type="submit"
                                  className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base font-medium mt-4"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting
                                    ? "Sending..."
                                    : t("send_holiday_notice")}
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}


