import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Student {
    id: bigint;
    age: bigint;
    name: string;
    guardianRelationship: string;
    isActive: boolean;
    guardianPhone: string;
    gender: string;
    contactNumber: string;
    currentBatchId?: bigint;
    guardianName: string;
    dateOfAdmission: string;
}
export interface Batch {
    id: bigint;
    startTime: string;
    endTime: string;
    name: string;
    daysOfWeek: Array<bigint>;
    isActive: boolean;
    monthlyFees: bigint;
}
export interface SoloRegistration {
    feeAmount: bigint;
    studentId: bigint;
    isCompleted: boolean;
    isPaid: boolean;
    programmeId: bigint;
}
export interface DueCard {
    studentId: bigint;
    monthlyEntries: Array<MonthlyEntry>;
    year: bigint;
    openingBalance: bigint;
}
export interface SoloProgramme {
    id: bigint;
    endDate: string;
    name: string;
    description: string;
    startDate: string;
}
export interface MonthlyEntry {
    month: bigint;
    balance: bigint;
    paidAmount: bigint;
    dueAmount: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignBatch(studentId: bigint, batchId: bigint, startDate: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBatch(name: string, daysOfWeek: Array<bigint>, startTime: string, endTime: string, monthlyFees: bigint): Promise<bigint>;
    createSoloProgramme(name: string, description: string, startDate: string, endDate: string): Promise<bigint>;
    createStudent(name: string, dateOfAdmission: string, age: bigint, gender: string, contactNumber: string, guardianName: string, guardianRelationship: string, guardianPhone: string): Promise<bigint>;
    deleteBatch(batchId: bigint): Promise<void>;
    generateDueCard(studentId: bigint, year: bigint, openingBalance: bigint): Promise<void>;
    getAllSoloProgrammes(): Promise<Array<SoloProgramme>>;
    getAllSoloRegistrations(): Promise<Array<SoloRegistration>>;
    getBatch(batchId: bigint): Promise<Batch>;
    getBatchesByDay(day: bigint): Promise<Array<Batch>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentYear(): Promise<bigint>;
    getDueCard(studentId: bigint, year: bigint): Promise<DueCard>;
    getSoloProgramme(programmeId: bigint): Promise<SoloProgramme>;
    getSoloRegistrationsForStudent(studentId: bigint): Promise<Array<SoloRegistration>>;
    getStudent(studentId: bigint): Promise<Student>;
    getStudentsInBatch(batchId: bigint): Promise<Array<Student>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markSoloComplete(studentId: bigint, programmeId: bigint): Promise<void>;
    markSoloPaid(studentId: bigint, programmeId: bigint): Promise<void>;
    markStudentInactive(studentId: bigint): Promise<void>;
    recordFeePayment(studentId: bigint, date: string, feeType: string, amount: bigint, remarks: string, month: bigint | null, year: bigint | null): Promise<void>;
    registerStudentForSolo(studentId: bigint, programmeId: bigint, feeAmount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBatch(batchId: bigint, name: string, daysOfWeek: Array<bigint>, startTime: string, endTime: string, monthlyFees: bigint): Promise<void>;
    updateCurrentYear(year: bigint): Promise<void>;
    updateStudent(studentId: bigint, name: string, dateOfAdmission: string, age: bigint, gender: string, contactNumber: string, guardianName: string, guardianRelationship: string, guardianPhone: string): Promise<void>;
}
