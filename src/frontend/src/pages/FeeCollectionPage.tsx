import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllSoloRegistrations,
  useAllStudents,
  useRecordFeePayment,
} from "../hooks/useQueries";

const FEE_TYPES = [
  { value: "Admission", label: "Admission Fees" },
  { value: "Monthly", label: "Monthly Fees" },
  { value: "Solo", label: "Solo Programme Fees" },
  { value: "Puja", label: "Puja Fees" },
  { value: "AnnualDay", label: "Annual Day Fees" },
  { value: "PreviousYearDues", label: "Previous Year Dues" },
  { value: "Other", label: "Other" },
];

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

interface FeeFormData {
  studentId: string;
  date: string;
  feeType: string;
  amount: string;
  remarks: string;
  month: string;
  year: string;
}

const emptyForm: FeeFormData = {
  studentId: "",
  date: new Date().toISOString().split("T")[0],
  feeType: "",
  amount: "",
  remarks: "",
  month: "",
  year: new Date().getFullYear().toString(),
};

export default function FeeCollectionPage() {
  const [form, setForm] = useState<FeeFormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: students = [] } = useAllStudents();
  const { data: soloRegistrations = [] } = useAllSoloRegistrations();
  const recordPayment = useRecordFeePayment();

  const set = (field: keyof FeeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Only show active students
  const activeStudents = students.filter((s) => s.isActive);

  // For Solo fee type, only show students with solo registrations
  const soloStudentIds = new Set(
    soloRegistrations.map((r) => r.studentId.toString()),
  );
  const filteredStudents = activeStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    if (form.feeType === "Solo") {
      return matchesSearch && soloStudentIds.has(s.id.toString());
    }
    return matchesSearch;
  });

  const selectedStudent = activeStudents.find(
    (s) => s.id.toString() === form.studentId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.studentId) return toast.error("Please select a student");
    if (!form.feeType) return toast.error("Please select a fee type");
    if (!form.amount) return toast.error("Please enter amount");
    if (!form.date) return toast.error("Please enter date");

    let month: bigint | null = null;
    let year: bigint | null = null;

    if (form.feeType === "Monthly") {
      if (!form.month)
        return toast.error("Please select month for monthly fee");
      month = BigInt(form.month);
      year = BigInt(form.year || new Date().getFullYear());
    }

    try {
      await recordPayment.mutateAsync({
        studentId: BigInt(form.studentId),
        date: form.date,
        feeType: form.feeType,
        amount: BigInt(form.amount),
        remarks: form.remarks,
        month,
        year,
      });
      toast.success("Fee payment recorded successfully");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm(emptyForm);
      setSearch("");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const feeTypeLabel =
    FEE_TYPES.find((f) => f.value === form.feeType)?.label ?? "";

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Fee Collection
        </h1>
        <p className="text-muted-foreground text-sm">
          Record student fee payments
        </p>
      </div>

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

            {/* Student Search + Select */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Student *</Label>
              <div className="space-y-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="bg-input border-border"
                />
                {search && filteredStudents.length > 0 && !selectedStudent && (
                  <div className="bg-popover border border-border rounded-lg shadow-card overflow-hidden max-h-48 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id.toString()}
                        type="button"
                        onClick={() => {
                          set("studentId", s.id.toString());
                          setSearch(s.name);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors border-b border-border last:border-0"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {s.guardianName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedStudent && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {selectedStudent.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Adm: {selectedStudent.dateOfAdmission}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        set("studentId", "");
                        setSearch("");
                      }}
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-2 gap-4">
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
                <Select
                  value={form.feeType}
                  onValueChange={(v) => set("feeType", v)}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {FEE_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Monthly specific */}
            {form.feeType === "Monthly" && (
              <div className="grid grid-cols-2 gap-4 bg-secondary/50 p-3 rounded-lg border border-border">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Month *</Label>
                  <Select
                    value={form.month}
                    onValueChange={(v) => set("month", v)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={(i + 1).toString()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Year *</Label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                    placeholder="Year"
                    min="2020"
                    max="2100"
                    className="bg-input border-border"
                  />
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="Enter amount"
                min="0"
                className="bg-input border-border text-lg font-semibold"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="Optional remarks..."
                className="bg-input border-border"
              />
            </div>

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
          </form>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fee types guide */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-display font-semibold text-foreground text-sm mb-3">
              Fee Categories
            </h3>
            <div className="space-y-2">
              {FEE_TYPES.map((ft) => (
                <div
                  key={ft.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    form.feeType === ft.value
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      form.feeType === ft.value ? "bg-primary" : "bg-border"
                    }`}
                  />
                  {ft.label}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {form.studentId && form.feeType && form.amount && (
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
                      {MONTHS[Number(form.month) - 1]} {form.year}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-primary/20 pt-1.5 mt-1.5">
                  <span className="text-muted-foreground font-medium">
                    Amount
                  </span>
                  <span className="text-primary font-bold text-base">
                    ₹{form.amount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
