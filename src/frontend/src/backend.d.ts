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
    dateOfBirth: string;
    admissionFees: bigint;
    name: string;
    motherName: string;
    isActive: boolean;
    fatherName: string;
    gender: string;
    contactNumber: string;
    motherMobile: string;
    guardianAadhar: string;
    currentBatchId?: bigint;
    studentAadhar: string;
    fatherMobile: string;
    dateOfAdmission: string;
}
export interface AttendanceRecord {
    id: bigint;
    status: AttendanceStatus;
    studentId: bigint;
    date: string;
    submittedBy: string;
    isLocked: boolean;
    batchId: bigint;
}
export interface FeeAssignmentPayment {
    studentId: bigint;
    isPaid: boolean;
    paidDate?: string;
    assignmentId: bigint;
    amount: bigint;
}
export interface OpeningBalanceItem {
    description: string;
    amount: bigint;
}
export interface YearChangeoverRecord {
    studentId: bigint;
    totalOpeningBalance: bigint;
    toYear: bigint;
    breakdownItems: Array<OpeningBalanceItem>;
    fromYear: bigint;
}
export interface FeePayment {
    month?: bigint;
    studentId: bigint;
    date: string;
    year?: bigint;
    feeType: string;
    paymentMode: string;
    amount: bigint;
    remarks: string;
    receiptNumber: bigint;
}
export interface SoloProgramme {
    id: bigint;
    endDate: string;
    name: string;
    description: string;
    scheduleDays: Array<bigint>;
    scheduleTime: string;
    startDate: string;
}
export interface MonthlyEntry {
    month: bigint;
    balance: bigint;
    paidAmount: bigint;
    dueAmount: bigint;
}
export interface AppUser {
    id: bigint;
    username: string;
    password: string;
    role: string;
    mobileNumber: string;
    isActive: boolean;
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
export interface FeeAssignment {
    id: bigint;
    name: string;
    year: bigint;
    feeType: FeeAssignmentType;
    description: string;
    amount: bigint;
}
export interface DueCard {
    studentId: bigint;
    monthlyEntries: Array<MonthlyEntry>;
    year: bigint;
    openingBalance: bigint;
}
export interface UserProfile {
    name: string;
}
export enum AttendanceStatus {
    present = "present",
    absent = "absent",
    holiday = "holiday"
}
export enum FeeAssignmentType {
    other = "other",
    annualDay = "annualDay",
    puja = "puja"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignStudentToBatch(studentId: bigint, batchId: bigint, startDate: string): Promise<void>;
    createAppUser(username: string, mobileNumber: string, password: string, role: string): Promise<bigint>;
    createBatch(name: string, daysOfWeek: Array<bigint>, startTime: string, endTime: string, monthlyFees: bigint): Promise<bigint>;
    createFeeAssignment(name: string, feeType: FeeAssignmentType, amount: bigint, year: bigint, studentIds: Array<bigint>, description: string): Promise<bigint>;
    createSoloProgramme(name: string, description: string, startDate: string, endDate: string, scheduleTime: string, scheduleDays: Array<bigint>): Promise<bigint>;
    createStudent(name: string, dateOfAdmission: string, dateOfBirth: string, age: bigint, gender: string, contactNumber: string, studentAadhar: string, fatherName: string, fatherMobile: string, motherName: string, motherMobile: string, guardianAadhar: string, admissionFees: bigint): Promise<bigint>;
    deactivateAppUser(userId: bigint): Promise<void>;
    deleteBatch(id: bigint): Promise<void>;
    generateDueCard(studentId: bigint, year: bigint): Promise<void>;
    getAllAppUsers(): Promise<Array<AppUser>>;
    getAllBatches(): Promise<Array<Batch>>;
    getAllFeeAssignmentPaymentsForStudent(studentId: bigint): Promise<Array<FeeAssignmentPayment>>;
    getAllFeeAssignments(): Promise<Array<FeeAssignment>>;
    getAllPayments(): Promise<Array<FeePayment>>;
    getAllSoloProgrammes(): Promise<Array<SoloProgramme>>;
    getAllSoloRegistrations(): Promise<Array<SoloRegistration>>;
    getAllStudents(): Promise<Array<Student>>;
    getAttendanceForBatch(batchId: bigint, date: string): Promise<Array<AttendanceRecord>>;
    getAttendanceForStudent(studentId: bigint): Promise<Array<AttendanceRecord>>;
    getBatch(id: bigint): Promise<Batch | null>;
    getBatchesByDay(day: bigint): Promise<Array<Batch>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    /**
     * / Copied types from original actor
     */
    getCallerUserRole(): Promise<UserRole>;
    getCurrentYear(): Promise<bigint>;
    getDueCard(studentId: bigint, year: bigint): Promise<DueCard | null>;
    getFeeAssignmentPayments(assignmentId: bigint): Promise<Array<FeeAssignmentPayment>>;
    getNextReceiptNumber(): Promise<bigint>;
    getPaymentsForStudent(studentId: bigint): Promise<Array<FeePayment>>;
    getSoloProgramme(id: bigint): Promise<SoloProgramme | null>;
    getSoloProgrammesByDay(day: bigint): Promise<Array<SoloProgramme>>;
    getSoloRegistrationsForStudent(studentId: bigint): Promise<Array<SoloRegistration>>;
    getStudent(id: bigint): Promise<Student | null>;
    getStudentsInBatch(batchId: bigint): Promise<Array<Student>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getYearChangeoverRecord(studentId: bigint, year: bigint): Promise<YearChangeoverRecord | null>;
    guestLogin(name: string, mobileNumber: string): Promise<AppUser>;
    isAttendanceSubmitted(batchId: bigint, date: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    loginUser(mobileNumber: string, password: string): Promise<AppUser | null>;
    markFeeAssignmentPaymentPaid(assignmentId: bigint, studentId: bigint, paidDate: string): Promise<void>;
    markHoliday(batchId: bigint, date: string, submittedBy: string): Promise<void>;
    markSoloComplete(studentId: bigint, programmeId: bigint): Promise<void>;
    markSoloPaid(studentId: bigint, programmeId: bigint): Promise<void>;
    markStudentInactive(id: bigint): Promise<void>;
    modifyAttendance(batchId: bigint, date: string, presentStudentIds: Array<bigint>, modifiedBy: string): Promise<void>;
    performYearChangeover(toYear: bigint): Promise<void>;
    reactivateStudent(id: bigint): Promise<void>;
    recordFeePayment(studentId: bigint, date: string, feeType: string, amount: bigint, remarks: string, month: bigint | null, year: bigint | null, paymentMode: string): Promise<bigint>;
    regenerateDueCardFromMonth(studentId: bigint, year: bigint, fromMonth: bigint): Promise<void>;
    registerStudentForSolo(studentId: bigint, programmeId: bigint, feeAmount: bigint): Promise<void>;
    resetAllData(): Promise<void>;
    resetUserPassword(userId: bigint, newPassword: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedDefaultUsers(): Promise<void>;
    submitAttendance(batchId: bigint, date: string, presentStudentIds: Array<bigint>, submittedBy: string): Promise<bigint>;
    updateBatch(id: bigint, name: string, daysOfWeek: Array<bigint>, startTime: string, endTime: string, monthlyFees: bigint): Promise<void>;
    updateCurrentYear(year: bigint): Promise<void>;
    updateStudent(id: bigint, name: string, dateOfBirth: string, age: bigint, gender: string, contactNumber: string, studentAadhar: string, fatherName: string, fatherMobile: string, motherName: string, motherMobile: string, guardianAadhar: string): Promise<void>;
}
