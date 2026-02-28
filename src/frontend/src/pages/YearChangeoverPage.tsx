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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  useAllFeeAssignments,
  useAllStudents,
  useCurrentYear,
  usePerformYearChangeover,
} from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentPreview {
  studentId: bigint;
  studentName: string;
  unpaidMonthly: bigint;
  unpaidOtherFees: bigint;
  totalOpeningBalance: bigint;
  breakdownItems: Array<{ description: string; amount: bigint }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(amount: bigint): string {
  return Number(amount).toLocaleString("en-IN");
}

// ─── Breakdown Row ────────────────────────────────────────────────────────────

function StudentBreakdownRow({ preview }: { preview: StudentPreview }) {
  const [expanded, setExpanded] = useState(false);
  const hasBalance = preview.totalOpeningBalance > BigInt(0);

  return (
    <>
      <TableRow
        className={`border-border transition-colors ${
          hasBalance
            ? "hover:bg-secondary/30 cursor-pointer"
            : "hover:bg-secondary/10 opacity-60"
        }`}
        onClick={() => hasBalance && setExpanded((prev) => !prev)}
      >
        {/* Expand toggle */}
        <TableCell className="w-8 pr-0">
          {hasBalance ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : null}
        </TableCell>

        {/* Name */}
        <TableCell className="font-medium text-foreground">
          {preview.studentName}
        </TableCell>

        {/* Unpaid Monthly */}
        <TableCell className="text-right">
          {preview.unpaidMonthly > BigInt(0) ? (
            <span className="text-warning font-semibold">
              ₹{formatInr(preview.unpaidMonthly)}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </TableCell>

        {/* Unpaid Other Fees */}
        <TableCell className="text-right">
          {preview.unpaidOtherFees > BigInt(0) ? (
            <span className="text-orange-500 font-semibold">
              ₹{formatInr(preview.unpaidOtherFees)}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </TableCell>

        {/* Total */}
        <TableCell className="text-right">
          {preview.totalOpeningBalance > BigInt(0) ? (
            <span className="text-primary font-bold">
              ₹{formatInr(preview.totalOpeningBalance)}
            </span>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] text-green-600 border-green-500/25 bg-green-500/5"
            >
              Cleared
            </Badge>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded breakdown */}
      {expanded && hasBalance && (
        <TableRow className="border-border bg-secondary/20">
          <TableCell colSpan={5} className="py-0">
            <div className="py-3 pl-10 pr-4 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Opening Balance Breakdown
              </p>
              {preview.breakdownItems.map((item) => (
                <div
                  key={`${item.description}-${item.amount.toString()}`}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.description}
                  </span>
                  <span className="font-semibold text-foreground">
                    ₹{formatInr(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm border-t border-border pt-1.5 mt-1.5">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary">
                  ₹{formatInr(preview.totalOpeningBalance)}
                </span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({
  toYear,
  studentCount,
  totalBalance,
  onDismiss,
}: {
  toYear: bigint;
  studentCount: number;
  totalBalance: bigint;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Year {toYear.toString()} is now active
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Year changeover completed successfully. Opening balances have been
          carried forward for all students.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{studentCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students updated
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            ₹{formatInr(totalBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opening balance
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={onDismiss}
        className="border-border text-muted-foreground hover:text-foreground"
      >
        Back to Changeover
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function YearChangeoverPage() {
  const { data: currentYearData, isLoading: yearLoading } = useCurrentYear();
  const currentYear = currentYearData ?? BigInt(new Date().getFullYear());

  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const { data: allAssignments = [] } = useAllFeeAssignments();
  const { actor } = useActor();

  const [toYear, setToYear] = useState<number>(new Date().getFullYear() + 1);
  const [previews, setPreviews] = useState<StudentPreview[] | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successState, setSuccessState] = useState<{
    toYear: bigint;
    studentCount: number;
    totalBalance: bigint;
  } | null>(null);

  const performChangeover = usePerformYearChangeover();

  const activeStudents = useMemo(
    () => students.filter((s) => s.isActive),
    [students],
  );

  // ── Preview computation ──────────────────────────────────────────────────

  const handlePreview = useCallback(async () => {
    if (!actor) return toast.error("Not connected to backend");
    if (activeStudents.length === 0)
      return toast.error("No active students found");

    setIsPreviewing(true);
    setPreviews(null);

    try {
      const results: StudentPreview[] = await Promise.all(
        activeStudents.map(async (student) => {
          const [dueCard, feeAsgPayments] = await Promise.all([
            actor.getDueCard(student.id, currentYear),
            actor.getAllFeeAssignmentPaymentsForStudent(student.id),
          ]);

          // Unpaid monthly balance
          let unpaidMonthly = BigInt(0);
          const monthlyBreakdown: Array<{
            description: string;
            amount: bigint;
          }> = [];
          if (dueCard) {
            for (const entry of dueCard.monthlyEntries) {
              const balance = entry.dueAmount - entry.paidAmount;
              if (balance > BigInt(0)) {
                unpaidMonthly += balance;
                const monthNames = [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ];
                monthlyBreakdown.push({
                  description: `${monthNames[Number(entry.month) - 1]} ${currentYear.toString()} Monthly Fees`,
                  amount: balance,
                });
              }
            }
          }

          // Unpaid fee assignments (puja, annualDay, other)
          let unpaidOtherFees = BigInt(0);
          const otherBreakdown: Array<{ description: string; amount: bigint }> =
            [];
          const unpaidAssignmentIds = new Set(
            feeAsgPayments
              .filter((p) => !p.isPaid)
              .map((p) => p.assignmentId.toString()),
          );
          for (const asg of allAssignments) {
            if (
              asg.year === currentYear &&
              unpaidAssignmentIds.has(asg.id.toString())
            ) {
              const payment = feeAsgPayments.find(
                (p) => p.assignmentId === asg.id,
              );
              const amount = payment?.amount ?? asg.amount;
              unpaidOtherFees += amount;
              otherBreakdown.push({
                description: `${asg.name} ${currentYear.toString()}`,
                amount,
              });
            }
          }

          const breakdownItems = [...monthlyBreakdown, ...otherBreakdown];
          const totalOpeningBalance = unpaidMonthly + unpaidOtherFees;

          return {
            studentId: student.id,
            studentName: student.name,
            unpaidMonthly,
            unpaidOtherFees,
            totalOpeningBalance,
            breakdownItems,
          };
        }),
      );

      // Sort: students with balance first, then alphabetical
      results.sort((a, b) => {
        if (
          a.totalOpeningBalance > BigInt(0) &&
          b.totalOpeningBalance === BigInt(0)
        )
          return -1;
        if (
          a.totalOpeningBalance === BigInt(0) &&
          b.totalOpeningBalance > BigInt(0)
        )
          return 1;
        return a.studentName.localeCompare(b.studentName);
      });

      setPreviews(results);
    } catch (err) {
      toast.error(
        `Preview failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsPreviewing(false);
    }
  }, [actor, activeStudents, currentYear, allAssignments]);

  // ── Perform changeover ───────────────────────────────────────────────────

  const handleConfirmChangeover = async () => {
    setConfirmOpen(false);
    try {
      await performChangeover.mutateAsync(BigInt(toYear));

      const studentsWithBalance = (previews ?? []).filter(
        (p) => p.totalOpeningBalance > BigInt(0),
      );
      const totalBalance = (previews ?? []).reduce(
        (sum, p) => sum + p.totalOpeningBalance,
        BigInt(0),
      );

      setSuccessState({
        toYear: BigInt(toYear),
        studentCount: studentsWithBalance.length,
        totalBalance,
      });
      setPreviews(null);
      toast.success(`Year ${toYear} changeover completed successfully`);
    } catch (err) {
      toast.error(
        `Changeover failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // ── Summary stats ────────────────────────────────────────────────────────

  const totalUnpaidMonthly = useMemo(
    () => (previews ?? []).reduce((sum, p) => sum + p.unpaidMonthly, BigInt(0)),
    [previews],
  );
  const totalUnpaidOther = useMemo(
    () =>
      (previews ?? []).reduce((sum, p) => sum + p.unpaidOtherFees, BigInt(0)),
    [previews],
  );
  const totalOpeningBalance = useMemo(
    () => totalUnpaidMonthly + totalUnpaidOther,
    [totalUnpaidMonthly, totalUnpaidOther],
  );
  const studentsWithDues = useMemo(
    () =>
      (previews ?? []).filter((p) => p.totalOpeningBalance > BigInt(0)).length,
    [previews],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (successState) {
    return (
      <div className="p-4 sm:p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <SuccessState
            toYear={successState.toYear}
            studentCount={successState.studentCount}
            totalBalance={successState.totalBalance}
            onDismiss={() => setSuccessState(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Year Changeover
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Carry forward unpaid dues as opening balances into the new year
          </p>
        </div>

        {yearLoading ? (
          <Skeleton className="w-32 h-8" />
        ) : (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm self-start sm:self-auto">
            <span className="text-muted-foreground">Current Year:</span>
            <span className="font-bold text-primary">
              {currentYear.toString()}
            </span>
          </div>
        )}
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-warning/10 border border-warning/25 rounded-xl p-4 text-sm">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Before performing a year changeover:
          </p>
          <ul className="text-muted-foreground space-y-0.5 list-disc list-inside text-xs">
            <li>
              Preview the dues before confirming — this action cannot be undone
            </li>
            <li>
              All unpaid monthly dues and fee assignments for the current year
              will be carried as opening balance
            </li>
            <li>
              The opening balance breakdown will be visible when recording
              payments in Fee Collection
            </li>
          </ul>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h2 className="font-display font-semibold text-foreground">
          Changeover Settings
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* From year (read-only) */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">From Year</p>
            <div className="h-10 px-3 bg-secondary/60 border border-border rounded-lg flex items-center text-foreground font-semibold min-w-[100px]">
              {yearLoading ? (
                <Skeleton className="w-16 h-4" />
              ) : (
                currentYear.toString()
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="h-10 flex items-center text-muted-foreground">
            <RefreshCcw className="w-4 h-4" />
          </div>

          {/* To year */}
          <div className="space-y-1.5">
            <label
              htmlFor="to-year-input"
              className="text-sm font-medium text-foreground block"
            >
              New Year *
            </label>
            <input
              id="to-year-input"
              type="number"
              value={toYear}
              min={Number(currentYear) + 1}
              max={Number(currentYear) + 5}
              onChange={(e) => {
                const val = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(val)) setToYear(val);
              }}
              className="h-10 px-3 bg-input border border-border rounded-lg text-foreground font-semibold w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Preview button */}
          <Button
            onClick={handlePreview}
            disabled={isPreviewing || studentsLoading || yearLoading}
            className="bg-secondary text-foreground border border-border hover:bg-secondary/80 gap-2 h-10"
            variant="outline"
          >
            {isPreviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {isPreviewing ? "Computing..." : "Preview Dues"}
          </Button>
        </div>
      </div>

      {/* Preview table */}
      {isPreviewing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <Skeleton className="w-48 h-5" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      )}

      {previews && !isPreviewing && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {activeStudents.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active Students
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-warning">
                {studentsWithDues}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">With Dues</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">
                ₹{formatInr(totalUnpaidMonthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly Dues
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">
                ₹{formatInr(totalOpeningBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Opening Balance
              </p>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">
                Student-wise Due Preview
              </h2>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground text-xs"
                >
                  {previews.length} students
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Click a row to see breakdown
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead className="text-muted-foreground font-medium">
                    Student
                  </TableHead>
                  <TableHead className="text-right text-warning font-medium">
                    Monthly Dues (₹)
                  </TableHead>
                  <TableHead className="text-right text-orange-500 font-medium">
                    Other Fees (₹)
                  </TableHead>
                  <TableHead className="text-right text-primary font-medium">
                    Opening Balance (₹)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previews.map((preview) => (
                  <StudentBreakdownRow
                    key={preview.studentId.toString()}
                    preview={preview}
                  />
                ))}

                {/* Totals row */}
                {previews.length > 0 && (
                  <TableRow className="border-t-2 border-primary/20 bg-primary/5 hover:bg-primary/8">
                    <TableCell />
                    <TableCell className="font-bold text-foreground">
                      Total ({previews.length} students)
                    </TableCell>
                    <TableCell className="text-right font-bold text-warning">
                      {totalUnpaidMonthly > BigInt(0)
                        ? `₹${formatInr(totalUnpaidMonthly)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-orange-500">
                      {totalUnpaidOther > BigInt(0)
                        ? `₹${formatInr(totalUnpaidOther)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary text-base">
                      ₹{formatInr(totalOpeningBalance)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Perform button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={performChangeover.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6"
            >
              {performChangeover.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarRange className="w-4 h-4" />
              )}
              {performChangeover.isPending
                ? "Processing..."
                : `Perform Year ${toYear} Changeover`}
            </Button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!previews && !isPreviewing && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/60 mx-auto mb-4 flex items-center justify-center">
            <CalendarRange className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">
            Preview before proceeding
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Click "Preview Dues" to see the outstanding balances that will be
            carried forward for all active students.
          </p>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirm Year Changeover
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <span className="block">
                This will carry forward unpaid dues as opening balances for{" "}
                <strong className="text-foreground">{studentsWithDues}</strong>{" "}
                student{studentsWithDues !== 1 ? "s" : ""} and set the active
                year to <strong className="text-foreground">{toYear}</strong>.
              </span>
              <span className="block mt-2 text-warning font-medium">
                Total opening balance: ₹{formatInr(totalOpeningBalance)}
              </span>
              <span className="block text-destructive font-semibold mt-1">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChangeover}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Changeover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
