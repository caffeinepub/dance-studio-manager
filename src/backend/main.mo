import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Bool "mo:core/Bool";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Batch = {
    id : Nat;
    name : Text;
    daysOfWeek : [Nat];
    startTime : Text;
    endTime : Text;
    monthlyFees : Nat;
    isActive : Bool;
  };

  module Batch {
    public func compare(batch1 : Batch, batch2 : Batch) : Order.Order {
      Nat.compare(batch1.id, batch2.id);
    };
  };

  type Student = {
    id : Nat;
    name : Text;
    dateOfAdmission : Text;
    age : Nat;
    gender : Text;
    contactNumber : Text;
    guardianName : Text;
    guardianRelationship : Text;
    guardianPhone : Text;
    currentBatchId : ?Nat;
    isActive : Bool;
  };

  module Student {
    public func compare(student1 : Student, student2 : Student) : Order.Order {
      Nat.compare(student1.id, student2.id);
    };
  };

  type BatchAssignment = {
    studentId : Nat;
    batchId : Nat;
    startDate : Text;
    endDate : ?Text;
    isActive : Bool;
  };

  module BatchAssignment {
    public func compare(assignment1 : BatchAssignment, assignment2 : BatchAssignment) : Order.Order {
      Nat.compare(assignment1.studentId, assignment2.studentId);
    };
  };

  type MonthlyEntry = {
    month : Nat;
    dueAmount : Nat;
    paidAmount : Nat;
    balance : Int;
  };

  type DueCard = {
    studentId : Nat;
    year : Nat;
    openingBalance : Int;
    monthlyEntries : [MonthlyEntry];
  };

  type SoloProgramme = {
    id : Nat;
    name : Text;
    description : Text;
    startDate : Text;
    endDate : Text;
  };

  module SoloProgramme {
    public func compare(sp1 : SoloProgramme, sp2 : SoloProgramme) : Order.Order {
      Nat.compare(sp1.id, sp2.id);
    };
  };

  type SoloRegistration = {
    studentId : Nat;
    programmeId : Nat;
    feeAmount : Nat;
    isPaid : Bool;
    isCompleted : Bool;
  };

  module SoloRegistration {
    public func compare(reg1 : SoloRegistration, reg2 : SoloRegistration) : Order.Order {
      Nat.compare(reg1.studentId, reg2.studentId);
    };
  };

  type FeePayment = {
    studentId : Nat;
    date : Text;
    feeType : Text;
    amount : Nat;
    remarks : Text;
    month : ?Nat;
    year : ?Nat;
  };

  module FeePayment {
    public func compare(payment1 : FeePayment, payment2 : FeePayment) : Order.Order {
      Nat.compare(payment1.studentId, payment2.studentId);
    };
  };

  let batches = Map.empty<Nat, Batch>();
  let students = Map.empty<Nat, Student>();
  let batchAssignments = Map.empty<Nat, BatchAssignment>();
  let dueCards = Map.empty<Nat, DueCard>();
  let soloProgrammes = Map.empty<Nat, SoloProgramme>();
  let soloRegistrations = Map.empty<Nat, SoloRegistration>();
  let feePayments = Map.empty<Nat, FeePayment>();

  type IdCounter = Nat;
  var nextAvailableId : IdCounter = 0;
  var nextBatchId = 1;
  var nextStudentId = 1;
  var nextAssignmentId = 1;
  var nextProgrammeId = 1;
  var nextRegistrationId = 1;
  var nextPaymentId = 1;
  var currentYear = 2024;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Batch Management
  public shared ({ caller }) func createBatch(name : Text, daysOfWeek : [Nat], startTime : Text, endTime : Text, monthlyFees : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create batches");
    };

    let batch : Batch = {
      id = nextBatchId;
      name;
      daysOfWeek;
      startTime;
      endTime;
      monthlyFees;
      isActive = true;
    };
    batches.add(nextBatchId, batch);
    nextBatchId += 1;
    batch.id;
  };

  public query ({ caller }) func getBatch(batchId : Nat) : async Batch {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batches");
    };

    switch (batches.get(batchId)) {
      case (null) { Runtime.trap("Batch not found") };
      case (?batch) { batch };
    };
  };

  public shared ({ caller }) func updateBatch(batchId : Nat, name : Text, daysOfWeek : [Nat], startTime : Text, endTime : Text, monthlyFees : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update batches");
    };

    switch (batches.get(batchId)) {
      case (null) { Runtime.trap("Batch not found") };
      case (?_) {
        let updatedBatch : Batch = {
          id = batchId;
          name;
          daysOfWeek;
          startTime;
          endTime;
          monthlyFees;
          isActive = true;
        };
        batches.add(batchId, updatedBatch);
      };
    };
  };

  public shared ({ caller }) func deleteBatch(batchId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete batches");
    };

    switch (batches.get(batchId)) {
      case (null) { Runtime.trap("Batch not found") };
      case (?batch) {
        let updatedBatch = { batch with isActive = false };
        batches.add(batchId, updatedBatch);
      };
    };
  };

  // Student Management
  public shared ({ caller }) func createStudent(name : Text, dateOfAdmission : Text, age : Nat, gender : Text, contactNumber : Text, guardianName : Text, guardianRelationship : Text, guardianPhone : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create students");
    };

    // Check for duplicates
    let existingStudents = students.values().toArray().filter(
      func(student) {
        student.name == name and student.guardianName == guardianName
      }
    );

    if (existingStudents.size() > 0) {
      Runtime.trap("Student with the same name and guardian already exists");
    };

    let student : Student = {
      id = nextStudentId;
      name;
      dateOfAdmission;
      age;
      gender;
      contactNumber;
      guardianName;
      guardianRelationship;
      guardianPhone;
      currentBatchId = null;
      isActive = true;
    };
    students.add(nextStudentId, student);
    nextStudentId += 1;
    student.id;
  };

  public query ({ caller }) func getStudent(studentId : Nat) : async Student {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view students");
    };

    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student };
    };
  };

  public shared ({ caller }) func updateStudent(studentId : Nat, name : Text, dateOfAdmission : Text, age : Nat, gender : Text, contactNumber : Text, guardianName : Text, guardianRelationship : Text, guardianPhone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update students");
    };

    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent : Student = {
          id = studentId;
          name;
          dateOfAdmission;
          age;
          gender;
          contactNumber;
          guardianName;
          guardianRelationship;
          guardianPhone;
          currentBatchId = student.currentBatchId;
          isActive = student.isActive;
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  public shared ({ caller }) func markStudentInactive(studentId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark students inactive");
    };

    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent = {
          student with isActive = false
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  // Batch Assignment
  public shared ({ caller }) func assignBatch(studentId : Nat, batchId : Nat, startDate : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign batches");
    };

    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        // Deactivate previous assignments
        let allEntries = batchAssignments.toArray();
        for ((key, assignment) in allEntries.values()) {
          if (assignment.studentId == studentId) {
            let updatedAssignment = { assignment with isActive = false };
            batchAssignments.add(key, updatedAssignment);
          };
        };

        // Create new assignment
        let newAssignment : BatchAssignment = {
          studentId;
          batchId;
          startDate;
          endDate = null;
          isActive = true;
        };
        batchAssignments.add(nextAssignmentId, newAssignment);
        nextAssignmentId += 1;

        // Update student's currentBatchId
        let updatedStudent = {
          student with currentBatchId = ?batchId
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  public query ({ caller }) func getStudentsInBatch(batchId : Nat) : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batch assignments");
    };

    let assignments = batchAssignments.values().toArray().filter(
      func(assignment) {
        assignment.batchId == batchId and assignment.isActive
      }
    );

    let studentIds = assignments.map(func(assignment) { assignment.studentId });
    let mutableStudents = List.empty<Student>();
    for (id in studentIds.values()) {
      switch (students.get(id)) {
        case (null) {};
        case (?student) { mutableStudents.add(student) };
      };
    };
    mutableStudents.toArray().sort();
  };

  // Due Card Management
  public shared ({ caller }) func generateDueCard(studentId : Nat, year : Nat, openingBalance : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can generate due cards");
    };

    let monthlyEntries : [MonthlyEntry] = Array.tabulate<MonthlyEntry>(
      12,
      func(i) {
        { month = i + 1; dueAmount = 0; paidAmount = 0; balance = 0 };
      },
    );

    let dueCard : DueCard = {
      studentId;
      year;
      openingBalance;
      monthlyEntries;
    };
    dueCards.add(studentId * 10000 + year, dueCard);
  };

  public query ({ caller }) func getDueCard(studentId : Nat, year : Nat) : async DueCard {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view due cards");
    };

    switch (dueCards.get(studentId * 10000 + year)) {
      case (null) { Runtime.trap("Due card not found") };
      case (?dueCard) { dueCard };
    };
  };

  // Solo Programme Management
  public shared ({ caller }) func createSoloProgramme(name : Text, description : Text, startDate : Text, endDate : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create solo programmes");
    };

    let programme : SoloProgramme = {
      id = nextProgrammeId;
      name;
      description;
      startDate;
      endDate;
    };
    soloProgrammes.add(nextProgrammeId, programme);
    nextProgrammeId += 1;
    programme.id;
  };

  public query ({ caller }) func getSoloProgramme(programmeId : Nat) : async SoloProgramme {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view solo programmes");
    };

    switch (soloProgrammes.get(programmeId)) {
      case (null) { Runtime.trap("Solo programme not found") };
      case (?programme) { programme };
    };
  };

  public query ({ caller }) func getAllSoloProgrammes() : async [SoloProgramme] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view all solo programmes");
    };

    soloProgrammes.values().toArray().sort();
  };

  public shared ({ caller }) func registerStudentForSolo(studentId : Nat, programmeId : Nat, feeAmount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can register students for solo programmes");
    };

    let registration : SoloRegistration = {
      studentId;
      programmeId;
      feeAmount;
      isPaid = false;
      isCompleted = false;
    };
    soloRegistrations.add(nextRegistrationId, registration);
    nextRegistrationId += 1;
  };

  public query ({ caller }) func getAllSoloRegistrations() : async [SoloRegistration] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view all solo registrations");
    };

    soloRegistrations.values().toArray().sort();
  };

  public query ({ caller }) func getSoloRegistrationsForStudent(studentId : Nat) : async [SoloRegistration] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view solo registrations for students");
    };

    let filteredRegistrations = soloRegistrations.values().toArray().filter(
      func(registration) {
        registration.studentId == studentId and not registration.isCompleted
      }
    );
    filteredRegistrations.sort();
  };

  public shared ({ caller }) func markSoloPaid(studentId : Nat, programmeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark solo registrations as paid");
    };

    // Find the registration matching studentId and programmeId
    var found = false;
    let allEntries = soloRegistrations.toArray();
    for ((key, reg) in allEntries.values()) {
      if (reg.studentId == studentId and reg.programmeId == programmeId) {
        let updatedRegistration = { reg with isPaid = true };
        soloRegistrations.add(key, updatedRegistration);
        found := true;
      };
    };

    if (not found) {
      Runtime.trap("Solo registration not found for given student and programme");
    };
  };

  public shared ({ caller }) func markSoloComplete(studentId : Nat, programmeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark solo registrations as complete");
    };

    // Find the registration matching studentId and programmeId
    var found = false;
    let allEntries = soloRegistrations.toArray();
    for ((key, reg) in allEntries.values()) {
      if (reg.studentId == studentId and reg.programmeId == programmeId) {
        let updatedRegistration = { reg with isCompleted = true };
        soloRegistrations.add(key, updatedRegistration);
        found := true;
      };
    };

    if (not found) {
      Runtime.trap("Solo registration not found for given student and programme");
    };

    // Mark student as inactive
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent = {
          student with isActive = false
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  // Fee Payment Management
  public shared ({ caller }) func recordFeePayment(studentId : Nat, date : Text, feeType : Text, amount : Nat, remarks : Text, month : ?Nat, year : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record fee payments");
    };

    let payment : FeePayment = {
      studentId;
      date;
      feeType;
      amount;
      remarks;
      month;
      year;
    };
    feePayments.add(nextPaymentId, payment);
    nextPaymentId += 1;
  };

  // App Settings
  public shared ({ caller }) func updateCurrentYear(year : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update current year");
    };
    currentYear := year;
  };

  public query ({ caller }) func getCurrentYear() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view current year");
    };
    currentYear;
  };

  // Utility Functions
  public query ({ caller }) func getBatchesByDay(day : Nat) : async [Batch] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batches");
    };

    let filteredBatches = batches.values().toArray().filter(
      func(batch) {
        batch.daysOfWeek.any(func(dayOfWeek) { dayOfWeek == day });
      }
    );
    filteredBatches.sort();
  };
};
