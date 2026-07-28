import re
import sys

with open("src/components/TimeTable/AutoTimetableGenerator.tsx", "r", encoding="utf-8") as f:
    content = f.read()

funcs = """  const handleOpenEditDialog = (dayValue: string, periodIndex: number, period: any, addingBatch = false, addSpan = 1) => {
    const dayTimetable = editingTimetable.find(tt => {
      const dayConfig = timetableConfig.class_day_config.find(c => c.id === tt.class_day_config_id);
      return dayConfig && dayConfig.day === dayValue;
    });
    if (!dayTimetable) return;

    const dayPeriods = dayTimetable.periods;
    const periodsAtThisSlot = dayPeriods.filter(p => p.period_order === period.period_order);
    const hasContent = period.subjects_division_masters_id !== null || period.is_pt || period.is_free_period;

    let currentSpan = 1;
    let available = 1;

    if (!addingBatch && periodsAtThisSlot.length === 1) {
      let startIndex = dayPeriods.findIndex(p => p === period);
      if (startIndex === -1) startIndex = periodIndex;

      if (hasContent) {
        for (let i = startIndex - 1; i >= 0; i--) {
          const prevP = dayPeriods[i];
          if (prevP.is_break || dayPeriods.filter(p => p.period_order === prevP.period_order).length > 1) break;
          if (
            prevP.subjects_division_masters_id === period.subjects_division_masters_id &&
            prevP.staff_enrollment_id === period.staff_enrollment_id &&
            prevP.lab_id === period.lab_id &&
            prevP.is_pt === period.is_pt &&
            prevP.is_free_period === period.is_free_period &&
            prevP.batch_name === period.batch_name
          ) {
            currentSpan++;
          } else {
            break;
          }
        }
        for (let i = startIndex + 1; i < dayPeriods.length; i++) {
          const nextP = dayPeriods[i];
          if (nextP.is_break || dayPeriods.filter(p => p.period_order === nextP.period_order).length > 1) break;
          if (
            nextP.subjects_division_masters_id === period.subjects_division_masters_id &&
            nextP.staff_enrollment_id === period.staff_enrollment_id &&
            nextP.lab_id === period.lab_id &&
            nextP.is_pt === period.is_pt &&
            nextP.is_free_period === period.is_free_period &&
            nextP.batch_name === period.batch_name
          ) {
            currentSpan++;
          } else {
            break;
          }
        }
      }

      available = 0;
      for (let i = startIndex; i < dayPeriods.length; i++) {
        if (dayPeriods[i].is_break || dayPeriods.filter(p => p.period_order === dayPeriods[i].period_order).length > 1) break;
        available++;
      }

      setEditPeriodIndex(startIndex);
    } else if (addingBatch) {
      setEditPeriodIndex(dayPeriods.findIndex(p => p === period));
      currentSpan = addSpan;
      available = addSpan;
    } else {
      setEditPeriodIndex(dayPeriods.findIndex(p => p === period));
      currentSpan = 1;
      available = 1;
    }

    setEditDayValue(dayValue);
    setEditSpan(currentSpan);
    setOriginalSpan(currentSpan);
    setMaxAvailableSpan(available);
    setIsAddingBatch(addingBatch);
    setEditingPeriod(period);

    setEditSubjectId(addingBatch ? "none" : period.subjects_division_masters_id?.toString() || "none");
    setEditStaffId(addingBatch ? "none" : period.staff_enrollment_id?.toString() || "none");
    setEditLabId(addingBatch ? "none" : period.lab_id?.toString() || "none");
    setEditIsPt(addingBatch ? false : period.is_pt);
    setEditIsFree(addingBatch ? false : period.is_free_period);
    setEditBatchName(addingBatch ? "" : period.batch_name || "");

    setEditDialogOpen(true);
  }

  const handleApplyEdit = async () => {
    let finalSubjectId = editSubjectId === "none" ? null : editSubjectId;

    if (finalSubjectId && finalSubjectId.startsWith("new_")) {
      try {
        const subjectId = Number(finalSubjectId.replace("new_", ""));
        const result = await assignSubjectToDivision({
          academic_session_id: currentAcademicSession!.id,
          division_id: divisionId,
          subjects: [
            {
              subject_id: subjectId,
              code_for_division: allSubjectsData?.find((s: any) => s.id === subjectId)?.code || "",
            },
          ],
        }).unwrap();

        finalSubjectId = result[0].id.toString();

        await getSubjectsForDivision({
          academic_session_id: currentAcademicSession!.id,
          division_id: divisionId,
        });
      } catch (e) {
        toast({ variant: "destructive", title: t("error"), description: t("failed_to_assign_subject") });
        return;
      }
    }

    setEditingTimetable(prev => {
      const newTimetable = [...prev];
      const dayTimetableIndex = newTimetable.findIndex(tt => {
        const dayConfig = timetableConfig.class_day_config.find(c => c.id === tt.class_day_config_id);
        return dayConfig && dayConfig.day === editDayValue;
      });
      if (dayTimetableIndex === -1) return newTimetable;

      const updatedPeriods = [...newTimetable[dayTimetableIndex].periods];
      
      if (editingPeriod) {
        const targetPeriodOrder = editingPeriod.period_order;
        const maxSpan = Math.max(editSpan, originalSpan);
        
        // Count how many batches exist at this time slot
        const batchesAtSlot = updatedPeriods.filter(p => p.period_order === targetPeriodOrder);
        const targetBatchIndex = batchesAtSlot.findIndex(p => p === editingPeriod);

        for (let i = 0; i < maxSpan; i++) {
          const pOrder = targetPeriodOrder + i;
          const periodsForOrder = updatedPeriods.filter(p => p.period_order === pOrder);

          if (isAddingBatch) {
            if (i >= editSpan) continue;
            if (periodsForOrder.length === 0) continue;

            const basePeriod = periodsForOrder[0];
            const newPeriod = { ...basePeriod, id: undefined } as any;
            newPeriod.is_pt = editIsPt;
            newPeriod.is_free_period = editIsFree;
            newPeriod.batch_name = editBatchName.trim() || null;

            if (editIsPt || editIsFree) {
              newPeriod.subjects_division_masters_id = null;
              newPeriod.staff_enrollment_id = null;
              newPeriod.lab_id = null;
            } else {
              newPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
              newPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
              newPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
            }

            let lastIndex = -1;
            for (let j = updatedPeriods.length - 1; j >= 0; j--) {
              if (updatedPeriods[j].period_order === pOrder) {
                lastIndex = j;
                break;
              }
            }

            if (lastIndex !== -1) {
              updatedPeriods.splice(lastIndex + 1, 0, newPeriod);
            }
          } else {
            if (targetBatchIndex < periodsForOrder.length && targetBatchIndex !== -1) {
              const periodToUpdate = periodsForOrder[targetBatchIndex];
              const indexInState = updatedPeriods.indexOf(periodToUpdate);
              
              if (indexInState !== -1) {
                const updatedPeriod = { ...periodToUpdate };
                
                if (i < editSpan) {
                  updatedPeriod.is_pt = editIsPt;
                  updatedPeriod.is_free_period = editIsFree;
                  updatedPeriod.batch_name = editBatchName.trim() || null;
                  
                  if (editIsPt || editIsFree) {
                    updatedPeriod.subjects_division_masters_id = null;
                    updatedPeriod.staff_enrollment_id = null;
                    updatedPeriod.lab_id = null;
                  } else {
                    updatedPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
                    updatedPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
                    updatedPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
                  }
                } else {
                  if (periodsForOrder.length > 1) {
                    updatedPeriods.splice(indexInState, 1);
                    continue;
                  } else {
                    updatedPeriod.subjects_division_masters_id = null;
                    updatedPeriod.staff_enrollment_id = null;
                    updatedPeriod.lab_id = null;
                    updatedPeriod.is_pt = false;
                    updatedPeriod.is_free_period = false;
                    updatedPeriod.batch_name = null;
                  }
                }
                
                updatedPeriods[indexInState] = updatedPeriod;
              }
            } else if (i < editSpan) {
              const newPeriod: any = {
                  period_order: pOrder,
                  start_time: periodsForOrder.length > 0 ? periodsForOrder[0].start_time : editingPeriod.start_time,
                  end_time: periodsForOrder.length > 0 ? periodsForOrder[0].end_time : editingPeriod.end_time,
                  is_break: false,
                  is_pt: editIsPt,
                  is_free_period: editIsFree,
                  subjects_division_masters_id: null,
                  staff_enrollment_id: null,
                  lab_id: null,
                  batch_name: editBatchName.trim() || null
              };
              
              if (!editIsPt && !editIsFree) {
                  newPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
                  newPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
                  newPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
              }
              
              let lastIndex = -1;
              for (let j = updatedPeriods.length - 1; j >= 0; j--) {
                  if (updatedPeriods[j].period_order === pOrder) {
                      lastIndex = j;
                      break;
                  }
              }
              if (lastIndex !== -1) {
                  updatedPeriods.splice(lastIndex + 1, 0, newPeriod);
              } else {
                  updatedPeriods.push(newPeriod);
              }
            }
          }
        }
      }

      newTimetable[dayTimetableIndex] = {
        ...newTimetable[dayTimetableIndex],
        periods: updatedPeriods,
      };

      setEditingMode(true);
      return newTimetable;
    });

    setEditDialogOpen(false);
  }

  const handleDeleteBatch = (dayValue: string, periodIndex: number) => {
    setEditingTimetable(prev => {
      const newTimetable = [...prev];
      const dayTimetableIndex = newTimetable.findIndex(tt => {
        const dayConfig = timetableConfig.class_day_config.find(c => c.id === tt.class_day_config_id);
        return dayConfig && dayConfig.day === dayValue;
      });
      if (dayTimetableIndex === -1) return newTimetable;

      const updatedPeriods = [...newTimetable[dayTimetableIndex].periods];
      
      const periodToRemove = updatedPeriods[periodIndex];
      if (periodToRemove) {
        const periodsWithOrder = updatedPeriods.filter(p => p.period_order === periodToRemove.period_order);
        
        if (periodsWithOrder.length > 1) {
           updatedPeriods.splice(periodIndex, 1);
        } else {
           updatedPeriods[periodIndex] = {
             ...periodToRemove,
             subjects_division_masters_id: null,
             staff_enrollment_id: null,
             lab_id: null,
             is_pt: false,
             is_free_period: false,
             batch_name: null
           };
        }
      }
      
      newTimetable[dayTimetableIndex] = {
        ...newTimetable[dayTimetableIndex],
        periods: updatedPeriods,
      };

      setEditingMode(true);
      return newTimetable;
    });
  }

  const handleRemoveBatch = handleDeleteBatch; // Alias
"""

