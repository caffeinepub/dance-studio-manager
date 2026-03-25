import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppUser,
  AttendanceRecord,
  Batch,
  DueCard,
  FeeAssignment,
  FeeAssignmentPayment,
  FeeAssignmentType,
  FeePayment,
  SoloProgramme,
  SoloRegistration,
  Student,
  YearChangeoverRecord,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ─── ID Store ───────────────────────────────────────────────────────────────

export function useStudentIds() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint[]>({
    queryKey: ["studentIds"],
    queryFn: async () => {
      if (!actor) return [];
      const ids = Array.from({ length: 50 }, (_, i) => BigInt(i + 1));
      const results = await Promise.allSettled(
        ids.map((id) => actor.getStudent(id)),
      );
      const valid: bigint[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value !== null)
          valid.push(BigInt(i + 1));
      });
      return valid;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useBatchIds() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint[]>({
    queryKey: ["batchIds"],
    queryFn: async () => {
      if (!actor) return [];
      const ids = Array.from({ length: 50 }, (_, i) => BigInt(i + 1));
      const results = await Promise.allSettled(
        ids.map((id) => actor.getBatch(id)),
      );
      const valid: bigint[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value !== null)
          valid.push(BigInt(i + 1));
      });
      return valid;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

// ─── Students ────────────────────────────────────────────────────────────────

export function useAllStudents() {
  const { actor, isFetching } = useActor();
  const { data: ids = [] } = useStudentIds();
  return useQuery<Student[]>({
    queryKey: ["students", ids.map(String).join(",")],
    queryFn: async () => {
      if (!actor || ids.length === 0) return [];
      const results = await Promise.allSettled(
        ids.map((id) => actor.getStudent(id)),
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<Student | null> =>
            r.status === "fulfilled" && r.value !== null,
        )
        .map((r) => r.value as Student);
    },
    enabled: !!actor && !isFetching && ids.length >= 0,
    staleTime: 10000,
  });
}

export function useStudent(studentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Student | null>({
    queryKey: ["student", studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) throw new Error("No actor or student ID");
      return actor.getStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useStudentsInBatch(batchId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["studentsInBatch", batchId?.toString()],
    queryFn: async () => {
      if (!actor || !batchId) return [];
      return actor.getStudentsInBatch(batchId);
    },
    enabled: !!actor && !isFetching && !!batchId,
    staleTime: 10000,
  });
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export function useAllBatches() {
  const { actor, isFetching } = useActor();
  const { data: ids = [] } = useBatchIds();
  return useQuery<Batch[]>({
    queryKey: ["batches", ids.map(String).join(",")],
    queryFn: async () => {
      if (!actor || ids.length === 0) return [];
      const results = await Promise.allSettled(
        ids.map((id) => actor.getBatch(id)),
      );
      return results
        .filter(
          (r): r is PromiseFulfilledResult<Batch | null> =>
            r.status === "fulfilled" && r.value !== null,
        )
        .map((r) => r.value as Batch);
    },
    enabled: !!actor && !isFetching && ids.length >= 0,
    staleTime: 10000,
  });
}

export function useBatch(batchId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Batch | null>({
    queryKey: ["batch", batchId?.toString()],
    queryFn: async () => {
      if (!actor || !batchId) throw new Error("No actor or batch ID");
      return actor.getBatch(batchId);
    },
    enabled: !!actor && !isFetching && !!batchId,
  });
}

export function useBatchesByDay(day: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Batch[]>({
    queryKey: ["batchesByDay", day],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBatchesByDay(BigInt(day));
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

// ─── Due Card ─────────────────────────────────────────────────────────────────

export function useDueCard(studentId: bigint | null, year: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<DueCard | null>({
    queryKey: ["dueCard", studentId?.toString(), year.toString()],
    queryFn: async () => {
      if (!actor || !studentId) throw new Error("No actor or student ID");
      return actor.getDueCard(studentId, year);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

// ─── Current Year ─────────────────────────────────────────────────────────────

export function useCurrentYear() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["currentYear"],
    queryFn: async () => {
      if (!actor) return BigInt(new Date().getFullYear());
      return actor.getCurrentYear();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

// ─── Solo Programmes ──────────────────────────────────────────────────────────

export function useAllSoloProgrammes() {
  const { actor, isFetching } = useActor();
  return useQuery<SoloProgramme[]>({
    queryKey: ["allSoloProgrammes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSoloProgrammes();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useSoloProgrammesByDay(day: number) {
  const { actor, isFetching } = useActor();
  return useQuery<SoloProgramme[]>({
    queryKey: ["soloProgrammesByDay", day],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSoloProgrammesByDay(BigInt(day));
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useAllSoloRegistrations() {
  const { actor, isFetching } = useActor();
  return useQuery<SoloRegistration[]>({
    queryKey: ["allSoloRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSoloRegistrations();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useSoloRegistrationsForStudent(studentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<SoloRegistration[]>({
    queryKey: ["soloRegsForStudent", studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getSoloRegistrationsForStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function useAttendanceForBatch(batchId: bigint | null, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendanceForBatch", batchId?.toString(), date],
    queryFn: async () => {
      if (!actor || !batchId || !date) return [];
      return actor.getAttendanceForBatch(batchId, date);
    },
    enabled: !!actor && !isFetching && !!batchId && !!date,
    staleTime: 5000,
  });
}

export function useAttendanceForStudent(studentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendanceForStudent", studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getAttendanceForStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
    staleTime: 5000,
  });
}

export function useIsAttendanceSubmitted(batchId: bigint | null, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["attendanceSubmitted", batchId?.toString(), date],
    queryFn: async () => {
      if (!actor || !batchId || !date) return false;
      return actor.isAttendanceSubmitted(batchId, date);
    },
    enabled: !!actor && !isFetching && !!batchId && !!date,
    staleTime: 5000,
  });
}

export function useSubmitAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      batchId: bigint;
      date: string;
      presentStudentIds: bigint[];
      submittedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitAttendance(
        data.batchId,
        data.date,
        data.presentStudentIds,
        data.submittedBy,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendanceForBatch", vars.batchId.toString(), vars.date],
      });
      qc.invalidateQueries({
        queryKey: ["attendanceSubmitted", vars.batchId.toString(), vars.date],
      });
    },
  });
}

export function useMarkHoliday() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      batchId: bigint;
      date: string;
      submittedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.markHoliday(data.batchId, data.date, data.submittedBy);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendanceForBatch", vars.batchId.toString(), vars.date],
      });
      qc.invalidateQueries({
        queryKey: ["attendanceSubmitted", vars.batchId.toString(), vars.date],
      });
    },
  });
}

export function useModifyAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      batchId: bigint;
      date: string;
      presentStudentIds: bigint[];
      modifiedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.modifyAttendance(
        data.batchId,
        data.date,
        data.presentStudentIds,
        data.modifiedBy,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendanceForBatch", vars.batchId.toString(), vars.date],
      });
      qc.invalidateQueries({ queryKey: ["attendanceForStudent"] });
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      dateOfAdmission: string;
      dateOfBirth: string;
      age: bigint;
      gender: string;
      contactNumber: string;
      studentAadhar: string;
      fatherName: string;
      fatherMobile: string;
      motherName: string;
      motherMobile: string;
      guardianAadhar: string;
      admissionFees: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createStudent(
        data.name,
        data.dateOfAdmission,
        data.dateOfBirth,
        data.age,
        data.gender,
        data.contactNumber,
        data.studentAadhar,
        data.fatherName,
        data.fatherMobile,
        data.motherName,
        data.motherMobile,
        data.guardianAadhar,
        data.admissionFees,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studentIds"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      name: string;
      dateOfBirth: string;
      age: bigint;
      gender: string;
      contactNumber: string;
      studentAadhar: string;
      fatherName: string;
      fatherMobile: string;
      motherName: string;
      motherMobile: string;
      guardianAadhar: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateStudent(
        data.studentId,
        data.name,
        data.dateOfBirth,
        data.age,
        data.gender,
        data.contactNumber,
        data.studentAadhar,
        data.fatherName,
        data.fatherMobile,
        data.motherName,
        data.motherMobile,
        data.guardianAadhar,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["student", vars.studentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useMarkStudentInactive() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markStudentInactive(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentIds"] });
    },
  });
}

export function useReactivateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.reactivateStudent(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentIds"] });
    },
  });
}

export function useMarkSoloPaid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: bigint; programmeId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.markSoloPaid(data.studentId, data.programmeId);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["allSoloRegistrations"] });
      qc.invalidateQueries({
        queryKey: ["soloRegsForStudent", vars.studentId.toString()],
      });
    },
  });
}

