import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend.d.ts";
import {
  useCurrentYear,
  useDueCard,
  useGenerateDueCard,
  useRecordFeePayment,
} from "../hooks/useQueries";

const MONTHS = [
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

interface DueCardModalProps {
  student: Student;
  onClose: () => void;
}

interface PaymentDialogProps {
  studentId: bigint;
  month: number;
  year: bigint;
  onClose: () => void;
}

function PaymentDialog({
  studentId,
  month,
  year,
  onClose,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const recordPayment = useRecordFeePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return toast.error("Please enter amount");
    try {
      await recordPayment.mutateAsync({
        studentId,
        date,
        feeType: "Monthly",
        amount: BigInt(amount),
        remarks,
        month: BigInt(month),
        year,
      });
      toast.success("Payment recorded");
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Record Payment — {MONTHS[month - 1]} {year.toString()}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Payment Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
              className="bg-input border-border"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordPayment.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {recordPayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DueCardModal({ student, onClose }: DueCardModalProps) {
  const { data: currentYear = BigInt(new Date().getFullYear()) } =
    useCurrentYear();
  const [selectedYear, setSelectedYear] = useState<number>(Number(currentYear));
  const [openingBalance, setOpeningBalance] = useState("0");
  const [paymentMonth, setPaymentMonth] = useState<number | null>(null);
  const generateDueCard = useGenerateDueCard();

  const {
    data: dueCard,
    isLoading,
    error,
  } = useDueCard(student.id, BigInt(selectedYear));

  // Parse admission month (1-indexed)
  const admissionDate = new Date(`${student.dateOfAdmission}T00:00:00`);
  const admissionYear = admissionDate.getFullYear();
  const admissionMonth = admissionDate.getMonth() + 1; // 1-indexed

  const isMonthBeforeAdmission = (month: number) => {
    if (selectedYear < admissionYear) return true;
    if (selectedYear === admissionYear && month < admissionMonth) return true;
    return false;
  };

  const handleGenerate = async () => {
    try {
      await generateDueCard.mutateAsync({
        studentId: student.id,
        year: BigInt(selectedYear),
        openingBalance: BigInt(openingBalance || "0"),
      });
      toast.success("Due card generated");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const getMonthEntry = (month: number) => {
    return dueCard?.monthlyEntries.find((e) => Number(e.month) === month);
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground text-lg">
              Due Card — {student.name}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Admission: {student.dateOfAdmission}
            </p>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Year selector + generate */}
            <div className="flex flex-wrap items-end gap-3 bg-secondary/50 p-3 rounded-lg border border-border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Year
                </Label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Opening Balance (₹)
                </Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="bg-input border-border w-36 h-9"
                  min="0"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateDueCard.isPending}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {generateDueCard.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Generate
              </Button>
            </div>

            {/* Due Card Table */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading due card...
              </div>
            ) : error || !dueCard ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No due card found for {selectedYear}</p>
                <p className="text-sm mt-1">
                  Generate one above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dueCard.openingBalance > 0n && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      Opening Balance
                    </span>
                    <span className="font-medium text-accent">
                      ₹{dueCard.openingBalance.toString()}
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                          Month
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                          Due
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                          Paid
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                          Balance
                        </th>
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((name, idx) => {
                        const month = idx + 1;
                        const entry = getMonthEntry(month);
                        const beforeAdmission = isMonthBeforeAdmission(month);

                        if (beforeAdmission) {
                          return (
                            <tr
                              key={month}
                              className="border-b border-border/40"
                            >
                              <td className="py-2.5 px-3 text-muted-foreground/40">
                                {name}
                              </td>
                              <td
                                colSpan={4}
                                className="py-2.5 px-3 text-center text-muted-foreground/40 text-xs italic"
                              >
                                N/A (before admission)
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={month}
                            className={cn(
                              "border-b border-border/40 transition-colors",
                              entry && Number(entry.balance) > 0
                                ? "bg-destructive/5"
                                : entry && Number(entry.paidAmount) > 0
                                  ? "bg-primary/5"
                                  : "",
                            )}
                          >
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {name}
                            </td>
                            <td className="py-2.5 px-3 text-right text-foreground">
                              {entry ? `₹${entry.dueAmount.toString()}` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right text-primary">
                              {entry ? `₹${entry.paidAmount.toString()}` : "—"}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 px-3 text-right font-medium",
                                entry && Number(entry.balance) > 0
                                  ? "text-destructive"
                                  : entry
                                    ? "text-primary"
                                    : "text-muted-foreground",
                              )}
                            >
                              {entry ? `₹${entry.balance.toString()}` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPaymentMonth(month)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                              >
                                Pay
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {paymentMonth !== null && (
        <PaymentDialog
          studentId={student.id}
          month={paymentMonth}
          year={BigInt(selectedYear)}
          onClose={() => setPaymentMonth(null)}
        />
      )}
    </>
  );
}