content = content.replace("  // Render day editor", funcs + "\n  // Render day editor")


render_day_editor_new = """  // Render day editor
  const renderDayEditor = (dayValue: string) => {
    const dayTimetable = getDayTimetable(dayValue)
    if (!dayTimetable) return null

    // Extract unique time slots for this day
    const uniqueTimeSlots = Array.from(new Set(dayTimetable.periods.map(p => `${p.start_time}-${p.end_time}`)))
      .map(key => {
        const p = dayTimetable.periods.find(p => `${p.start_time}-${p.end_time}` === key)!;
        return { start: p.start_time, end: p.end_time, isBreak: p.is_break, order: p.period_order };
      })
      .sort((a, b) => a.start.localeCompare(b.start));

    const slotSpans = new Array(uniqueTimeSlots.length).fill(1);
    const skipSlots = new Set<number>();

    for (let i = 0; i < uniqueTimeSlots.length; i++) {
        if (uniqueTimeSlots[i].isBreak) continue;
        
        const periodsAtI = dayTimetable.periods.filter(p => p.start_time === uniqueTimeSlots[i].start && p.end_time === uniqueTimeSlots[i].end);
        if (periodsAtI.length > 1) continue;
        if (periodsAtI.length === 1 && !periodsAtI[0].subjects_division_masters_id && !periodsAtI[0].is_pt && !periodsAtI[0].is_free_period) continue;
        
        let span = 1;
        for (let j = i + 1; j < uniqueTimeSlots.length; j++) {
            if (uniqueTimeSlots[j].isBreak) break;
            const periodsAtJ = dayTimetable.periods.filter(p => p.start_time === uniqueTimeSlots[j].start && p.end_time === uniqueTimeSlots[j].end);
            
            if (periodsAtI.length === 1 && periodsAtJ.length === 1) {
                const p1 = periodsAtI[0];
                const p2 = periodsAtJ[0];
                
                if (p1.subjects_division_masters_id === p2.subjects_division_masters_id &&
                    p1.staff_enrollment_id === p2.staff_enrollment_id &&
                    p1.lab_id === p2.lab_id &&
                    p1.is_pt === p2.is_pt &&
                    p1.is_free_period === p2.is_free_period &&
                    p1.batch_name === p2.batch_name) {
                    span++;
                    skipSlots.add(j);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        slotSpans[i] = span;
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => handleSaveDay(dayTimetable)} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save")} {days.find((d) => d.value === dayValue)?.label}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-medium text-center w-16">{t("period")}</th>
                <th className="border p-2 bg-muted font-medium text-center w-32">{t("time")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("type")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("subject")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("teacher")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("lab")}</th>
                <th className="border p-2 bg-muted font-medium text-center w-16">Edit</th>
              </tr>
            </thead>
            <tbody>
              {uniqueTimeSlots.map((slot, slotIndex) => {
                if (skipSlots.has(slotIndex)) return null;
                
                const periodsAtSlot = dayTimetable.periods.filter(p => p.start_time === slot.start && p.end_time === slot.end);
                
                if (slot.isBreak) {
                    return (
                        <tr key={slotIndex} className="bg-orange-50 dark:bg-orange-950/20">
                            <td className="border p-2 text-center" colSpan={7}>
                                <div className="flex flex-col items-center justify-center py-2">
                                    <Coffee className="h-5 w-5 mb-1 text-orange-500" />
                                    <span className="font-medium text-orange-700 dark:text-orange-400">
                                        {formatTime(slot.start)} - {formatTime(slot.end)}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    );
                }

                const rowSpan = slotSpans[slotIndex];

                return (
                    <tr key={slotIndex}>
                        <td className="border p-2 text-center align-middle font-medium" rowSpan={rowSpan}>
                            {periodsAtSlot[0]?.period_order}
                            {rowSpan > 1 && ` - ${periodsAtSlot[0]?.period_order + rowSpan - 1}`}
                        </td>
                        <td className="border p-2 text-center align-middle whitespace-nowrap" rowSpan={rowSpan}>
                            {formatTime(slot.start)} - {formatTime(uniqueTimeSlots[slotIndex + rowSpan - 1].end)}
                        </td>
                        <td className="border p-0 align-top" colSpan={5} rowSpan={rowSpan}>
                            <div className={`h-full min-h-[60px] flex flex-col ${periodsAtSlot.length > 1 ? "gap-2 p-2 bg-slate-50 dark:bg-slate-900" : ""}`}>
                                {periodsAtSlot.map((period, batchIndex) => {
                                    const periodIndex = dayTimetable.periods.findIndex(p => p === period);
                                    
                                    return (
                                        <div key={batchIndex} className={`flex-1 flex w-full relative group ${periodsAtSlot.length > 1 ? "bg-white dark:bg-slate-800 rounded-md border shadow-sm p-1" : ""}`}>
                                            <div className="flex-1 grid grid-cols-[1fr_1fr_1fr_1fr_40px] items-stretch min-h-[40px]">
                                                {/* Type */}
                                                <div className={`border-r p-2 flex items-center justify-center ${periodsAtSlot.length > 1 ? "border-r-0" : ""}`}>
                                                    <div className="flex flex-col items-center gap-1">
                                                        {getPeriodTypeBadge(period)}
                                                        {period.batch_name && (
                                                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                Batch {period.batch_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Subject */}
                                                <div className={`border-r p-2 flex items-center justify-center ${periodsAtSlot.length > 1 ? "border-r-0" : ""}`}>
                                                    {period.is_pt ? (
                                                        <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                                                            <Activity className="h-4 w-4" /> {t("physical_training")}
                                                        </span>
                                                    ) : period.is_free_period ? (
                                                        <span className="text-sm font-medium text-gray-500">Free Period</span>
                                                    ) : period.subjects_division_masters_id ? (
                                                        <span className="text-sm font-medium">
                                                            {subjects.find(s => s.id === period.subjects_division_masters_id)?.subject?.name || t("unknown_subject")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">Not assigned</span>
                                                    )}
                                                </div>

                                                {/* Teacher */}
                                                <div className={`border-r p-2 flex items-center justify-center ${periodsAtSlot.length > 1 ? "border-r-0" : ""}`}>
                                                    {period.staff_enrollment_id ? (
                                                        <span className="text-sm">
                                                            {staff.find(s => s.staff_enrollment_id === period.staff_enrollment_id)?.first_name} {staff.find(s => s.staff_enrollment_id === period.staff_enrollment_id)?.last_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </div>

                                                {/* Lab */}
                                                <div className={`border-r p-2 flex items-center justify-center ${periodsAtSlot.length > 1 ? "border-r-0" : ""}`}>
                                                    {period.lab_id ? (
                                                        <span className="text-sm">{t("lab_assigned")}</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                                
                                                {/* Edit Actions */}
                                                <div className="p-2 flex flex-col items-center justify-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleOpenEditDialog(dayValue, periodIndex, period)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    {periodsAtSlot.length > 1 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteBatch(dayValue, periodIndex)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                <div className={`flex justify-center ${periodsAtSlot.length > 1 ? "mt-1" : "p-1 bg-white/50 border-t"}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 w-full"
                                        onClick={() => handleOpenEditDialog(dayValue, dayTimetable.periods.findIndex(p => p === periodsAtSlot[0]), periodsAtSlot[0], true, rowSpan)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add Batch
                                    </Button>
                                </div>
                            </div>
                        </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }"""