export function useMarkSoloComplete() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: bigint; programmeId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.markSoloComplete(data.studentId, data.programmeId);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["allSoloRegistrations"] });
      qc.invalidateQueries({
        queryKey: ["soloRegsForStudent", vars.studentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentIds"] });
    },
  });
}

export function useCreateBatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      daysOfWeek: bigint[];
      startTime: string;
      endTime: string;
      monthlyFees: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createBatch(
        data.name,
        data.daysOfWeek,
        data.startTime,
        data.endTime,
        data.monthlyFees,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batchIds"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useUpdateBatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      batchId: bigint;
      name: string;
      daysOfWeek: bigint[];
      startTime: string;
      endTime: string;
      monthlyFees: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateBatch(
        data.batchId,
        data.name,
        data.daysOfWeek,
        data.startTime,
        data.endTime,
        data.monthlyFees,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["batch", vars.batchId.toString()] });
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useDeleteBatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteBatch(batchId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batchIds"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useAssignBatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      batchId: bigint;
      startDate: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.assignStudentToBatch(
        data.studentId,
        data.batchId,
        data.startDate,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["student", vars.studentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentsInBatch"] });
      qc.invalidateQueries({ queryKey: ["dueCard"] });
    },
  });
}

export function useGenerateDueCard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: bigint; year: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.generateDueCard(data.studentId, data.year);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["dueCard", vars.studentId.toString()],
      });
    },
  });
}

