import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  Calendar,
  CheckSquare,
  Clock,
  Edit2,
  Loader2,
  Sun,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllBatches,
  useAllStudents,
  useAttendanceForBatch,
  useAttendanceForStudent,
  useIsAttendanceSubmitted,
  useMarkHoliday,
  useModifyAttendance,
  useStudentsInBatch,
  useSubmitAttendance,
} from "../hooks/useQueries";

// Local enum matching backend AttendanceStatus
const AttendanceStatus = {
  present: "present" as const,
  absent: "absent" as const,
  holiday: "holiday" as const,
};

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

// ─── Take Attendance Tab ──────────────────────────────────────────────────────

function TakeAttendanceTab() {
  const { currentUser, isAdmin } = useAuth();
  const { data: batches = [], isLoading: batchesLoading } = useAllBatches();
  const activeBatches = batches.filter((b) => b.isActive);

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [modifying, setModifying] = useState(false);

  const selectedBatch = activeBatches.find(
    (b) => b.id.toString() === selectedBatchId,
  );

  // Check if selected date is a valid class day for the batch
  const isValidClassDay = () => {
    if (!selectedBatch || !selectedDate) return false;
    const dayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();
    return selectedBatch.daysOfWeek.some((d) => Number(d) === dayOfWeek);
  };

  const { data: students = [], isLoading: studentsLoading } =
    useStudentsInBatch(selectedBatch ? selectedBatch.id : null);

  const { data: isSubmitted, isLoading: submittedLoading } =
    useIsAttendanceSubmitted(
      selectedBatch ? selectedBatch.id : null,
      selectedDate,
    );

  const { data: existingRecords = [] } = useAttendanceForBatch(
    selectedBatch ? selectedBatch.id : null,
    selectedDate,
  );

  const submitMutation = useSubmitAttendance();
  const holidayMutation = useMarkHoliday();
  const modifyMutation = useModifyAttendance();

  const isHoliday =
    existingRecords.length > 0 &&
    existingRecords.every((r) => r.status === AttendanceStatus.holiday);

  const handleToggle = (studentId: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleMarkAll = () => {
    setPresentIds(new Set(students.map((s) => s.id.toString())));
  };

  const handleClearAll = () => setPresentIds(new Set());

  const handleSubmit = async () => {
    if (!selectedBatch) return;
    try {
      await submitMutation.mutateAsync({
        batchId: selectedBatch.id,
        date: selectedDate,
        presentStudentIds: students
          .filter((s) => presentIds.has(s.id.toString()))
          .map((s) => s.id),
        submittedBy: currentUser?.username ?? "Staff",
      });
      toast.success("Attendance submitted successfully");
      setPresentIds(new Set());
      setModifying(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleMarkHoliday = async () => {
    if (!selectedBatch) return;
    try {
      await holidayMutation.mutateAsync({
        batchId: selectedBatch.id,
        date: selectedDate,
        submittedBy: currentUser?.username ?? "Staff",
      });
      toast.success("Holiday marked for this batch");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleModify = () => {
    // Pre-populate with existing present students
    const presentStudentIds = new Set(
      existingRecords
        .filter((r) => r.status === AttendanceStatus.present)
        .map((r) => r.studentId.toString()),
    );
    setPresentIds(presentStudentIds);
    setModifying(true);
  };

  const handleModifySubmit = async () => {
    if (!selectedBatch) return;
    try {
      await modifyMutation.mutateAsync({
        batchId: selectedBatch.id,
        date: selectedDate,
        presentStudentIds: students
          .filter((s) => presentIds.has(s.id.toString()))
          .map((s) => s.id),
        modifiedBy: currentUser?.username ?? "Admin",
      });
      toast.success("Attendance modified successfully");
      setModifying(false);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const isLoading =
    submitMutation.isPending ||
    holidayMutation.isPending ||
    modifyMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Batch and date selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="batch-select"
            className="text-sm font-medium text-foreground"
          >
            Batch
          </label>
          {batchesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedBatchId}
              onValueChange={(v) => {
                setSelectedBatchId(v);
                setPresentIds(new Set());
                setModifying(false);
              }}
              data-ocid="attendance.batch.select"
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {activeBatches.map((b) => (
                  <SelectItem key={b.id.toString()} value={b.id.toString()}>
                    {b.name} ({b.startTime}–{b.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="date-input"
            className="text-sm font-medium text-foreground"
          >
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPresentIds(new Set());
              setModifying(false);
            }}
            className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none"
            data-ocid="attendance.date.input"
          />
        </div>
      </div>

      {/* Batch day info */}
      {selectedBatch && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Class days:</span>
          {selectedBatch.daysOfWeek.map((d) => (
            <Badge
              key={d.toString()}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {DAYS_SHORT[Number(d)]}
            </Badge>
          ))}
          {!isValidClassDay() && selectedDate && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Not a class day
            </Badge>
          )}
        </div>
      )}

      {/* Content area */}
      {!selectedBatch ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Select a batch to take attendance
            </p>
          </CardContent>
        </Card>
      ) : !isValidClassDay() ? (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No class on this day</p>
            <p className="text-muted-foreground text-sm mt-1">
              {selectedBatch.name} doesn't have class on{" "}
              {DAYS_SHORT[new Date(`${selectedDate}T12:00:00`).getDay()]}
            </p>
          </CardContent>
        </Card>
      ) : submittedLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isSubmitted && !modifying ? (
        // Already submitted
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isHoliday ? (
                <>
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-600">Holiday</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <span className="text-green-600">Attendance Submitted</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isHoliday && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                <div className="bg-green-500/10 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">
                    {
                      existingRecords.filter(
                        (r) => r.status === AttendanceStatus.present,
                      ).length
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2">
                  <div className="text-lg font-bold text-red-600">
                    {
                      existingRecords.filter(
                        (r) => r.status === AttendanceStatus.absent,
                      ).length
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Absent</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold text-foreground">
                    {existingRecords.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              {existingRecords.map((record) => {
                const student = students.find(
                  (s) => s.id.toString() === record.studentId.toString(),
                );
                return (
                  <div
                    key={record.id.toString()}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {student?.name ?? `Student #${record.studentId}`}
                    </span>
                    <Badge
                      className={`text-xs ${
                        record.status === AttendanceStatus.present
                          ? "bg-green-500/15 text-green-700 border-green-500/30"
                          : record.status === AttendanceStatus.holiday
                            ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                            : "bg-red-500/15 text-red-700 border-red-500/30"
                      }`}
                    >
                      {record.status === AttendanceStatus.present
                        ? "P"
                        : record.status === AttendanceStatus.holiday
                          ? "H"
                          : "A"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {isAdmin && !isHoliday && (
              <Button
                variant="outline"
                className="w-full mt-3 border-primary/50 text-primary hover:bg-primary/10"
                onClick={handleModify}
                data-ocid="attendance.modify.button"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Modify Attendance (Admin)
              </Button>
            )}
          </CardContent>
        </Card>
      ) : studentsLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : students.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No students in this batch
            </p>
          </CardContent>
        </Card>
      ) : (
        // Attendance sheet
        <div className="space-y-3">
          {modifying && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Modifying submitted attendance — Admin only
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {students.length} student{students.length !== 1 ? "s" : ""} — mark
              present
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAll}
                className="text-xs h-7 border-border"
              >
                All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7 border-border"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {students.map((student, idx) => {
              const isPresent = presentIds.has(student.id.toString());
              return (
                <button
                  key={student.id.toString()}
                  type="button"
                  onClick={() => handleToggle(student.id.toString())}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                    isPresent
                      ? "bg-green-500/10 border-green-500/40 hover:bg-green-500/15"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                  data-ocid={`attendance.student.checkbox.${idx + 1}`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isPresent
                        ? "bg-green-500 border-green-500"
                        : "border-border"
                    }`}
                  >
                    {isPresent && (
                      <svg
                        aria-hidden="true"
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm text-foreground">
                      {student.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {student.fatherName}
                    </span>
                  </div>
                  <Badge
                    className={`text-xs ${
                      isPresent
                        ? "bg-green-500/15 text-green-700 border-green-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {isPresent ? "P" : "—"}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="pt-2 space-y-2">
            {!modifying && (
              <Button
                variant="outline"
                className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                onClick={handleMarkHoliday}
                disabled={isLoading}
                data-ocid="attendance.holiday.button"
              >
                {holidayMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sun className="w-4 h-4 mr-2" />
                )}
                Mark as Holiday
              </Button>
            )}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={modifying ? handleModifySubmit : handleSubmit}
              disabled={isLoading}
              data-ocid="attendance.submit.button"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckSquare className="w-4 h-4 mr-2" />
              )}
              {modifying ? "Save Changes" : "Submit Attendance"}
              {!modifying && (
                <span className="ml-2 text-xs opacity-80">
                  ({presentIds.size} present,{" "}
                  {students.length - presentIds.size} absent)
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Student Attendance View Tab ──────────────────────────────────────────────

function StudentAttendanceTab() {
  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const { data: batches = [] } = useAllBatches();
  const activeStudents = students.filter((s) => s.isActive);

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const selectedStudent = activeStudents.find(
    (s) => s.id.toString() === selectedStudentId,
  );

  const { data: attendanceRecords = [], isLoading: attendanceLoading } =
    useAttendanceForStudent(selectedStudent ? selectedStudent.id : null);

  const studentBatch = batches.find(
    (b) => selectedStudent?.currentBatchId?.toString() === b.id.toString(),
  );

  // Build calendar for the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const batchDays = new Set(
    studentBatch ? studentBatch.daysOfWeek.map(Number) : [],
  );

  // Filter attendance records for the selected month/year
  const monthRecords = attendanceRecords.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  const recordByDate: Record<
    string,
    (typeof AttendanceStatus)[keyof typeof AttendanceStatus]
  > = {};
  for (const r of monthRecords) {
    recordByDate[r.date] = r.status;
  }

  // Count stats — only for active class days
  // totalClasses tracked via presentCount + absentCount
  let presentCount = 0;
  let absentCount = 0;
  let holidayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = date.getDay();
    if (batchDays.has(dayOfWeek)) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const status = recordByDate[dateStr];
      if (status === AttendanceStatus.present) {
        presentCount++;
      } else if (status === AttendanceStatus.absent) {
        absentCount++;
      } else if (status === AttendanceStatus.holiday) {
        holidayCount++;
        // holidays don't count as class days missed
      }
    }
  }

  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1 space-y-1.5">
          <label
            htmlFor="student-select"
            className="text-sm font-medium text-foreground"
          >
            Student
          </label>
          {studentsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              data-ocid="attendance.student.select"
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {activeStudents.map((s) => (
                  <SelectItem key={s.id.toString()} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="month-select"
            className="text-sm font-medium text-foreground"
          >
            Month
          </label>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="year-select"
            className="text-sm font-medium text-foreground"
          >
            Year
          </label>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedStudent ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Select a student to view attendance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Student info */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {selectedStudent.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {studentBatch ? studentBatch.name : "No batch assigned"}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-card border border-border rounded-lg p-2">
              <div className="text-lg font-bold text-foreground">
                {presentCount + absentCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Classes</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600">
                {presentCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Present</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <div className="text-lg font-bold text-red-600">
                {absentCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Absent</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <div className="text-lg font-bold text-amber-600">
                {holidayCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Holidays</div>
            </div>
          </div>

          {presentCount + absentCount > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Attended{" "}
              <span className="font-semibold text-foreground">
                {presentCount}
              </span>{" "}
              out of{" "}
              <span className="font-semibold text-foreground">
                {presentCount + absentCount}
              </span>{" "}
              classes in {MONTHS[selectedMonth]} {selectedYear}
            </p>
          )}

          {/* Calendar grid */}
          {attendanceLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {MONTHS[selectedMonth]} {selectedYear}
                </CardTitle>
                {!studentBatch && (
                  <p className="text-xs text-muted-foreground">
                    No batch assigned — all days shown as gray
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_SHORT.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] text-muted-foreground font-medium py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading empty cells */}
                  {DAYS_SHORT.slice(
                    0,
                    new Date(selectedYear, selectedMonth, 1).getDay(),
                  ).map((d) => (
                    <div key={`${d}-gap`} aria-hidden="true" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(selectedYear, selectedMonth, day);
                    const dayOfWeek = date.getDay();
                    const isClassDay = batchDays.has(dayOfWeek);
                    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const status = recordByDate[dateStr];

                    let cellClass = "";
                    let label = "";

                    if (!isClassDay || !studentBatch) {
                      cellClass = "bg-muted/30 text-muted-foreground/40";
                      label = "";
                    } else if (status === AttendanceStatus.present) {
                      cellClass =
                        "bg-green-500/20 text-green-700 border border-green-500/40 font-bold";
                      label = "P";
                    } else if (status === AttendanceStatus.absent) {
                      cellClass =
                        "bg-red-500/20 text-red-700 border border-red-500/40 font-bold";
                      label = "A";
                    } else if (status === AttendanceStatus.holiday) {
                      cellClass =
                        "bg-amber-500/20 text-amber-700 border border-amber-500/40 font-bold";
                      label = "H";
                    } else {
                      // Class day but no record yet
                      cellClass =
                        "bg-card border border-border text-muted-foreground";
                      label = "";
                    }

                    return (
                      <div
                        key={day}
                        className={`rounded text-center text-xs py-1.5 flex flex-col items-center justify-center min-h-[2.5rem] ${cellClass}`}
                        title={dateStr}
                      >
                        <span className="text-[10px] leading-none">{day}</span>
                        {label && (
                          <span className="text-[10px] font-bold leading-none mt-0.5">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
                    P = Present
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
                    A = Absent
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                    H = Holiday
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-muted/30" />
                    Gray = No class
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Attendance Page ─────────────────────────────────────────────────────

export default function AttendancePage() {
  const { currentUser } = useAuth();

  if (currentUser?.role === "guest") {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Access Denied</p>
        <p className="text-muted-foreground text-sm">
          Guests cannot access attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Attendance
        </h1>
        <p className="text-muted-foreground text-sm">
          Batch-wise attendance management
        </p>
      </div>

      <Tabs defaultValue="take" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="take"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="attendance.take.tab"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Take Attendance
          </TabsTrigger>
          <TabsTrigger
            value="student"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="attendance.student.tab"
          >
            <Clock className="w-4 h-4 mr-2" />
            Student View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="take" className="space-y-4">
          <TakeAttendanceTab />
        </TabsContent>

        <TabsContent value="student" className="space-y-4">
          <StudentAttendanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
