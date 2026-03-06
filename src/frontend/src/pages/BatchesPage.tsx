import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  Edit2,
  Music,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Batch } from "../backend.d.ts";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllBatches,
  useAllStudents,
  useAssignBatch,
  useCreateBatch,
  useDeleteBatch,
  useStudentsInBatch,
  useUpdateBatch,
} from "../hooks/useQueries";

// Helper: unwrap Motoko optional batchId (may be [] | [bigint] or bigint | undefined)
function unwrapBatchId(raw: unknown): bigint | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw.length > 0 ? (raw[0] as bigint) : null;
  return raw as bigint;
}

const DAYS_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BatchFormData {
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  monthlyFees: string;
}

const emptyForm: BatchFormData = {
  name: "",
  daysOfWeek: [],
  startTime: "09:00",
  endTime: "10:00",
  monthlyFees: "",
};

function BatchFormDialog({
  open,
  onClose,
  batch,
}: {
  open: boolean;
  onClose: () => void;
  batch?: Batch;
}) {
  const [form, setForm] = useState<BatchFormData>(
    batch
      ? {
          name: batch.name,
          daysOfWeek: batch.daysOfWeek.map(Number),
          startTime: batch.startTime,
          endTime: batch.endTime,
          monthlyFees: batch.monthlyFees.toString(),
        }
      : emptyForm,
  );

  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const isPending = createBatch.isPending || updateBatch.isPending;

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Batch name is required");
    if (form.daysOfWeek.length === 0)
      return toast.error("Select at least one day");
    if (!form.startTime || !form.endTime)
      return toast.error("Start and end time required");
    if (!form.monthlyFees) return toast.error("Monthly fees required");

    const daysOfWeek = form.daysOfWeek.map(BigInt);

    try {
      if (batch) {
        await updateBatch.mutateAsync({
          batchId: batch.id,
          name: form.name.trim(),
          daysOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          monthlyFees: BigInt(form.monthlyFees),
        });
        toast.success("Batch updated");
      } else {
        await createBatch.mutateAsync({
          name: form.name.trim(),
          daysOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          monthlyFees: BigInt(form.monthlyFees),
        });
        toast.success("Batch created");
        setForm(emptyForm);
      }
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {batch ? "Edit Batch" : "Create New Batch"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Batch Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Morning Classical"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">Days of Week *</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_LABELS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                    form.daysOfWeek.includes(idx)
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.daysOfWeek.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {form.daysOfWeek.length} day
                {form.daysOfWeek.length !== 1 ? "s" : ""} per week
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Start Time *</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startTime: e.target.value }))
                }
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">End Time *</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endTime: e.target.value }))
                }
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">
              Monthly Fees (₹) *
            </Label>
            <Input
              type="number"
              value={form.monthlyFees}
              onChange={(e) =>
                setForm((p) => ({ ...p, monthlyFees: e.target.value }))
              }
              placeholder="e.g. 1500"
              min="0"
              className="bg-input border-border"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {batch ? "Update" : "Create"} Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Batch Student Assign Modal ───────────────────────────────────────────────