export function useCreateSoloProgramme() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      scheduleTime: string;
      scheduleDays: bigint[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createSoloProgramme(
        data.name,
        data.description,
        data.startDate,
        data.endDate,
        data.scheduleTime,
        data.scheduleDays,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allSoloProgrammes"] });
      qc.invalidateQueries({ queryKey: ["soloProgrammesByDay"] });
    },
  });
}

export function useRegisterStudentForSolo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      programmeId: bigint;
      feeAmount: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.registerStudentForSolo(
        data.studentId,
        data.programmeId,
        data.feeAmount,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allSoloRegistrations"] });
    },
  });
}

export function useGetAllPayments() {
  const { actor, isFetching } = useActor();
  return useQuery<FeePayment[]>({
    queryKey: ["allPayments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

export function useRegenerateDueCardFromMonth() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      year: bigint;
      fromMonth: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.regenerateDueCardFromMonth(
        data.studentId,
        data.year,
        data.fromMonth,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["dueCard", vars.studentId.toString()],
      });
    },
  });
}

export function useRecordFeePayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      date: string;
      feeType: string;
      amount: bigint;
      remarks: string;
      month: bigint | null;
      year: bigint | null;
      paymentMode: string;
    }): Promise<bigint> => {
      if (!actor) throw new Error("No actor");
      return actor.recordFeePayment(
        data.studentId,
        data.date,
        data.feeType,
        data.amount,
        data.remarks,
        data.month,
        data.year,
        data.paymentMode,
      );
    },
    onSuccess: (_receiptNumber, vars) => {
      qc.invalidateQueries({
        queryKey: ["dueCard", vars.studentId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["paymentsForStudent", vars.studentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["allSoloRegistrations"] });
      qc.invalidateQueries({
        queryKey: ["soloRegsForStudent", vars.studentId.toString()],
      });
    },
  });
}

