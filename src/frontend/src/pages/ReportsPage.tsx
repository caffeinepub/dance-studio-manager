import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Banknote,
  BarChart2,
  Calendar,
  Receipt,
  Smartphone,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAllStudents, useGetAllPayments } from "../hooks/useQueries";

const FEE_TYPE_LABELS: Record<string, string> = {
  Monthly: "Monthly Fees",
  Solo: "Solo Programme Fees",
  Puja: "Puja Fees",
  AnnualDay: "Annual Day Fees",
  PreviousYearDues: "Previous Year Dues",
  Admission: "Admission Fees",
  Other: "Other",
};

function feeTypeLabel(feeType: string): string {
  return FEE_TYPE_LABELS[feeType] ?? feeType;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="bg-card border-border shadow-card overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="w-24 h-8 mt-1" />
            ) : (
              <p
                className={`font-display text-2xl sm:text-3xl font-bold ${accent}`}
              >
                {value}
              </p>
            )}
            {sub && !isLoading && (
              <p className="text-muted-foreground text-xs mt-1">{sub}</p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent.replace("text-", "bg-").replace("foreground", "500")}/15 border border-current/10`}
          >
            <Icon className={`w-5 h-5 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: allPayments = [], isLoading: paymentsLoading } =
    useGetAllPayments();
  const { data: students = [], isLoading: studentsLoading } = useAllStudents();

  const isLoading = paymentsLoading || studentsLoading;

  const filtered = useMemo(
    () => allPayments.filter((p) => p.date === selectedDate),
    [allPayments, selectedDate],
  );

  const totalCash = useMemo(
    () =>
      filtered
        .filter((p) => p.paymentMode === "Cash")
        .reduce((sum, p) => sum + p.amount, BigInt(0)),
    [filtered],
  );

  const totalUPI = useMemo(
    () =>
      filtered
        .filter((p) => p.paymentMode === "UPI")
        .reduce((sum, p) => sum + p.amount, BigInt(0)),
    [filtered],
  );

  const studentsPaid = useMemo(() => {
    const unique = new Set(filtered.map((p) => p.studentId.toString()));
    return unique.size;
  }, [filtered]);

  const newRegistrations = useMemo(
    () => students.filter((s) => s.dateOfAdmission === selectedDate).length,
    [students, selectedDate],
  );

  // Fee type breakdown
  const feeBreakdown = useMemo(() => {
    const map = new Map<string, { cash: bigint; upi: bigint }>();
    for (const p of filtered) {
      const entry = map.get(p.feeType) ?? { cash: BigInt(0), upi: BigInt(0) };
      if (p.paymentMode === "Cash") entry.cash += p.amount;
      else if (p.paymentMode === "UPI") entry.upi += p.amount;
      map.set(p.feeType, entry);
    }
    return Array.from(map.entries())
      .map(([ft, v]) => ({
        feeType: ft,
        label: feeTypeLabel(ft),
        cash: v.cash,
        upi: v.upi,
        total: v.cash + v.upi,
      }))
      .sort((a, b) => Number(b.total - a.total));
  }, [filtered]);

  const grandTotal = totalCash + totalUPI;

  const isToday = selectedDate === today;
  const displayDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    "en-IN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Reports
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Daily collection summary — {isToday ? "Today" : displayDate}
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
          />
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="text-xs text-primary hover:underline ml-1 flex-shrink-0"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Banknote}
          label="Cash Collected"
          value={`₹${totalCash.toString()}`}
          sub={`${filtered.filter((p) => p.paymentMode === "Cash").length} transactions`}
          accent="text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Smartphone}
          label="UPI Collected"
          value={`₹${totalUPI.toString()}`}
          sub={`${filtered.filter((p) => p.paymentMode === "UPI").length} transactions`}
          accent="text-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={UserCheck}
          label="Students Paid"
          value={studentsPaid}
          sub={`${filtered.length} total payments`}
          accent="text-primary"
          isLoading={isLoading}
        />
        <StatCard
          icon={UserPlus}
          label="New Registrations"
          value={newRegistrations}
          sub="Admitted today"
          accent="text-chart-3"
          isLoading={isLoading}
        />
      </div>

      {/* Grand total banner */}
      {!isLoading && grandTotal > BigInt(0) && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Total Collected
              </p>
              <p className="text-xs text-muted-foreground">
                Cash + UPI for {isToday ? "today" : selectedDate}
              </p>
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-primary">
            ₹{grandTotal.toString()}
          </p>
        </div>
      )}

      {/* Fee type breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">
            Breakdown by Fee Type
          </h2>
          {!isLoading && filtered.length > 0 && (
            <Badge
              variant="outline"
              className="border-border text-muted-foreground text-xs"
            >
              {feeBreakdown.length} type{feeBreakdown.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/60 mx-auto mb-4 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">
              No payments recorded on this date
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {isToday
                ? "Record a payment today to see it here."
                : `No data for ${selectedDate}.`}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">
                  Fee Type
                </TableHead>
                <TableHead className="text-right text-green-600 font-medium">
                  Cash
                </TableHead>
                <TableHead className="text-right text-blue-600 font-medium">
                  UPI
                </TableHead>
                <TableHead className="text-right text-primary font-medium">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeBreakdown.map((row) => (
                <TableRow
                  key={row.feeType}
                  className="border-border hover:bg-secondary/30"
                >
                  <TableCell className="font-medium text-foreground">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.cash > BigInt(0) ? (
                      <span className="text-green-600 font-semibold">
                        ₹{row.cash.toString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.upi > BigInt(0) ? (
                      <span className="text-blue-600 font-semibold">
                        ₹{row.upi.toString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-primary font-bold text-base">
                      ₹{row.total.toString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="border-t-2 border-primary/20 bg-primary/5 hover:bg-primary/8">
                <TableCell className="font-bold text-foreground">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  ₹{totalCash.toString()}
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600">
                  ₹{totalUPI.toString()}
                </TableCell>
                <TableCell className="text-right font-bold text-primary text-base">
                  ₹{grandTotal.toString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Individual transactions list */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">
              Transactions ({filtered.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {[...filtered]
              .sort((a, b) => Number(b.receiptNumber - a.receiptNumber))
              .map((p) => {
                const student = students.find((s) => s.id === p.studentId);
                return (
                  <div
                    key={p.receiptNumber.toString()}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <span className="text-xs font-mono text-primary font-bold w-14 flex-shrink-0">
                      #{String(p.receiptNumber).padStart(4, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student?.name ?? `Student #${p.studentId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feeTypeLabel(p.feeType)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        p.paymentMode === "Cash"
                          ? "bg-green-500/15 text-green-600"
                          : "bg-blue-500/15 text-blue-600"
                      }`}
                    >
                      {p.paymentMode === "Cash" ? (
                        <Banknote className="w-2.5 h-2.5" />
                      ) : (
                        <Smartphone className="w-2.5 h-2.5" />
                      )}
                      {p.paymentMode || "—"}
                    </span>
                    <span className="font-bold text-primary">
                      ₹{p.amount.toString()}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
