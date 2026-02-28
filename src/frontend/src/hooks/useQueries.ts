import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Batch,
  DueCard,
  SoloProgramme,
  SoloRegistration,
  Student,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ─── ID Store ───────────────────────────────────────────────────────────────
// We maintain local arrays of known IDs; on first load we probe 1..50

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
        if (r.status === "fulfilled") valid.push(BigInt(i + 1));
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
        if (r.status === "fulfilled") valid.push(BigInt(i + 1));
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
          (r): r is PromiseFulfilledResult<Student> => r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
    enabled: !!actor && !isFetching && ids.length >= 0,
    staleTime: 10000,
  });
}

export function useStudent(studentId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Student>({
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
          (r): r is PromiseFulfilledResult<Batch> => r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
    enabled: !!actor && !isFetching && ids.length >= 0,
    staleTime: 10000,
  });
}

export function useBatch(batchId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Batch>({
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
  return useQuery<DueCard>({
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

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      dateOfAdmission: string;
      age: bigint;
      gender: string;
      contactNumber: string;
      guardianName: string;
      guardianRelationship: string;
      guardianPhone: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createStudent(
        data.name,
        data.dateOfAdmission,
        data.age,
        data.gender,
        data.contactNumber,
        data.guardianName,
        data.guardianRelationship,
        data.guardianPhone,
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
      dateOfAdmission: string;
      age: bigint;
      gender: string;
      contactNumber: string;
      guardianName: string;
      guardianRelationship: string;
      guardianPhone: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateStudent(
        data.studentId,
        data.name,
        data.dateOfAdmission,
        data.age,
        data.gender,
        data.contactNumber,
        data.guardianName,
        data.guardianRelationship,
        data.guardianPhone,
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
    mutationFn: async (studentId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markStudentInactive(studentId);
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
      return actor.assignBatch(data.studentId, data.batchId, data.startDate);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["student", vars.studentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["studentsInBatch"] });
    },
  });
}

export function useGenerateDueCard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: bigint;
      year: bigint;
      openingBalance: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.generateDueCard(
        data.studentId,
        data.year,
        data.openingBalance,
      );
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
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createSoloProgramme(
        data.name,
        data.description,
        data.startDate,
        data.endDate,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allSoloProgrammes"] });
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
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.recordFeePayment(
        data.studentId,
        data.date,
        data.feeType,
        data.amount,
        data.remarks,
        data.month,
        data.year,
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["dueCard", vars.studentId.toString()],
      });
    },
  });
}