export function useGetPaymentsForStudent(studentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<FeePayment[]>({
    queryKey: ["paymentsForStudent", studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getPaymentsForStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
    staleTime: 5000,
  });
}

export function useGetAllFeeAssignmentPaymentsForStudent(
  studentId: bigint | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeAssignmentPayment[]>({
    queryKey: ["feeAssignmentPaymentsForStudent", studentId?.toString()],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getAllFeeAssignmentPaymentsForStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
    staleTime: 5000,
  });
}

// ─── Fee Assignments ──────────────────────────────────────────────────────────

export function useAllFeeAssignments() {
  const { actor, isFetching } = useActor();
  return useQuery<FeeAssignment[]>({
    queryKey: ["feeAssignments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFeeAssignments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useFeeAssignmentPayments(assignmentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeAssignmentPayment[]>({
    queryKey: ["feeAssignmentPayments", assignmentId?.toString()],
    queryFn: async () => {
      if (!actor || !assignmentId) return [];
      return actor.getFeeAssignmentPayments(assignmentId);
    },
    enabled: !!actor && !isFetching && !!assignmentId,
    staleTime: 10000,
  });
}

export function useCreateFeeAssignment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      feeType: FeeAssignmentType;
      amount: bigint;
      year: bigint;
      studentIds: bigint[];
      description: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createFeeAssignment(
        data.name,
        data.feeType,
        data.amount,
        data.year,
        data.studentIds,
        data.description,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feeAssignments"] });
    },
  });
}

export function useMarkFeeAssignmentPaymentPaid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      assignmentId: bigint;
      studentId: bigint;
      paidDate: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.markFeeAssignmentPaymentPaid(
        data.assignmentId,
        data.studentId,
        data.paidDate,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["feeAssignmentPayments", vars.assignmentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["feeAssignments"] });
    },
  });
}

// ─── Year Changeover ──────────────────────────────────────────────────────────

export function useYearChangeoverRecord(
  studentId: bigint | null,
  year: bigint | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<YearChangeoverRecord | null>({
    queryKey: ["yearChangeoverRecord", studentId?.toString(), year?.toString()],
    queryFn: async () => {
      if (!actor || !studentId || !year) return null;
      return actor.getYearChangeoverRecord(studentId, year);
    },
    enabled: !!actor && !isFetching && !!studentId && !!year,
    staleTime: 30000,
  });
}

export function usePerformYearChangeover() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (toYear: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.performYearChangeover(toYear);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentYear"] });
      qc.invalidateQueries({ queryKey: ["dueCard"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["yearChangeoverRecord"] });
    },
  });
}

// ─── App Users ────────────────────────────────────────────────────────────────

export function useAllAppUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<AppUser[]>({
    queryKey: ["appUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAppUsers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useCreateAppUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      mobileNumber: string;
      password: string;
      role: string;
    }): Promise<bigint> => {
      if (!actor) throw new Error("No actor");
      return actor.createAppUser(
        data.username,
        data.mobileNumber,
        data.password,
        data.role,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
    },
  });
}

export function useResetUserPassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: bigint; newPassword: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.resetUserPassword(data.userId, data.newPassword);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
    },
  });
}

export function useDeactivateAppUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deactivateAppUser(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
    },
  });
}

export function useSeedDefaultUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["seedDefaultUsers", !!actor],
    queryFn: async () => {
      if (!actor) return null;
      await actor.seedDefaultUsers();
      return true;
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useLoginUser() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      mobileNumber: string;
      password: string;
    }): Promise<AppUser | null> => {
      if (!actor) throw new Error("No actor");
      const result = await actor.loginUser(data.mobileNumber, data.password);
      if (Array.isArray(result)) {
        return result.length > 0 ? result[0] : null;
      }
      return result ?? null;
    },
  });
}

export function useGuestLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      mobileNumber: string;
    }): Promise<AppUser> => {
      if (!actor) throw new Error("No actor");
      return actor.guestLogin(data.name, data.mobileNumber);
    },
  });
}

export function useUpdateCurrentYear() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCurrentYear(year);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentYear"] });
    },
  });
}
