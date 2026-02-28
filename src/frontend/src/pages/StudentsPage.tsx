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
import {
  ChevronDown,
  ClipboardList,
  Edit2,
  Plus,
  Search,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Batch, Student } from "../backend.d.ts";
import DueCardModal from "../components/DueCardModal";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllBatches,
  useAllStudents,
  useAssignBatch,
  useCreateStudent,
  useMarkStudentInactive,
  useUpdateStudent,
} from "../hooks/useQueries";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const GUARDIAN_REL_OPTIONS = ["Father", "Mother", "Self", "Other"];

interface StudentFormData {
  name: string;
  dateOfAdmission: string; // kept for display / create only
  age: string;
  gender: string;
  contactNumber: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  admissionFees: string;
}

const emptyForm: StudentFormData = {
  name: "",
  dateOfAdmission: "",
  age: "",
  gender: "",
  contactNumber: "",
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  admissionFees: "",
};

function StudentFormDialog({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student?: Student;
}) {
  const [form, setForm] = useState<StudentFormData>(
    student
      ? {
          name: student.name,
          dateOfAdmission: student.dateOfAdmission,
          age: student.age.toString(),
          gender: student.gender,
          contactNumber: student.contactNumber,
          guardianName: student.guardianName,
          guardianRelationship: student.guardianRelationship,
          guardianPhone: student.guardianPhone,
          admissionFees: "",
        }
      : emptyForm,
  );

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isPending = createStudent.isPending || updateStudent.isPending;

  const set = (field: keyof StudentFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Student name is required");
    if (!form.dateOfAdmission)
      return toast.error("Date of admission is required");
    if (!form.guardianName.trim())
      return toast.error("Guardian name is required");

    try {
      if (student) {
        await updateStudent.mutateAsync({
          studentId: student.id,
          name: form.name.trim(),
          age: BigInt(form.age || "0"),
          gender: form.gender,
          contactNumber: form.contactNumber,
          guardianName: form.guardianName.trim(),
          guardianRelationship: form.guardianRelationship,
          guardianPhone: form.guardianPhone,
        });
        toast.success("Student updated successfully");
      } else {
        await createStudent.mutateAsync({
          name: form.name.trim(),
          dateOfAdmission: form.dateOfAdmission,
          age: BigInt(form.age || "0"),
          gender: form.gender,
          contactNumber: form.contactNumber,
          guardianName: form.guardianName.trim(),
          guardianRelationship: form.guardianRelationship,
          guardianPhone: form.guardianPhone,
          admissionFees: BigInt(form.admissionFees || "0"),
        });
        toast.success("Student registered successfully");
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
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {student ? "Edit Student" : "Register New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">Student Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Date of Admission *
              </Label>
              <Input
                type="date"
                value={form.dateOfAdmission}
                onChange={(e) => set("dateOfAdmission", e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Age</Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="Age"
                min="1"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => set("gender", v)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Contact Number</Label>
              <Input
                value={form.contactNumber}
                onChange={(e) => set("contactNumber", e.target.value)}
                placeholder="Student's phone"
                className="bg-input border-border"
              />
            </div>
            <div className="col-span-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                Guardian Details
              </p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">Guardian Name *</Label>
              <Input
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
                placeholder="Guardian's full name"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Relationship</Label>
              <Select
                value={form.guardianRelationship}
                onValueChange={(v) => set("guardianRelationship", v)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Relationship" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GUARDIAN_REL_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Guardian Phone</Label>
              <Input
                value={form.guardianPhone}
                onChange={(e) => set("guardianPhone", e.target.value)}
                placeholder="Guardian's phone"
                className="bg-input border-border"
              />
            </div>
            {/* Admission Fees — only for new student registration */}
            {!student && (
              <div className="col-span-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                  Fee Details
                </p>
              </div>
            )}
            {!student && (
              <div className="col-span-2 space-y-1.5">
                <Label className="text-foreground text-sm">
                  Admission Fees (₹)
                </Label>
                <Input
                  type="number"
                  value={form.admissionFees}
                  onChange={(e) => set("admissionFees", e.target.value)}
                  placeholder="e.g. 500"
                  min="0"
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  This will appear as a pending due in Fee Collection.
                </p>
              </div>
            )}
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
              {student ? "Update" : "Register"} Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignBatchDialog({
  student,
  batches,
  onClose,
}: {
  student: Student;
  batches: Batch[];
  onClose: () => void;
}) {
  const [selectedBatch, setSelectedBatch] = useState<string>(
    student.currentBatchId?.toString() ?? "",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const assignBatch = useAssignBatch();

  const handleAssign = async () => {
    if (!selectedBatch) return toast.error("Please select a batch");
    try {
      await assignBatch.mutateAsync({
        studentId: student.id,
        batchId: BigInt(selectedBatch),
        startDate,
      });
      toast.success("Batch assigned successfully");
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
            Assign / Change Batch — {student.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Select Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Choose a batch" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {batches.map((b) => (
                  <SelectItem key={b.id.toString()} value={b.id.toString()}>
                    {b.name} ({b.startTime}–{b.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">
              Effective From Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              Fees will be adjusted from this date. Previous batch history is
              preserved.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignBatch.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {assignBatch.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [inactiveStudent, setInactiveStudentState] = useState<Student | null>(
    null,
  );
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [dueCardStudent, setDueCardStudent] = useState<Student | null>(null);

  const { isAdmin } = useAuth();
  const { data: students = [], isLoading } = useAllStudents();
  const { data: batches = [] } = useAllBatches();
  const markInactiveMutation = useMarkStudentInactive();

  const filteredStudents = students.filter(
    (s) =>
      s.isActive &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase())),
  );

  const getBatchName = (batchId?: bigint) => {
    if (!batchId) return null;
    return batches.find((b) => b.id === batchId)?.name ?? null;
  };

  const handleMarkInactive = async () => {
    if (!inactiveStudent) return;
    try {
      await markInactiveMutation.mutateAsync(inactiveStudent.id);
      toast.success(`${inactiveStudent.name} marked as inactive`);
      setInactiveStudentState(null);
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
            Students
          </h1>
          <p className="text-muted-foreground text-sm">
            {students.filter((s) => s.isActive).length} active student
            {students.filter((s) => s.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or guardian..."
          className="pl-9 bg-card border-border"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">
            {search
              ? "No students match your search"
              : "No students registered yet"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {!search && "Click 'Add Student' to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((student) => {
            const batchName = getBatchName(student.currentBatchId);
            return (
              <div
                key={student.id.toString()}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Student info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-primary text-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {student.name}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {student.guardianName} ({student.guardianRelationship})
                        · {student.guardianPhone}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-nowrap">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Adm: {student.dateOfAdmission}
                    </span>
                    {batchName ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {batchName}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        No Batch
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDueCardStudent(student)}
                      className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs gap-1"
                      title="View Due Card"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Due Card</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignStudent(student)}
                      className="text-muted-foreground hover:text-primary h-8 px-2 text-xs gap-1"
                      title="Assign Batch"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Batch</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditStudent(student)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInactiveStudentState(student)}
                        className="text-muted-foreground hover:text-warning h-8 w-8 p-0"
                        title="Mark Inactive"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      {(formOpen || editStudent) && (
        <StudentFormDialog
          open={formOpen || !!editStudent}
          onClose={() => {
            setFormOpen(false);
            setEditStudent(null);
          }}
          student={editStudent ?? undefined}
        />
      )}

      {/* Assign Batch Dialog */}
      {assignStudent && (
        <AssignBatchDialog
          student={assignStudent}
          batches={batches}
          onClose={() => setAssignStudent(null)}
        />
      )}

      {/* Mark Inactive Confirmation */}
      <AlertDialog
        open={!!inactiveStudent}
        onOpenChange={(o) => !o && setInactiveStudentState(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Mark Student Inactive?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will mark{" "}
              <strong className="text-foreground">
                {inactiveStudent?.name}
              </strong>{" "}
              as inactive. All their fee history, due cards, and records will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkInactive}
              className="bg-warning/90 text-warning-foreground hover:bg-warning"
            >
              Mark Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Due Card Modal */}
      {dueCardStudent && (
        <DueCardModal
          student={dueCardStudent}
          onClose={() => setDueCardStudent(null)}
        />
      )}
    </div>
  );
}
