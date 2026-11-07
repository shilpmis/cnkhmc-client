import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, Search, ShieldCheck, ShieldOff, UserX } from "lucide-react";
import {
  type DeadStockAccessStaff,
  useGetDeadStockAccessListQuery,
  useGetMyDeadStockAccessQuery,
  useUpdateDeadStockAccessMutation,
} from "@/services/DeadStockService";

type Filter = "all" | "with" | "without";

/**
 * Admin screen: which staff members can see which dead stock departments. A staff member sees only the
 * departments ticked here (or every department with "All departments"); with nothing given, they see
 * no dead stock at all. Admin, principal, super admin and developer always see everything.
 */
export default function DeadStockAccess() {
  const { toast } = useToast();
  const { data: me, isLoading: meLoading } = useGetMyDeadStockAccessQuery();
  const { data, isLoading, isFetching } = useGetDeadStockAccessListQuery(undefined, { skip: !me?.can_manage_access });
  const [updateAccess, { isLoading: saving }] = useUpdateDeadStockAccessMutation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<DeadStockAccessStaff | null>(null);
  const [allDepartments, setAllDepartments] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const departments = data?.departments || [];
  const departmentName = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.staff || []).filter((s) => {
      const hasAccess = s.all_departments || s.department_ids.length > 0;
      if (filter === "with" && !hasAccess) return false;
      if (filter === "without" && hasAccess) return false;
      if (!term) return true;
      return [s.name, s.employee_code, s.designation, s.department].some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [data, search, filter]);

  const withAccessCount = (data?.staff || []).filter((s) => s.all_departments || s.department_ids.length > 0).length;

  const openEdit = (s: DeadStockAccessStaff) => {
    setEditing(s);
    setAllDepartments(s.all_departments);
    setSelectedIds(s.department_ids);
  };

  const toggleDepartment = (id: number, checked: boolean) =>
    setSelectedIds((ids) => (checked ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));

  const save = async () => {
    if (!editing) return;
    try {
      await updateAccess({
        staff_id: editing.id,
        all_departments: allDepartments,
        department_ids: allDepartments ? [] : selectedIds,
      }).unwrap();
      toast({ title: "Access saved", description: `${editing.name}: ${describe(allDepartments, allDepartments ? [] : selectedIds)}` });
      setEditing(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could not save access", description: error?.data?.message || "Saving failed" });
    }
  };

  const describe = (all: boolean, ids: number[]) =>
    all ? "All departments" : ids.length === 0 ? "No access" : ids.map((id) => departmentName.get(id) || `Dept #${id}`).join(", ");

  if (meLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!me?.can_manage_access) {
    return (
      <div className="p-6">
        <Alert>
          <ShieldOff className="h-4 w-4" />
          <AlertDescription>Only administrators can manage dead stock access.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          <KeyRound className="h-7 w-7 text-primary" /> Dead Stock Access
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose which dead stock departments each staff member can see and work with. Staff with no access see no dead stock.
          Admins and the principal always see everything.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base">Staff</CardTitle>
            <CardDescription>
              {withAccessCount} of {data?.staff.length ?? 0} staff have dead stock access.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-56 pl-8" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Filter staff"
            >
              <option value="all">All staff</option>
              <option value="with">With access</option>
              <option value="without">Without access</option>
            </select>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff member</TableHead>
                    <TableHead>Dead stock access</TableHead>
                    <TableHead className="w-32 text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{s.employee_code}</span>
                          {s.designation && <span>· {s.designation}</span>}
                          {!s.has_login && (
                            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700">
                              <UserX className="h-3 w-3" /> no login
                            </Badge>
                          )}
                          {!s.is_active && <Badge variant="outline">inactive</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.all_departments ? (
                          <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <ShieldCheck className="h-3 w-3" /> All departments
                          </Badge>
                        ) : s.department_ids.length ? (
                          <div className="flex flex-wrap gap-1">
                            {s.department_ids.map((id) => (
                              <Badge key={id} variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800">
                                {departmentName.get(id) || `Dept #${id}`}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No access</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                          Edit access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        No staff match this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dead stock access: {editing?.name}</DialogTitle>
            <DialogDescription>
              They will see only the register entries of the departments ticked here.
              {editing && !editing.has_login && " This staff member has no login yet, so the access applies once an account is created."}
            </DialogDescription>
          </DialogHeader>

          <label className="flex items-start gap-3 rounded-md border p-3">
            <Switch checked={allDepartments} onCheckedChange={setAllDepartments} />
            <span className="text-sm">
              <span className="font-medium">All departments</span>
              <span className="block text-muted-foreground">
                Sees the whole register and the central store, and can add, import, issue and discard stock.
              </span>
            </span>
          </label>

          <div className={allDepartments ? "pointer-events-none opacity-50" : ""}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Departments</span>
              <span className="text-muted-foreground">{selectedIds.length} selected</span>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
              {departments.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60">
                  <Checkbox
                    checked={selectedIds.includes(d.id)}
                    onCheckedChange={(v) => toggleDepartment(d.id, v === true)}
                    disabled={allDepartments}
                  />
                  <span>{d.name}</span>
                  {!d.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                </label>
              ))}
              {departments.length === 0 && <p className="p-2 text-sm text-muted-foreground">No dead stock departments yet.</p>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              With some departments only, they can return stock to the store and transfer stock between their departments.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
