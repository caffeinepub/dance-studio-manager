import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SoloProgramme, SoloRegistration, Student } from "../backend.d.ts";
import {
  useAllSoloProgrammes,
  useAllSoloRegistrations,
  useAllStudents,
  useCreateSoloProgramme,
  useMarkSoloComplete,
  useRegisterStudentForSolo,
} from "../hooks/useQueries";

function CreateProgrammeDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const createSolo = useCreateSoloProgramme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Programme name is required");
    if (!form.startDate || !form.endDate)
      return toast.error("Start and end dates are required");

    try {
      await createSolo.mutateAsync({
        name: form.name.trim(),
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success("Solo Programme created");
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            New Solo Programme
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Programme Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Annual Day Preparation"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Brief description..."
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">End Date *</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endDate: e.target.value }))
                }
                className="bg-input border-border"
              />
            </div>
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
              disabled={createSolo.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createSolo.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Programme
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RegisterStudentDialog({
  programme,
  students,
  onClose,
}: {
  programme: SoloProgramme;
  students: Student[];
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const registerSolo = useRegisterStudentForSolo();

  const activeStudents = students.filter((s) => s.isActive);

  const handleRegister = async () => {
    if (!selectedStudent) return toast.error("Please select a student");
    if (!feeAmount) return toast.error("Please enter fee amount");

    try {
      await registerSolo.mutateAsync({
        studentId: BigInt(selectedStudent),
        programmeId: programme.id,
        feeAmount: BigInt(feeAmount),
      });
      toast.success("Student registered for solo programme");
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
          <DialogTitle className="font-display text-foreground text-base">
            Register Student
          </DialogTitle>
          <p className="text-muted-foreground text-sm">{programme.name}</p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Choose student" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                {activeStudents.map((s) => (
                  <SelectItem key={s.id.toString()} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">
              Solo Programme Fee (₹)
            </Label>
            <Input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              placeholder="Custom fee for this student"
              min="0"
              className="bg-input border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleRegister}
            disabled={registerSolo.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {registerSolo.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgrammeStudentList({
  programme,
  registrations,
  students,
}: {
  programme: SoloProgramme;
  registrations: SoloRegistration[];
  students: Student[];
}) {
  const markComplete = useMarkSoloComplete();

  const progRegistrations = registrations.filter(
    (r) => r.programmeId.toString() === programme.id.toString(),
  );

  if (progRegistrations.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground italic text-center py-1">
          No students registered yet
        </p>
      </div>
    );
  }

  const handleMarkComplete = async (reg: SoloRegistration) => {
    try {
      await markComplete.mutateAsync({
        studentId: reg.studentId,
        programmeId: reg.programmeId,
      });
      toast.success("Student marked as complete and deactivated");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Registered Students ({progRegistrations.length})
      </p>
      {progRegistrations.map((reg) => {
        const student = students.find(
          (s) => s.id.toString() === reg.studentId.toString(),
        );
        const canMarkComplete = reg.isPaid && !reg.isCompleted;
        return (
          <div
            key={reg.studentId.toString()}
            className="flex items-center justify-between gap-2 bg-secondary/40 rounded-md px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs font-bold">
                  {(student?.name ?? "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {student?.name ?? `Student #${reg.studentId.toString()}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  ₹{reg.feeAmount.toString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge
                variant="outline"
                className={
                  reg.isPaid
                    ? "text-xs border-success/40 text-success bg-success/10"
                    : "text-xs border-warning/40 text-warning bg-warning/10"
                }
              >
                {reg.isPaid ? "Paid" : "Unpaid"}
              </Badge>
              {reg.isCompleted ? (
                <Badge
                  variant="outline"
                  className="text-xs border-muted text-muted-foreground"
                >
                  Completed
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkComplete(reg)}
                  disabled={!canMarkComplete || markComplete.isPending}
                  className={`h-7 px-2 text-xs gap-1 ${
                    canMarkComplete
                      ? "text-success hover:text-success hover:bg-success/10 border border-success/30"
                      : "text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                  title={
                    canMarkComplete
                      ? "Mark as complete (will deactivate student)"
                      : "Payment must be recorded first"
                  }
                >
                  {markComplete.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Complete
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SoloProgrammesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [registerProg, setRegisterProg] = useState<SoloProgramme | null>(null);

  const { data: programmes = [], isLoading } = useAllSoloProgrammes();
  const { data: registrations = [] } = useAllSoloRegistrations();
  const { data: students = [] } = useAllStudents();

  const isActive = (prog: SoloProgramme) => {
    const today = new Date().toISOString().split("T")[0];
    return prog.startDate <= today && prog.endDate >= today;
  };

  const isPast = (prog: SoloProgramme) => {
    const today = new Date().toISOString().split("T")[0];
    return prog.endDate < today;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Solo Programmes
          </h1>
          <p className="text-muted-foreground text-sm">
            Special programmes for individual student performance
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Programme
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent-foreground/80">
        <strong className="text-accent">Note:</strong> Students can register for
        Solo Programmes while remaining in their regular batch, or even without
        being in any batch. Each registration can have its own flexible fee.
        Mark Complete is enabled only after fee payment is recorded.
      </div>

      {/* Programme list */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : programmes.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No solo programmes yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Create a programme for special individual performances
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {programmes.map((prog) => {
            const active = isActive(prog);
            const past = isPast(prog);
            const progRegs = registrations.filter(
              (r) => r.programmeId.toString() === prog.id.toString(),
            );
            return (
              <div
                key={prog.id.toString()}
                className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all duration-200 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-foreground text-base">
                        {prog.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={
                          active
                            ? "text-primary border-primary/30 bg-primary/10 text-xs"
                            : past
                              ? "text-muted-foreground border-border text-xs"
                              : "text-accent border-accent/30 bg-accent/10 text-xs"
                        }
                      >
                        {active ? "Active" : past ? "Completed" : "Upcoming"}
                      </Badge>
                    </div>
                    {prog.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {prog.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                  <span>
                    {prog.startDate} → {prog.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {progRegs.length}{" "}
                      {progRegs.length === 1 ? "student" : "students"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setRegisterProg(prog)}
                    className="gap-1.5 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 h-8"
                    variant="ghost"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register Student
                  </Button>
                </div>

                {/* Student registration list with payment/completion status */}
                <ProgrammeStudentList
                  programme={prog}
                  registrations={registrations}
                  students={students}
                />
              </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateProgrammeDialog onClose={() => setCreateOpen(false)} />
      )}

      {registerProg && (
        <RegisterStudentDialog
          programme={registerProg}
          students={students}
          onClose={() => setRegisterProg(null)}
        />
      )}
    </div>
  );
}