function BatchStudentAssignModal({
  batch,
  onClose,
}: {
  batch: Batch;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allStudents = [], isLoading: studentsLoading } =
    useAllStudents();
  const { data: allBatches = [] } = useAllBatches();
  const assignBatch = useAssignBatch();

  // Only active students
  const activeStudents = useMemo(
    () => allStudents.filter((s) => s.isActive),
    [allStudents],
  );

  // Build a batchId→name map
  const batchNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of allBatches) {
      m.set(b.id.toString(), b.name);
    }
    return m;
  }, [allBatches]);

  // Classify each student relative to this batch
  const studentRows = useMemo(
    () =>
      activeStudents.map((student) => {
        const currentBatchId = unwrapBatchId(student.currentBatchId);
        const isInThisBatch =
          currentBatchId !== null &&
          currentBatchId.toString() === batch.id.toString();
        const isInOtherBatch = currentBatchId !== null && !isInThisBatch;
        const otherBatchName = isInOtherBatch
          ? (batchNameMap.get(currentBatchId!.toString()) ?? "Another Batch")
          : null;
        return { student, isInThisBatch, isInOtherBatch, otherBatchName };
      }),
    [activeStudents, batch.id, batchNameMap],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnassigned = () => {
    const unassignedIds = studentRows
      .filter((r) => !r.isInThisBatch && !r.isInOtherBatch)
      .map((r) => r.student.id.toString());
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of unassignedIds) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return toast.error("No students selected");
    if (!effectiveFrom) return toast.error("Effective from date is required");

    // Only assign students NOT already in this batch
    const toAssign = Array.from(selected).filter((idStr) => {
      const row = studentRows.find((r) => r.student.id.toString() === idStr);
      return row && !row.isInThisBatch;
    });

    if (toAssign.length === 0) {
      return toast.error("All selected students are already in this batch");
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const idStr of toAssign) {
      try {
        await assignBatch.mutateAsync({
          studentId: BigInt(idStr),
          batchId: batch.id,
          startDate: effectiveFrom,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} student${successCount !== 1 ? "s" : ""} assigned to ${batch.name}`,
      );
    }
    if (failCount > 0) {
      toast.error(
        `${failCount} assignment${failCount !== 1 ? "s" : ""} failed`,
      );
    }

    onClose();
  };

  const unassignedCount = studentRows.filter(
    (r) => !r.isInThisBatch && !r.isInOtherBatch,
  ).length;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-lg"
        data-ocid="batch.assign.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Assign Students — {batch.name}
          </DialogTitle>
        </DialogHeader>

        {/* Effective From Date */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">Effective From Date</Label>
          <Input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="bg-input border-border"
            data-ocid="batch.assign.input"
          />
          <p className="text-xs text-muted-foreground">
            Fee due cards will regenerate from this month. Previous batch
            records are preserved.
          </p>
        </div>

        {/* Quick action */}
        {unassignedCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllUnassigned}
            className="border-primary/40 text-primary hover:bg-primary/10 w-full gap-2"
            data-ocid="batch.assign.secondary_button"
          >
            <Users className="w-3.5 h-3.5" />
            Select All Unassigned ({unassignedCount})
          </Button>
        )}

        {/* Student list */}
        {studentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : activeStudents.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground text-sm"
            data-ocid="batch.assign.empty_state"
          >
            No active students found
          </div>
        ) : (
          <ScrollArea className="h-72 border border-border rounded-md">
            <div className="p-1 space-y-0.5">
              {studentRows.map(
                (
                  { student, isInThisBatch, isInOtherBatch, otherBatchName },
                  idx,
                ) => {
                  const idStr = student.id.toString();
                  const isChecked = isInThisBatch || selected.has(idStr);
                  const isDisabled = isInThisBatch;

                  return (
                    <div
                      key={idStr}
                      data-ocid={`batch.assign.item.${idx + 1}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                        isInThisBatch
                          ? "opacity-60 bg-primary/5"
                          : selected.has(idStr)
                            ? "bg-primary/10"
                            : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={`student-${idStr}`}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && toggle(idStr)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        data-ocid={`batch.assign.checkbox.${idx + 1}`}
                      />
                      <label
                        htmlFor={`student-${idStr}`}
                        className={`flex-1 min-w-0 ${isDisabled ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground truncate">
                            {student.name}
                          </span>
                          {isInThisBatch && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              Already in this batch
                            </Badge>
                          )}
                          {isInOtherBatch && (
                            <span className="flex items-center gap-1 text-xs text-amber-500">
                              <AlertTriangle className="w-3 h-3" />
                              Will change from {otherBatchName}
                            </span>
                          )}
                          {!isInThisBatch && !isInOtherBatch && (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                },
              )}
            </div>
          </ScrollArea>
        )}

        {selected.size > 0 && (
          <p className="text-xs text-primary font-medium">
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
            {Array.from(selected).filter((id) =>
              studentRows.find(
                (r) => r.student.id.toString() === id && r.isInThisBatch,
              ),
            ).length > 0
              ? ""
              : ""}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border"
            data-ocid="batch.assign.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selected.size === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            data-ocid="batch.assign.submit_button"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting
              ? "Assigning..."
              : `Assign${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BatchStudentCount({ batchId }: { batchId: bigint }) {
  const { data: students = [], isLoading } = useStudentsInBatch(batchId);
  if (isLoading) return <Skeleton className="w-6 h-4 inline-block" />;
  return <span>{students.length}</span>;
}

export default function BatchesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [deleteBatch, setDeleteBatch] = useState<Batch | null>(null);
  const [assignStudentsBatch, setAssignStudentsBatch] = useState<Batch | null>(
    null,
  );

  const { isAdmin } = useAuth();
  const { data: batches = [], isLoading } = useAllBatches();
  const deleteBatchMutation = useDeleteBatch();

  const handleDelete = async () => {
    if (!deleteBatch) return;
    try {
      await deleteBatchMutation.mutateAsync(deleteBatch.id);
      toast.success("Batch deleted");
      setDeleteBatch(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Batches
          </h1>
          <p className="text-muted-foreground text-sm">
            {batches.length} batch{batches.length !== 1 ? "es" : ""} configured
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
        )}
      </div>

      {/* Batch Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No batches yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first batch to get started
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id.toString()}
              className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all duration-200 shadow-card group relative"
            >
              {/* Active indicator */}
              {batch.isActive && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary shadow-glow" />
              )}

              <h3 className="font-display font-bold text-foreground text-base group-hover:text-primary transition-colors pr-4">
                {batch.name}
              </h3>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                  <span>
                    {batch.startTime} – {batch.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                  <BatchStudentCount batchId={batch.id} />
                  <span>students enrolled</span>
                </div>
              </div>

              {/* Days */}
              <div className="flex flex-wrap gap-1 mt-3">
                {batch.daysOfWeek.map((d) => (
                  <span
                    key={d.toString()}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20"
                  >
                    {DAYS_LABELS[Number(d)]}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 text-sm font-semibold"
                  >
                    ₹{batch.monthlyFees.toString()}/mo
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditBatch(batch)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit batch"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteBatch(batch)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Assign Students button — visible to admin and staff */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignStudentsBatch(batch)}
                  className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all"
                  data-ocid="batch.assign.open_modal_button"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign Students
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(formOpen || editBatch) && (
        <BatchFormDialog
          open={formOpen || !!editBatch}
          onClose={() => {
            setFormOpen(false);
            setEditBatch(null);
          }}
          batch={editBatch ?? undefined}
        />
      )}

      {/* Assign Students Modal */}
      {assignStudentsBatch && (
        <BatchStudentAssignModal
          batch={assignStudentsBatch}
          onClose={() => setAssignStudentsBatch(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteBatch}
        onOpenChange={(o) => !o && setDeleteBatch(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Batch?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will delete the batch{" "}
              <strong className="text-foreground">"{deleteBatch?.name}"</strong>
              . Students assigned to this batch will lose their batch
              assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
