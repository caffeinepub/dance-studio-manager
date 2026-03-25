import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Printer,
  Receipt,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FeeAssignmentType } from "../backend";
import type { FeePayment, Student } from "../backend.d.ts";
import {
  useAllBatches,
  useAllFeeAssignments,
  useAllStudents,
  useCurrentYear,
  useDueCard,
  useGetAllFeeAssignmentPaymentsForStudent,
  useGetAllPayments,
  useGetPaymentsForStudent,
  useRecordFeePayment,
  useSoloRegistrationsForStudent,
  useYearChangeoverRecord,
} from "../hooks/useQueries";

// ─── Constants ─────────────────────────────────────────────────────────────────

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

// ─── Opening Balance Breakdown ─────────────────────────────────────────────────

function OpeningBalanceBreakdown({
  studentId,
  year,
  openingBalance,
}: {
  studentId: bigint;
  year: bigint;
  openingBalance: bigint;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: record, isLoading } = useYearChangeoverRecord(
    expanded ? studentId : null,
    expanded ? year : null,
  );

  if (openingBalance <= BigInt(0)) return null;

  return (
    <div className="bg-warning/8 border border-warning/20 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-warning/12 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          )}
          <span className="font-semibold text-warning">
            Opening Balance: ₹{openingBalance.toString()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Hide" : "Show"} breakdown
        </span>
      </button>

      {expanded && (
        <div className="border-t border-warning/15 px-3 py-2.5 space-y-1.5 bg-card/60">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading breakdown...
            </div>
          ) : !record || record.breakdownItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No detailed breakdown available.
            </p>
          ) : (
            <>
              {record.breakdownItems.map((item) => (
                <div
                  key={`${item.description}-${item.amount.toString()}`}
                  className="flex justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {item.description}
                  </span>
                  <span className="font-medium text-foreground">
                    ₹{item.amount.toString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold border-t border-warning/15 pt-1.5 mt-0.5">
                <span className="text-warning">Total Opening Balance</span>
                <span className="text-warning">
                  ₹{record.totalOpeningBalance.toString()}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Receipt Data ──────────────────────────────────────────────────────────────

interface ReceiptData {
  receiptNumber: bigint;
  date: string;
  studentName: string;
  guardianName: string;
  feeType: string;
  feeTypeLabel: string;
  month?: number;
  year?: number;
  amount: bigint;
  remarks: string;
  description?: string;
  paymentMode: string;
}

// ─── Receipt Print Dialog ──────────────────────────────────────────────────────

function ReceiptPrintDialog({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML ?? "";
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt #${String(receipt.receiptNumber).padStart(4, "0")}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; color: #111; padding: 20px; }
            .receipt { max-width: 420px; margin: 0 auto; border: 2px solid #c00; border-radius: 8px; overflow: hidden; }
            .receipt-header { background: #c00; color: #fff; padding: 16px 20px; text-align: center; }
            .receipt-header h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; }
            .receipt-header p { font-size: 11px; margin-top: 2px; opacity: 0.85; }
            .receipt-body { padding: 20px; }
            .receipt-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0; border-bottom: 1px dashed #e5e5e5; }
            .receipt-row:last-child { border-bottom: none; }
            .receipt-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
            .receipt-value { font-size: 13px; font-weight: 600; color: #111; text-align: right; max-width: 60%; }
            .receipt-amount { font-size: 20px; font-weight: 700; color: #c00; }
            .receipt-divider { border: none; border-top: 2px dashed #c00; margin: 12px 0; }
            .receipt-mr { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
            .receipt-mr-label { font-size: 12px; font-weight: 600; color: #333; }
            .receipt-mr-line { flex: 1; border-bottom: 1.5px solid #333; margin-left: 12px; height: 0; }
            .receipt-footer { background: #f9f9f9; border-top: 1px solid #e5e5e5; padding: 10px 20px; text-align: center; font-size: 11px; color: #888; font-style: italic; }
            @media print {
              body { padding: 0; }
              .receipt { border-radius: 0; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const receiptNo = String(receipt.receiptNumber).padStart(4, "0");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Receipt #{receiptNo}
          </DialogTitle>
        </DialogHeader>

        {/* Receipt preview */}
        <div ref={printRef}>
          <div className="receipt">
            <div className="receipt-header">
              <h1>No. 1 Dance Studio — Fee Receipt</h1>
              <p>Official Payment Acknowledgement</p>
            </div>
            <div className="receipt-body">
              <div className="receipt-row">
                <span className="receipt-label">Receipt No.</span>
                <span className="receipt-value">#{receiptNo}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Date</span>
                <span className="receipt-value">{receipt.date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Student</span>
                <span className="receipt-value">{receipt.studentName}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Guardian</span>
                <span className="receipt-value">{receipt.guardianName}</span>
              </div>
              <hr className="receipt-divider" />
              <div className="receipt-row">
                <span className="receipt-label">Fee Type</span>
                <span className="receipt-value">{receipt.feeTypeLabel}</span>
              </div>
              {receipt.month !== undefined && receipt.year !== undefined && (
                <div className="receipt-row">
                  <span className="receipt-label">Period</span>
                  <span className="receipt-value">
                    {MONTHS[receipt.month - 1]} {receipt.year}
                  </span>
                </div>
              )}
              {receipt.description && (
                <div className="receipt-row">
                  <span className="receipt-label">Description</span>
                  <span className="receipt-value">{receipt.description}</span>
                </div>
              )}
              {receipt.remarks && (
                <div className="receipt-row">
                  <span className="receipt-label">Remarks</span>
                  <span className="receipt-value">{receipt.remarks}</span>
                </div>
              )}
              {receipt.paymentMode && (
                <div className="receipt-row">
                  <span className="receipt-label">Payment Mode</span>
                  <span className="receipt-value">{receipt.paymentMode}</span>
                </div>
              )}
              <hr className="receipt-divider" />
              <div className="receipt-row">
                <span className="receipt-label">Amount Paid</span>
                <span className="receipt-value receipt-amount">
                  ₹{receipt.amount.toString()}
                </span>
              </div>
              <div className="receipt-mr">
                <span className="receipt-mr-label">Center MR No.:</span>
                <div className="receipt-mr-line" />
              </div>
            </div>
            <div className="receipt-footer">Thank you for your payment</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:text-foreground gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Student Combobox ──────────────────────────────────────────────────────────

function StudentCombobox({
  students,
  selectedId,
  onSelect,
  placeholder,
}: {
  students: Student[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = students.find((s) => s.id.toString() === selectedId);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onSelect("");
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-3 py-2.5">
          <div>
            <span className="text-sm font-semibold text-primary">
              {selected.name}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {selected.fatherName} / {selected.motherName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-3 flex-shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? "Search student by name..."}
            className="bg-input border-border"
          />
          {open && search && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id.toString()}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s.id.toString());
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors border-b border-border last:border-0"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {s.fatherName}
                  </span>
                </button>
              ))}
            </div>
          )}
          {open && search && filtered.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-3 py-3 text-sm text-muted-foreground text-center">
              No students found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Record Payment Tab ────────────────────────────────────────────────────────

interface RecordPaymentFormState {
  studentId: string;
  date: string;
  feeType: string;
  month: string; // 1-indexed month number as string
  assignmentId: string; // for puja/annualDay sub-selection
  amount: string;
  remarks: string;
  description: string; // for "Other" fees
  paymentMode: string; // "Cash" or "UPI"
}

const emptyForm: RecordPaymentFormState = {
  studentId: "",
  date: new Date().toISOString().split("T")[0],
  feeType: "",
  month: "",
  assignmentId: "",
  amount: "",
  remarks: "",
  description: "",
  paymentMode: "",
};

function RecordPaymentTab({
  students,
  onPaymentRecorded,
}: {
  students: Student[];
  onPaymentRecorded: (receipt: ReceiptData) => void;
}) {
  const [form, setForm] = useState<RecordPaymentFormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof RecordPaymentFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedStudentId = form.studentId ? BigInt(form.studentId) : null;
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const { data: currentYearData } = useCurrentYear();
  const currentYear = currentYearData ?? BigInt(new Date().getFullYear());

  const { data: dueCard, isLoading: dueCardLoading } = useDueCard(
    selectedStudentId,
    currentYear,
  );
  const { data: soloRegs = [], isLoading: soloLoading } =
    useSoloRegistrationsForStudent(selectedStudentId);
  const { data: feeAssignmentPayments = [], isLoading: feeAsgLoading } =
    useGetAllFeeAssignmentPaymentsForStudent(selectedStudentId);
  const { data: allAssignments = [] } = useAllFeeAssignments();
  const { data: batches = [] } = useAllBatches();

  const recordPayment = useRecordFeePayment();

  // ── Smart fee type computation ──────────────────────────────────────────────

  const studentBatch = selectedStudent?.currentBatchId
    ? batches.find((b) => b.id === selectedStudent.currentBatchId)
    : null;

  // Unpaid monthly entries
  const unpaidMonths = useMemo(() => {
    if (!dueCard) return [];
    return dueCard.monthlyEntries.filter((e) => e.dueAmount > e.paidAmount);
  }, [dueCard]);

  // Unpaid puja assignments for student
  const unpaidPujaAssignments = useMemo(() => {
    const unpaidIds = new Set(
      feeAssignmentPayments
        .filter((p) => !p.isPaid)
        .map((p) => p.assignmentId.toString()),
    );
    return allAssignments.filter(
      (a) =>
        (a.feeType as string) === FeeAssignmentType.puja &&
        unpaidIds.has(a.id.toString()),
    );
  }, [feeAssignmentPayments, allAssignments]);

  // Unpaid annual day assignments for student
  const unpaidAnnualDayAssignments = useMemo(() => {
    const unpaidIds = new Set(
      feeAssignmentPayments
        .filter((p) => !p.isPaid)
        .map((p) => p.assignmentId.toString()),
    );
    return allAssignments.filter(
      (a) =>
        (a.feeType as string) === FeeAssignmentType.annualDay &&
        unpaidIds.has(a.id.toString()),
    );
  }, [feeAssignmentPayments, allAssignments]);

  // Available fee types for this student
  const availableFeeTypes = useMemo(() => {
    if (!selectedStudentId) return [];
    const types: { value: string; label: string }[] = [];

    // Monthly
    if (unpaidMonths.length > 0) {
      types.push({ value: "Monthly", label: "Monthly Fees" });
    }

    // Solo
    const hasUnpaidSolo = soloRegs.some((r) => !r.isPaid);
    if (hasUnpaidSolo) {
      types.push({ value: "Solo", label: "Solo Programme Fees" });
    }

    // Puja
    if (unpaidPujaAssignments.length > 0) {
      types.push({ value: "Puja", label: "Puja Fees" });
    }

    // Annual Day
    if (unpaidAnnualDayAssignments.length > 0) {
      types.push({ value: "AnnualDay", label: "Annual Day Fees" });
    }

    // Previous Year Dues
    if (dueCard && dueCard.openingBalance > BigInt(0)) {
      types.push({ value: "PreviousYearDues", label: "Previous Year Dues" });
    }

    // Admission — if student has admissionFees > 0 and hasn't paid it yet
    if (selectedStudent && selectedStudent.admissionFees > BigInt(0)) {
      types.push({ value: "Admission", label: "Admission Fees" });
    }

    // Other — always shown
    types.push({ value: "Other", label: "Other" });

    return types;
  }, [
    selectedStudentId,
    unpaidMonths,
    soloRegs,
    unpaidPujaAssignments,
    unpaidAnnualDayAssignments,
    dueCard,
    selectedStudent,
  ]);

  const isLoadingDues =
    !!selectedStudentId && (dueCardLoading || soloLoading || feeAsgLoading);

  // ── Auto-fill amount (derived, not effect-driven) ───────────────────────────
  // Compute suggested amount for the current fee type selection
  const suggestedAmount = useMemo(() => {
    if (!form.feeType || !form.studentId) return "";
    if (form.feeType === "Monthly" && studentBatch) {
      return studentBatch.monthlyFees.toString();
    }
    if (
      (form.feeType === "Puja" || form.feeType === "AnnualDay") &&
      form.assignmentId
    ) {
      const asg = allAssignments.find(
        (a) => a.id.toString() === form.assignmentId,
      );
      return asg ? asg.amount.toString() : "";
    }
    if (form.feeType === "PreviousYearDues" && dueCard) {
      return dueCard.openingBalance.toString();
    }
    if (form.feeType === "Admission" && selectedStudent) {
      return selectedStudent.admissionFees.toString();
    }
    return "";
  }, [
    form.feeType,
    form.assignmentId,
    form.studentId,
    studentBatch,
    allAssignments,
    dueCard,
    selectedStudent,
  ]);

  // effective amount: use user override if set, else suggested
  const effectiveAmount = form.amount || suggestedAmount;

  const feeTypeLabel =
    availableFeeTypes.find((f) => f.value === form.feeType)?.label ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.studentId) return toast.error("Please select a student");
    if (!form.feeType) return toast.error("Please select a fee type");
    if (!effectiveAmount || Number(effectiveAmount) <= 0)
      return toast.error("Please enter a valid amount");
    if (!form.date) return toast.error("Please enter a payment date");
    if (!form.paymentMode)
      return toast.error("Please select payment mode (Cash or UPI)");
    if (form.feeType === "Monthly" && !form.month)
      return toast.error("Please select a month for monthly fee");
    if (
      (form.feeType === "Puja" || form.feeType === "AnnualDay") &&
      !form.assignmentId
    )
      return toast.error("Please select which fee assignment to pay");
    if (form.feeType === "Other" && !form.description.trim())
      return toast.error("Please enter a description for Other fees");

    let month: bigint | null = null;
    let year: bigint | null = null;

    if (form.feeType === "Monthly") {
      month = BigInt(form.month);
      year = currentYear;
    }

    // Build remarks: for Puja/AnnualDay, append assignment name; for Other, append description
    let remarks = form.remarks;
    if (form.feeType === "Puja" || form.feeType === "AnnualDay") {
      const asgName =
        allAssignments.find((a) => a.id.toString() === form.assignmentId)
          ?.name ?? "";
      if (asgName) remarks = remarks ? `${asgName} — ${remarks}` : asgName;
    }
    if (form.feeType === "Other" && form.description.trim()) {
      remarks = form.description.trim() + (remarks ? ` — ${remarks}` : "");
    }

    try {
      const receiptNumber = await recordPayment.mutateAsync({
        studentId: BigInt(form.studentId),
        date: form.date,
        feeType: form.feeType,
        amount: BigInt(effectiveAmount),
        remarks,
        month,
        year,
        paymentMode: form.paymentMode,
      });

      const receiptData: ReceiptData = {
        receiptNumber,
        date: form.date,
        studentName: selectedStudent?.name ?? "",
        guardianName: `${selectedStudent?.fatherName ?? ""} / ${selectedStudent?.motherName ?? ""}`,
        feeType: form.feeType,
        feeTypeLabel,
        month: form.month ? Number(form.month) : undefined,
        year: form.month ? Number(currentYear) : undefined,
        amount: BigInt(effectiveAmount),
        remarks: form.remarks,
        description: form.feeType === "Other" ? form.description : undefined,
        paymentMode: form.paymentMode,
      };

      toast.success(
        `Payment recorded. Receipt #${String(receiptNumber).padStart(4, "0")}`,
      );
      onPaymentRecorded(receiptData);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm(emptyForm);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const activeStudents = students.filter((s) => s.isActive);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3">
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-5 space-y-5"
        >
          <h2 className="font-display font-semibold text-foreground text-base">
            Record Payment
          </h2>

          {/* Step 1: Student */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">
              Student *
            </Label>
            <StudentCombobox
              students={activeStudents}
              selectedId={form.studentId}
              onSelect={(id) => {
                setForm((prev) => ({
                  ...emptyForm,
                  date: prev.date,
                  studentId: id,
                }));
              }}
            />
          </div>

          {/* Loading dues indicator */}
          {isLoadingDues && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading due information...
            </div>
          )}

          {/* Step 2: Fee Type (smart filtered) */}
          {form.studentId && !isLoadingDues && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Payment Date */}
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">
                    Payment Date *
                  </Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                {/* Fee Type */}
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Fee Type *</Label>
                  {availableFeeTypes.length === 0 ? (
                    <div className="flex items-center gap-2 h-9 px-3 bg-success/10 border border-success/25 rounded-md text-sm text-success">
                      <CheckCircle className="w-3.5 h-3.5" />
                      No dues pending
                    </div>
                  ) : (
                    <Select
                      value={form.feeType}
                      onValueChange={(v) => {
                        setForm((prev) => ({
                          ...prev,
                          feeType: v,
                          month: "",
                          assignmentId: "",
                          amount: "", // clear override so suggestedAmount takes over
                          description: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {availableFeeTypes.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              {form.feeType && (
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">
                    Payment Mode *
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => set("paymentMode", "Cash")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        form.paymentMode === "Cash"
                          ? "bg-primary text-primary-foreground border-primary shadow-glow"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => set("paymentMode", "UPI")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        form.paymentMode === "UPI"
                          ? "bg-primary text-primary-foreground border-primary shadow-glow"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      UPI
                    </button>
                  </div>
                </div>
              )}

              {/* Monthly sub-dropdown */}
              {form.feeType === "Monthly" && (
                <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">
                      Select Month *
                    </Label>
                    <Select
                      value={form.month}
                      onValueChange={(v) => set("month", v)}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Choose unpaid month..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {unpaidMonths.map((e) => (
                          <SelectItem
                            key={e.month.toString()}
                            value={e.month.toString()}
                          >
                            {MONTHS[Number(e.month) - 1]}{" "}
                            {currentYear.toString()}
                            <span className="text-warning ml-2 text-xs">
                              (Due: ₹{(e.dueAmount - e.paidAmount).toString()})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {studentBatch && (
                    <p className="text-xs text-muted-foreground">
                      Batch: {studentBatch.name} — Monthly fee:{" "}
                      <strong className="text-foreground">
                        ₹{studentBatch.monthlyFees.toString()}
                      </strong>
                    </p>
                  )}
                </div>
              )}

              {/* Puja / AnnualDay sub-dropdown */}
              {(form.feeType === "Puja" || form.feeType === "AnnualDay") && (
                <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-1.5">
                  <Label className="text-foreground text-sm">
                    Select {form.feeType === "Puja" ? "Puja" : "Annual Day"} *
                  </Label>
                  <Select
                    value={form.assignmentId}
                    onValueChange={(v) => {
                      set("assignmentId", v);
                      set("amount", ""); // clear override so suggestedAmount takes over
                    }}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Choose assignment..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {(form.feeType === "Puja"
                        ? unpaidPujaAssignments
                        : unpaidAnnualDayAssignments
                      ).map((a) => (
                        <SelectItem
                          key={a.id.toString()}
                          value={a.id.toString()}
                        >
                          {a.name}
                          <span className="text-muted-foreground ml-2 text-xs">
                            ₹{a.amount.toString()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Admission fee status */}
              {form.feeType === "Admission" && selectedStudent && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border ${
                    selectedStudent.admissionFees > BigInt(0)
                      ? "bg-warning/10 border-warning/25 text-warning"
                      : "bg-muted/20 border-border text-muted-foreground"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {selectedStudent.admissionFees > BigInt(0) ? (
                    <span>
                      Admission fee of ₹
                      {selectedStudent.admissionFees.toString()} is pending
                    </span>
                  ) : (
                    <span>No admission fee recorded for this student</span>
                  )}
                </div>
              )}

              {/* Other description */}
              {form.feeType === "Other" && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">
                    Description *
                  </Label>
                  <Input
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="e.g. Costume Fees, Competition Entry..."
                    className="bg-input border-border"
                  />
                </div>
              )}

              {/* Amount */}
              {form.feeType && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">
                    Amount (₹) *
                    {suggestedAmount && !form.amount && (
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        (auto-filled)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={effectiveAmount}
                    onChange={(e) => set("amount", e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    className="bg-input border-border text-lg font-semibold"
                  />
                </div>
              )}

              {/* Remarks */}
              {form.feeType && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">
                    Remarks{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    value={form.remarks}
                    onChange={(e) => set("remarks", e.target.value)}
                    placeholder="Optional remarks..."
                    className="bg-input border-border"
                  />
                </div>
              )}

              {/* Submit */}
              {form.feeType && availableFeeTypes.length > 0 && (
                <Button
                  type="submit"
                  disabled={recordPayment.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11"
                >
                  {recordPayment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : submitted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {recordPayment.isPending
                    ? "Recording..."
                    : submitted
                      ? "Recorded!"
                      : "Record Payment"}
                </Button>
              )}
            </>
          )}
        </form>
      </div>

      {/* Summary Panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Payment preview */}
        {form.studentId && form.feeType && effectiveAmount && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
            <h3 className="font-display font-semibold text-primary text-sm">
              Payment Preview
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student</span>
                <span className="text-foreground font-medium">
                  {selectedStudent?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Type</span>
                <span className="text-foreground">{feeTypeLabel}</span>
              </div>
              {form.feeType === "Monthly" && form.month && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="text-foreground">
                    {MONTHS[Number(form.month) - 1]} {currentYear.toString()}
                  </span>
                </div>
              )}
              {(form.feeType === "Puja" || form.feeType === "AnnualDay") &&
                form.assignmentId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment</span>
                    <span className="text-foreground text-xs text-right max-w-[60%]">
                      {allAssignments.find(
                        (a) => a.id.toString() === form.assignmentId,
                      )?.name ?? ""}
                    </span>
                  </div>
                )}
              {form.feeType === "Other" && form.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-foreground text-xs text-right max-w-[60%]">
                    {form.description}
                  </span>
                </div>
              )}
              {form.paymentMode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      form.paymentMode === "Cash"
                        ? "bg-green-500/15 text-green-600"
                        : "bg-blue-500/15 text-blue-600"
                    }`}
                  >
                    {form.paymentMode === "Cash" ? "💵 Cash" : "📱 UPI"}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-primary/20 pt-1.5 mt-1.5">
                <span className="text-muted-foreground font-medium">
                  Amount
                </span>
                <span className="text-primary font-bold text-base">
                  ₹{effectiveAmount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Opening balance breakdown (from year changeover) */}
        {selectedStudentId && dueCard && dueCard.openingBalance > BigInt(0) && (
          <OpeningBalanceBreakdown
            studentId={selectedStudentId}
            year={currentYear}
            openingBalance={dueCard.openingBalance}
          />
        )}

        {/* Dues summary */}
        {form.studentId && !isLoadingDues && availableFeeTypes.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-display font-semibold text-foreground text-sm">
              Outstanding Dues
            </h3>
            <div className="space-y-1.5">
              {availableFeeTypes
                .filter((ft) => ft.value !== "Other")
                .map((ft) => (
                  <div
                    key={ft.value}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      form.feeType === ft.value
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-muted-foreground bg-secondary/40"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        form.feeType === ft.value ? "bg-primary" : "bg-warning"
                      }`}
                    />
                    {ft.label}
                  </div>
                ))}
            </div>
          </div>
        )}

        {form.studentId &&
          !isLoadingDues &&
          availableFeeTypes.length === 1 &&
          availableFeeTypes[0].value === "Other" && (
            <div className="bg-success/10 border border-success/25 rounded-lg p-4 flex items-center gap-2 text-sm text-success">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              All regular dues are cleared for this student.
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Payment Mode Badge ────────────────────────────────────────────────────────

function PaymentModeBadge({ mode }: { mode: string }) {
  if (!mode) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        mode === "Cash"
          ? "bg-green-500/15 text-green-600"
          : "bg-blue-500/15 text-blue-600"
      }`}
    >
      {mode === "Cash" ? (
        <Banknote className="w-2.5 h-2.5" />
      ) : (
        <Smartphone className="w-2.5 h-2.5" />
      )}
      {mode}
    </span>
  );
}

// ─── Payment History Tab ───────────────────────────────────────────────────────

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

function PaymentHistoryTab({ students }: { students: Student[] }) {
  const [historySubTab, setHistorySubTab] = useState<"perStudent" | "last20">(
    "perStudent",
  );
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [printReceipt, setPrintReceipt] = useState<ReceiptData | null>(null);

  // Per-student
  const studentId = selectedStudentId ? BigInt(selectedStudentId) : null;
  const { data: payments = [], isLoading } =
    useGetPaymentsForStudent(studentId);

  const selectedStudent = students.find(
    (s) => s.id.toString() === selectedStudentId,
  );

  // All payments (last 20)
  const { data: allPayments = [], isLoading: allLoading } = useGetAllPayments();
  const last20 = [...allPayments]
    .sort((a, b) => Number(b.receiptNumber - a.receiptNumber))
    .slice(0, 20);

  // Sort newest-first by receiptNumber
  const sortedPayments = [...payments].sort((a, b) =>
    Number(b.receiptNumber - a.receiptNumber),
  );

  const handlePrintFromHistory = (payment: FeePayment, student?: Student) => {
    const s = student ?? students.find((st) => st.id === payment.studentId);
    if (!s) return;
    setPrintReceipt({
      receiptNumber: payment.receiptNumber,
      date: payment.date,
      studentName: s.name,
      guardianName: `${s.fatherName} / ${s.motherName}`,
      feeType: payment.feeType,
      feeTypeLabel: feeTypeLabel(payment.feeType),
      month: payment.month !== undefined ? Number(payment.month) : undefined,
      year: payment.year !== undefined ? Number(payment.year) : undefined,
      amount: payment.amount,
      remarks: payment.remarks,
      paymentMode: payment.paymentMode ?? "",
    });
  };

  const activeStudents = students.filter((s) => s.isActive);

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setHistorySubTab("perStudent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            historySubTab === "perStudent"
              ? "bg-primary text-primary-foreground border-primary shadow-glow"
              : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          Per Student
        </button>
        <button
          type="button"
          onClick={() => setHistorySubTab("last20")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            historySubTab === "last20"
              ? "bg-primary text-primary-foreground border-primary shadow-glow"
              : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          Last 20 Transactions
        </button>
      </div>

      {/* ── Per Student Tab ── */}
      {historySubTab === "perStudent" && (
        <>
          {/* Student picker */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h2 className="font-display font-semibold text-foreground text-base">
              View Payment History
            </h2>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Select Student</Label>
              <StudentCombobox
                students={activeStudents}
                selectedId={selectedStudentId}
                onSelect={setSelectedStudentId}
                placeholder="Search student by name..."
              />
            </div>
          </div>

          {/* Payment list */}
          {selectedStudentId && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground text-sm">
                  Payments for {selectedStudent?.name}
                </h3>
                {!isLoading && (
                  <Badge
                    variant="outline"
                    className="text-xs border-border text-muted-foreground"
                  >
                    {sortedPayments.length} record
                    {sortedPayments.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-md" />
                  ))}
                </div>
              ) : sortedPayments.length === 0 ? (
                <div className="p-10 text-center">
                  <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No payment records found for this student.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedPayments.map((payment) => (
                    <div
                      key={payment.receiptNumber.toString()}
                      className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                    >
                      {/* Receipt # */}
                      <div className="w-14 flex-shrink-0">
                        <span className="text-xs font-mono text-primary font-bold">
                          #{String(payment.receiptNumber).padStart(4, "0")}
                        </span>
                      </div>

                      {/* Date */}
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                        {payment.date}
                      </span>

                      {/* Fee type */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {feeTypeLabel(payment.feeType)}
                        </p>
                        {payment.month !== undefined &&
                          payment.year !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {MONTHS[Number(payment.month) - 1]}{" "}
                              {payment.year.toString()}
                            </p>
                          )}
                        {payment.remarks && (
                          <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                            {payment.remarks}
                          </p>
                        )}
                      </div>

                      {/* Payment mode badge */}
                      <PaymentModeBadge mode={payment.paymentMode ?? ""} />

                      {/* Amount */}
                      <span className="text-base font-bold text-primary">
                        ₹{payment.amount.toString()}
                      </span>

                      {/* Print button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handlePrintFromHistory(payment, selectedStudent)
                        }
                        className="h-8 w-8 p-0 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 flex-shrink-0"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Last 20 Transactions Tab ── */}
      {historySubTab === "last20" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground text-sm">
              Last 20 Transactions
            </h3>
            {!allLoading && (
              <Badge
                variant="outline"
                className="text-xs border-border text-muted-foreground"
              >
                {last20.length} shown
              </Badge>
            )}
          </div>

          {allLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : last20.length === 0 ? (
            <div className="p-10 text-center">
              <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No payments recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {last20.map((payment) => {
                const student = students.find(
                  (s) => s.id === payment.studentId,
                );
                return (
                  <div
                    key={payment.receiptNumber.toString()}
                    className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Receipt # */}
                    <div className="w-14 flex-shrink-0">
                      <span className="text-xs font-mono text-primary font-bold">
                        #{String(payment.receiptNumber).padStart(4, "0")}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                      {payment.date}
                    </span>

                    {/* Student + fee type */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student?.name ?? `Student #${payment.studentId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feeTypeLabel(payment.feeType)}
                        {payment.month !== undefined &&
                          payment.year !== undefined &&
                          ` · ${MONTHS[Number(payment.month) - 1]} ${payment.year}`}
                      </p>
                    </div>

                    {/* Payment mode badge */}
                    <PaymentModeBadge mode={payment.paymentMode ?? ""} />

                    {/* Amount */}
                    <span className="text-base font-bold text-primary">
                      ₹{payment.amount.toString()}
                    </span>

                    {/* Print button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePrintFromHistory(payment, student)}
                      className="h-8 w-8 p-0 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 flex-shrink-0"
                      title="Print Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Receipt print dialog */}
      {printReceipt && (
        <ReceiptPrintDialog
          receipt={printReceipt}
          onClose={() => setPrintReceipt(null)}
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FeeCollectionPage() {
  const { data: students = [] } = useAllStudents();
  const [printReceipt, setPrintReceipt] = useState<ReceiptData | null>(null);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Fee Collection
        </h1>
        <p className="text-muted-foreground text-sm">
          Record payments and view student payment history
        </p>
      </div>

      <Tabs defaultValue="record" className="space-y-5">
        <TabsList className="bg-secondary border border-border p-1 h-auto gap-1">
          <TabsTrigger
            value="record"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Record Payment
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <RecordPaymentTab
            students={students}
            onPaymentRecorded={(receipt) => setPrintReceipt(receipt)}
          />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistoryTab students={students} />
        </TabsContent>
      </Tabs>

      {/* Receipt print dialog (after recording payment) */}
      {printReceipt && (
        <ReceiptPrintDialog
          receipt={printReceipt}
          onClose={() => setPrintReceipt(null)}
        />
      )}
    </div>
  );
}