content = re.sub(r"  // Render day editor\n  const renderDayEditor = \(dayValue: string\) => \{.*?    \)\n  \}", render_day_editor_new, content, flags=re.DOTALL)


dialog_code = """
  // Extract unique batch names for autocomplete
  const existingBatchNames = useMemo(() => {
    const names = new Set<string>();
    editingTimetable.forEach(day => {
      day.periods.forEach(p => {
        if (p.batch_name) names.add(p.batch_name);
      });
    });
    return Array.from(names).sort();
  }, [editingTimetable]);
"""

content = content.replace("  if (loading) {", dialog_code + "\n  if (loading) {")


dialog_html = """
        {/* Validation Dialog */}
"""
dialog_html_new = """
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {isAddingBatch ? "Add Batch to Period" : t("edit_period")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!isAddingBatch && maxAvailableSpan > 1 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="span" className="text-right">Span (Periods)</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Select
                    value={editSpan.toString()}
                    onValueChange={(val) => setEditSpan(Number(val))}
                  >
                    <SelectTrigger id="span">
                      <SelectValue placeholder="Select span" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxAvailableSpan }).map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} Period{i > 0 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <div className="col-span-3 flex gap-2">
                <Button
                  type="button"
                  variant={!editIsPt && !editIsFree ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditIsPt(false)
                    setEditIsFree(false)
                  }}
                  className="flex-1"
                >
                  Lecture/Lab
                </Button>
                <Button
                  type="button"
                  variant={editIsPt ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditIsPt(true)
                    setEditIsFree(false)
                  }}
                  className="flex-1"
                >
                  <Activity className="h-4 w-4 mr-1" /> PT
                </Button>
                <Button
                  type="button"
                  variant={editIsFree ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditIsFree(true)
                    setEditIsPt(false)
                  }}
                  className="flex-1"
                >
                  Free
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch" className="text-right">Batch (Optional)</Label>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    id="batch"
                    value={editBatchName}
                    onChange={(e) => setEditBatchName(e.target.value)}
                    placeholder="e.g. A, B, Boys, Girls"
                    maxLength={10}
                  />
                  {existingBatchNames.length > 0 && editBatchName === "" && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 flex gap-1 p-1 overflow-x-auto">
                      {existingBatchNames.map(name => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-white transition-colors"
                          onClick={() => setEditBatchName(name)}
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!editIsPt && !editIsFree && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">{t("subject")}</Label>
                  <div className="col-span-3">
                    <Select value={editSubjectId} onValueChange={(val) => {
                      setEditSubjectId(val)
                      setEditStaffId("none")
                    }}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder={t("select_subject")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("no_subject")}</SelectItem>
                        {getSubjectOptions().map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label} {opt.code ? `(${opt.code})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teacher" className="text-right">{t("teacher")}</Label>
                  <div className="col-span-3">
                    <Select
                      value={editStaffId}
                      onValueChange={setEditStaffId}
                      disabled={editSubjectId === "none"}
                    >
                      <SelectTrigger id="teacher">
                        <SelectValue placeholder={t("select_teacher")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("no_teacher")}</SelectItem>
                        {editSubjectId !== "none" && getStaffOptionsForSubject(Number(editSubjectId)).map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lab" className="text-right">{t("lab")}</Label>
                  <div className="col-span-3">
                    <Select
                      value={editLabId}
                      onValueChange={setEditLabId}
                      disabled={editSubjectId === "none"}
                    >
                      <SelectTrigger id="lab">
                        <SelectValue placeholder={t("select_lab")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("no_lab")}</SelectItem>
                        {/* Render lab options if available, currently just mock or empty as it was in original */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyEdit}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        {/* Validation Dialog */}
"""

content = content.replace(dialog_html, dialog_html_new)

with open("src/components/TimeTable/AutoTimetableGenerator.tsx", "w", encoding="utf-8") as f:
    f.write(content)
