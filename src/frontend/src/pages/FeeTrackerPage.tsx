import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FeeAssignmentType } from "../backend";
import type { FeeAssignment, FeeAssignmentPayment } from "../backend.d.ts";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllBatches,
  useAllFeeAssignments,
  useAllStudents,
  useCreateFeeAssignment,
  useFeeAssignmentPayments,
  useMarkFeeAssignmentPaymentPaid,
  useStudentsInBatch,
} from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FEE_TYPE_LABELS: Record<FeeAssignmentType, string> = {
  [FeeAssignmentType.annualDay]: "Annual Day",
  [FeeAssignmentType.puja]: "Puja",
  [FeeAssignmentType.other]: "Other",
};

const FEE_TYPE_COLORS: Record<FeeAssignmentType, string> = {
  [FeeAssignmentType.annualDay]: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  [FeeAssignmentType.puja]: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  [FeeAssignmentType.other]: "bg-accent/15 text-accent border-accent/30",
};

// ─── Batch Auto-Select Helper ──────────────────────────────────────────────────

function BatchAutoSelect({
  onSelect,
}: {
  onSelect: (studentIds: bigint[]) => void;
}) {
  const { data: batches = [] } = useAllBatches();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const { data: batchStudents = [], isFetching } = useStudentsInBatch(
    selectedBatch ? BigInt(selectedBatch) : null,
  );

  const handleSelect = (batchId: string) => {
    setSelectedBatch(batchId);
  };

  const handleAutoCheck = () => {
    if (!selectedBatch || batchStudents.length === 0) return;
    const activeIds = batchStudents.filter((s) => s.isActive).map((s) => s.id);
    onSelect(activeIds);
    toast.success(
      `Selected ${activeIds.length} student${activeIds.length !== 1 ? "s" : ""} from batch`,
    );
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label className="text-foreground text-sm">Select by Batch</Label>
        <Select value={selectedBatch} onValueChange={handleSelect}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Choose a batch..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {batches.map((b) => (
              <SelectItem key={b.id.toString()} value={b.id.toString()}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAutoCheck}
        disabled={!selectedBatch || isFetching}
        className="h-9 gap-1.5 border-border text-muted-foreground hover:text-foreground"
      >
        {isFetching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Users className="w-3.5 h-3.5" />
        )}
        Auto-select
      </Button>
    </div>
  );
}

// ─── Assign Tab ───────────────────────────────────────────────────────────────

function AssignTab() {
  const currentYear = new Date().getFullYear();
  const [feeType, setFeeType] = useState<FeeAssignmentType>(
    FeeAssignmentType.puja,
  );
  const [name, setName] = useState("");
  const [year, setYear] = useState(currentYear.toString());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const createAssignment = useCreateFeeAssignment();

  const activeStudents = students.filter((s) => s.isActive);
  const filteredStudents = activeStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(new Set(filteredStudents.map((s) => s.id.toString())));
  const clearAll = () => setSelectedIds(new Set());

  const handleBatchAutoSelect = (ids: bigint[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.add(id.toString());
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a name/label");
    if (!amount || Number(amount) <= 0)
      return toast.error("Please enter a valid amount");
    if (selectedIds.size === 0)
      return toast.error("Please select at least one student");

    try {
      await createAssignment.mutateAsync({
        name: name.trim(),
        feeType,
        amount: BigInt(amount),
        year: BigInt(year || currentYear),
        studentIds: Array.from(selectedIds).map(BigInt),
        description: description.trim(),
      });
      toast.success(
        `Fee assigned to ${selectedIds.size} student${selectedIds.size !== 1 ? "s" : ""}`,
      );
      setName("");
      setAmount("");
      setDescription("");
      setSelectedIds(new Set());
      setSearch("");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fee details */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground text-base">
          Fee Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Fee Type */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Fee Type *</Label>
            <Select
              value={feeType}
              onValueChange={(v) => setFeeType(v as FeeAssignmentType)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value={FeeAssignmentType.puja}>Puja</SelectItem>
                <SelectItem value={FeeAssignmentType.annualDay}>
                  Annual Day
                </SelectItem>
                <SelectItem value={FeeAssignmentType.other}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Year *</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2100"
              className="bg-input border-border"
            />
          </div>
        </div>

        {/* Name / Label */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">
            {feeType === FeeAssignmentType.puja
              ? "Puja Name (e.g. Ganesh Puja 2026)"
              : feeType === FeeAssignmentType.annualDay
                ? "Label (e.g. Annual Day 2026)"
                : "Label *"}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              feeType === FeeAssignmentType.puja
                ? "Ganesh Puja 2026"
                : feeType === FeeAssignmentType.annualDay
                  ? "Annual Day 2026"
                  : "Costume Fees"
            }
            className="bg-input border-border"
          />
        </div>

        {/* Description (only for Other) */}
        {feeType === FeeAssignmentType.other && (
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this fee (e.g. Competition entry fee for district level)"
              className="bg-input border-border resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm">
            Amount (₹) — same for all selected students *
          </Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            min="0"
            className="bg-input border-border text-lg font-semibold"
          />
        </div>
      </div>

      {/* Student selection */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground text-base">
            Select Students
          </h2>
          {selectedIds.size > 0 && (
            <Badge className="bg-primary/15 text-primary border-primary/30">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>

        {/* Batch auto-select */}
        <BatchAutoSelect onSelect={handleBatchAutoSelect} />

        {/* Search + select all / clear */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="pl-8 bg-input border-border h-8 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>

        {/* Student list */}
        {studentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {search ? "No students match your search" : "No active students"}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {filteredStudents.map((student) => {
              const id = student.id.toString();
              const checked = selectedIds.has(id);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 border ${
                    checked
                      ? "bg-primary/10 border-primary/25"
                      : "bg-secondary/40 border-transparent hover:border-border"
                  }`}
                >
                  <Checkbox
                    id={`student-${id}`}
                    checked={checked}
                    onCheckedChange={() => toggleStudent(id)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`student-${id}`}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.guardianName}
                    </p>
                  </label>
                  {checked && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={createAssignment.isPending || selectedIds.size === 0}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2"
      >
        {createAssignment.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {createAssignment.isPending
          ? "Assigning..."
          : `Assign Fee to ${selectedIds.size} Student${selectedIds.size !== 1 ? "s" : ""}`}
      </Button>
    </form>
  );
}

// ─── Payment Row (per student inside an expanded assignment) ──────────────────

function PaymentRow({
  payment,
  assignmentId,
  studentName,
}: {
  payment: FeeAssignmentPayment;
  assignmentId: bigint;
  studentName: string;
}) {
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const markPaid = useMarkFeeAssignmentPaymentPaid();

  const handleMarkPaid = async () => {
    try {
      await markPaid.mutateAsync({
        assignmentId,
        studentId: payment.studentId,
        paidDate,
      });
      toast.success(`${studentName} marked as paid`);
      setMarkingPaid(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-xs font-bold">
            {studentName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium text-foreground truncate">
          {studentName}
        </span>
      </div>

      <span className="text-sm text-muted-foreground">
        ₹{payment.amount.toString()}
      </span>

      <Badge
        variant="outline"
        className={
          payment.isPaid
            ? "text-xs border-success/40 text-success bg-success/10"
            : "text-xs border-warning/40 text-warning bg-warning/10"
        }
      >
        {payment.isPaid ? "Paid" : "Unpaid"}
      </Badge>

      {payment.isPaid && payment.paidDate && (
        <span className="text-xs text-muted-foreground">
          {payment.paidDate}
        </span>
      )}

      {!payment.isPaid &&
        (markingPaid ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="h-7 w-36 bg-input border-border text-xs"
            />
            <Button
              size="sm"
              onClick={handleMarkPaid}
              disabled={markPaid.isPending}
              className="h-7 px-2 text-xs bg-success/20 text-success hover:bg-success/30 border border-success/30"
            >
              {markPaid.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMarkingPaid(false)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMarkingPaid(true)}
            className="h-7 px-2 text-xs border border-primary/30 text-primary hover:bg-primary/10"
          >
            Mark Paid
          </Button>
        ))}
    </div>
  );
}

// ─── Assignment Card (expandable) ─────────────────────────────────────────────

function AssignmentCard({
  assignment,
  students,
}: {
  assignment: FeeAssignment;
  students: Array<{ id: bigint; name: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: payments = [], isLoading: paymentsLoading } =
    useFeeAssignmentPayments(expanded ? assignment.id : null);

  const paidCount = payments.filter((p) => p.isPaid).length;
  const unpaidCount = payments.filter((p) => !p.isPaid).length;
  const totalCount = payments.length;

  const getStudentName = (studentId: bigint) =>
    students.find((s) => s.id.toString() === studentId.toString())?.name ??
    `Student #${studentId.toString()}`;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/20 transition-all duration-200">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-wrap items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">
              {assignment.name}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${FEE_TYPE_COLORS[assignment.feeType]}`}
            >
              {FEE_TYPE_LABELS[assignment.feeType]}
            </Badge>
            {assignment.description && (
              <span className="text-xs text-muted-foreground italic truncate max-w-xs">
                {assignment.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>Year {assignment.year.toString()}</span>
            <span>₹{assignment.amount.toString()}/student</span>
          </div>
        </div>

        {/* Stats — only shown when expanded (payments loaded) */}
        {expanded && !paymentsLoading && (
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {totalCount} assigned
            </span>
            <span className="bg-success/15 text-success px-2 py-0.5 rounded">
              {paidCount} paid
            </span>
            <span className="bg-warning/15 text-warning px-2 py-0.5 rounded">
              {unpaidCount} unpaid
            </span>
          </div>
        )}

        <div className="ml-auto flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expandable student payment list */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3 italic">
              No payment records found
            </p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 mb-3 bg-secondary/50 rounded-lg p-3 text-xs">
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Total assigned:{" "}
                    <strong className="text-foreground">{totalCount}</strong>
                  </span>
                  <span className="text-success">
                    Paid: <strong>{paidCount}</strong>
                  </span>
                  <span className="text-warning">
                    Unpaid: <strong>{unpaidCount}</strong>
                  </span>
                </div>
                {totalCount > 0 && (
                  <div className="flex-shrink-0 text-muted-foreground">
                    {Math.round((paidCount / totalCount) * 100)}% collected
                  </div>
                )}
              </div>

              {/* Unpaid first, then paid */}
              {[
                ...payments.filter((p) => !p.isPaid),
                ...payments.filter((p) => p.isPaid),
              ].map((payment) => (
                <PaymentRow
                  key={payment.studentId.toString()}
                  payment={payment}
                  assignmentId={assignment.id}
                  studentName={getStudentName(payment.studentId)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tracker Tab ──────────────────────────────────────────────────────────────

function TrackerTab() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const { data: assignments = [], isLoading } = useAllFeeAssignments();
  const { data: students = [] } = useAllStudents();

  // Build year options from assignments
  const years = Array.from(
    new Set(assignments.map((a) => a.year.toString())),
  ).sort((a, b) => Number(b) - Number(a));

  const filtered = assignments.filter((a) => {
    const typeMatch =
      typeFilter === "all" || (a.feeType as string) === typeFilter;
    const yearMatch = yearFilter === "all" || a.year.toString() === yearFilter;
    return typeMatch && yearMatch;
  });

  // Sort: most recent year first, then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    if (b.year !== a.year) return Number(b.year - a.year);
    return a.name.localeCompare(b.name);
  });

  const studentsList = students.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Label className="text-muted-foreground text-xs whitespace-nowrap">
            Type:
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-input border-border h-8 text-sm flex-1 min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={FeeAssignmentType.puja}>Puja</SelectItem>
              <SelectItem value={FeeAssignmentType.annualDay}>
                Annual Day
              </SelectItem>
              <SelectItem value={FeeAssignmentType.other}>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground text-xs whitespace-nowrap">
            Year:
          </Label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="bg-input border-border h-8 text-sm w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(typeFilter !== "all" || yearFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter("all");
              setYearFilter("all");
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Assignment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">
            {assignments.length === 0
              ? "No fee assignments yet"
              : "No assignments match your filters"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {assignments.length === 0
              ? "Use the 'Assign Fees' tab to create one"
              : "Try adjusting the filters above"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {sorted.length} assignment{sorted.length !== 1 ? "s" : ""} — click
            to expand and see student payment status
          </p>
          {sorted.map((a) => (
            <AssignmentCard
              key={a.id.toString()}
              assignment={a}
              students={studentsList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeeTrackerPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Access Restricted</p>
          <p className="text-muted-foreground text-sm mt-1">
            Fee Tracker is available to Admin only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Fee Tracker
        </h1>
        <p className="text-muted-foreground text-sm">
          Assign and track Annual Day, Puja &amp; Other fees across students
        </p>
      </div>

      <Tabs defaultValue="assign" className="space-y-5">
        <TabsList className="bg-secondary border border-border p-1 h-auto gap-1">
          <TabsTrigger
            value="assign"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Assign Fees
          </TabsTrigger>
          <TabsTrigger
            value="tracker"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign">
          <AssignTab />
        </TabsContent>

        <TabsContent value="tracker">
          <TrackerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
