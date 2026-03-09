import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Bool "mo:core/Bool";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  /// Copied types from original actor
  type Batch = {
    id : Nat;
    name : Text;
    daysOfWeek : [Nat];
    startTime : Text;
    endTime : Text;
    monthlyFees : Nat;
    isActive : Bool;
  };

  type Student = {
    id : Nat;
    name : Text;
    dateOfAdmission : Text;
    dateOfBirth : Text;
    age : Nat;
    gender : Text;
    contactNumber : Text;
    studentAadhar : Text;
    guardianName : Text;
    guardianRelationship : Text;
    guardianPhone : Text;
    guardianAadhar : Text;
    currentBatchId : ?Nat;
    isActive : Bool;
    admissionFees : Nat;
  };

  type BatchAssignment = {
    studentId : Nat;
    batchId : Nat;
    startDate : Text;
    endDate : ?Text;
    isActive : Bool;
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
    scheduleTime : Text;
    scheduleDays : [Nat];
  };

  type SoloRegistration = {
    studentId : Nat;
    programmeId : Nat;
    feeAmount : Nat;
    isPaid : Bool;
    isCompleted : Bool;
  };

  type FeePayment = {
    receiptNumber : Nat;
    studentId : Nat;
    date : Text;
    feeType : Text;
    amount : Nat;
    remarks : Text;
    month : ?Nat;
    year : ?Nat;
    paymentMode : Text;
  };

  type FeeAssignment = {
    id : Nat;
    name : Text;
    feeType : FeeAssignmentType;
    amount : Nat;
    year : Nat;
    description : Text;
  };

  type FeeAssignmentType = {
    #puja;
    #annualDay;
    #other;
  };

  type FeeAssignmentPayment = {
    assignmentId : Nat;
    studentId : Nat;
    isPaid : Bool;
    paidDate : ?Text;
    amount : Nat;
  };

  type OpeningBalanceItem = {
    description : Text;
    amount : Int;
  };

  type YearChangeoverRecord = {
    studentId : Nat;
    fromYear : Nat;
    toYear : Nat;
    totalOpeningBalance : Int;
    breakdownItems : [OpeningBalanceItem];
  };

  type AppUser = {
    id : Nat;
    username : Text;
    mobileNumber : Text;
    password : Text;
    role : Text;
    isActive : Bool;
  };

  // New AppUser system
  let appUsers = Map.empty<Nat, AppUser>();
  var nextAppUserId = 3;
  var appUsersSeeded = false;

  // Stable Data Structures
  let batches = Map.empty<Nat, Batch>();
  let students = Map.empty<Nat, Student>();
  let batchAssignments = Map.empty<Nat, BatchAssignment>();
  let dueCards = Map.empty<Nat, DueCard>();
  let soloProgrammes = Map.empty<Nat, SoloProgramme>();
  let soloRegistrations = Map.empty<Nat, SoloRegistration>();
  let feePayments = Map.empty<Nat, FeePayment>();
  let feeAssignments = Map.empty<Nat, FeeAssignment>();
  let feeAssignmentPayments = Map.empty<Nat, FeeAssignmentPayment>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextAvailableId = 0;
  let yearChangeoverRecords = Map.empty<Nat, YearChangeoverRecord>();

  var nextBatchId = 1;
  var nextStudentId = 1;
  var nextAssignmentId = 1;
  var nextProgrammeId = 1;
  var nextRegistrationId = 1;
  var nextPaymentId = 1;
  var nextFeeAssignmentId = 1;
  var currentYear = 2024;
  var receiptCounter = 0;

  // Authorization retained for UserProfile management
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // File storage
  include MixinStorage();

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  // New AppUser functions - public user management

  // seedDefaultUsers - public, no auth required (initialization function)
  public func seedDefaultUsers() : async () {
    if (not appUsersSeeded) {
      let admin : AppUser = {
        id = 1;
        username = "Admin";
        mobileNumber = "9876543210";
        password = "12345";
        role = "admin";
        isActive = true;
      };
      let guest : AppUser = {
        id = 2;
        username = "Guest";
        mobileNumber = "0000000000";
        password = "guest";
        role = "guest";
        isActive = true;
      };
      appUsers.add(1, admin);
      appUsers.add(2, guest);
      appUsersSeeded := true;
    };
  };

  // Login functions - no auth required (public login endpoints)
  public query func loginUser(mobileNumber : Text, password : Text) : async ?AppUser {
    for ((_, user) in appUsers.entries()) {
      if (user.mobileNumber == mobileNumber and user.password == password and user.isActive) {
        return ?user;
      };
    };
    null;
  };

  public query func guestLogin(name : Text, mobileNumber : Text) : async AppUser {
    {
      id = 0;
      username = name;
      mobileNumber;
      password = "";
      role = "guest";
      isActive = true;
    };
  };

  // Admin-only user management functions
  public shared ({ caller }) func createAppUser(
    username : Text,
    mobileNumber : Text,
    password : Text,
    role : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create users");
    };
    let user : AppUser = {
      id = nextAppUserId;
      username;
      mobileNumber;
      password;
      role;
      isActive = true;
    };
    appUsers.add(nextAppUserId, user);
    nextAppUserId += 1;
    user.id;
  };

  // Admin-only getAllAppUsers
  public query ({ caller }) func getAllAppUsers() : async [AppUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    appUsers.values().toArray();
  };

  // Admin-only resetUserPassword
  public shared ({ caller }) func resetUserPassword(userId : Nat, newPassword : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset passwords");
    };
    switch (appUsers.get(userId)) {
      case (null) {};
      case (?user) {
        let updated = { user with password = newPassword };
        appUsers.add(userId, updated);
      };
    };
  };

  // Admin-only deactivateAppUser
  public shared ({ caller }) func deactivateAppUser(userId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate users");
    };
    switch (appUsers.get(userId)) {
      case (null) {};
      case (?user) {
        let updated = { user with isActive = false };
        appUsers.add(userId, updated);
      };
    };
  };

  // Batch Management - No permissions as per requirements
  public shared ({ caller }) func createBatch(
    name : Text,
    daysOfWeek : [Nat],
    startTime : Text,
    endTime : Text,
    monthlyFees : Nat,
  ) : async Nat {
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

  public shared ({ caller }) func updateBatch(
    id : Nat,
    name : Text,
    daysOfWeek : [Nat],
    startTime : Text,
    endTime : Text,
    monthlyFees : Nat,
  ) : async () {
    switch (batches.get(id)) {
      case (null) {};
      case (?batch) {
        let updated = {
          batch with
          name;
          daysOfWeek;
          startTime;
          endTime;
          monthlyFees;
        };
        batches.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteBatch(id : Nat) : async () {
    switch (batches.get(id)) {
      case (null) {};
      case (?batch) {
        let updated = { batch with isActive = false };
        batches.add(id, updated);
      };
    };
  };

  public query func getBatch(id : Nat) : async ?Batch {
    batches.get(id);
  };

  public query func getBatchesByDay(day : Nat) : async [Batch] {
    let result = List.empty<Batch>();
    for ((_, batch) in batches.entries()) {
      if (batch.isActive and batch.daysOfWeek.any(func(dayOfWeek) { dayOfWeek == day })) {
        result.add(batch);
      };
    };
    result.toArray();
  };

  public query func getAllBatches() : async [Batch] {
    batches.values().toArray();
  };

  // Student Management - No permissions as per requirements
  public shared ({ caller }) func createStudent(
    name : Text,
    dateOfAdmission : Text,
    dateOfBirth : Text,
    age : Nat,
    gender : Text,
    contactNumber : Text,
    studentAadhar : Text,
    guardianName : Text,
    guardianRelationship : Text,
    guardianPhone : Text,
    guardianAadhar : Text,
    admissionFees : Nat,
  ) : async Nat {
    let student : Student = {
      id = nextStudentId;
      name;
      dateOfAdmission;
      dateOfBirth;
      age;
      gender;
      contactNumber;
      studentAadhar;
      guardianName;
      guardianRelationship;
      guardianPhone;
      guardianAadhar;
      currentBatchId = null;
      isActive = true;
      admissionFees;
    };
    students.add(nextStudentId, student);
    nextStudentId += 1;
    student.id;
  };

  public shared ({ caller }) func updateStudent(
    id : Nat,
    name : Text,
    dateOfBirth : Text,
    age : Nat,
    gender : Text,
    contactNumber : Text,
    studentAadhar : Text,
    guardianName : Text,
    guardianRelationship : Text,
    guardianPhone : Text,
    guardianAadhar : Text,
  ) : async () {
    switch (students.get(id)) {
      case (null) {};
      case (?student) {
        let updated = {
          student with
          name;
          dateOfBirth;
          age;
          gender;
          contactNumber;
          studentAadhar;
          guardianName;
          guardianRelationship;
          guardianPhone;
          guardianAadhar;
        };
        students.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func markStudentInactive(id : Nat) : async () {
    switch (students.get(id)) {
      case (null) {};
      case (?student) {
        let updated = { student with isActive = false };
        students.add(id, updated);
      };
    };
  };

  public query func getStudent(id : Nat) : async ?Student {
    students.get(id);
  };

  public query func getStudentsInBatch(batchId : Nat) : async [Student] {
    let result = List.empty<Student>();
    for ((_, student) in students.entries()) {
      if (student.currentBatchId == ?batchId and student.isActive) {
        result.add(student);
      };
    };
    result.toArray();
  };

  public query func getAllStudents() : async [Student] {
    students.values().toArray();
  };

  // Batch Assignment - No permissions as per requirements
  public shared ({ caller }) func assignStudentToBatch(
    studentId : Nat,
    batchId : Nat,
    startDate : Text,
  ) : async () {
    // Deactivate previous assignments
    for ((key, assignment) in batchAssignments.entries()) {
      if (assignment.studentId == studentId and assignment.isActive) {
        let updated = { assignment with isActive = false; endDate = ?startDate };
        batchAssignments.add(key, updated);
      };
    };

    // Create new assignment
    let assignment : BatchAssignment = {
      studentId;
      batchId;
      startDate;
      endDate = null;
      isActive = true;
    };
    batchAssignments.add(nextAssignmentId, assignment);
    nextAssignmentId += 1;

    // Update student's current batch
    switch (students.get(studentId)) {
      case (null) {};
      case (?student) {
        let updated = { student with currentBatchId = ?batchId };
        students.add(studentId, updated);
      };
    };

    // Regenerate due card entries after batch change
    let monthStrIter = startDate.chars().drop(5).take(2);
    let monthStr = monthStrIter.toArray().toText();
    let month = switch (monthStr.toNat()) {
      case (null) { 1 };
      case (?m) { m };
    };

    let key = studentId * 10000 + currentYear;
    switch (dueCards.get(key)) {
      case (null) {};
      case (?_) {
        await regenerateDueCardFromMonth(studentId, currentYear, month);
      };
    };
  };

  // Due Cards - No permissions as per requirements
  public shared ({ caller }) func generateDueCard(studentId : Nat, year : Nat) : async () {
    switch (students.get(studentId)) {
      case (null) {};
      case (?student) {
        let monthlyFees = switch (student.currentBatchId) {
          case (null) { 0 };
          case (?batchId) {
            switch (batches.get(batchId)) {
              case (null) { 0 };
              case (?batch) { batch.monthlyFees };
            };
          };
        };

        let entries = Array.tabulate(
          12,
          func(i : Nat) : MonthlyEntry {
            {
              month = i + 1;
              dueAmount = monthlyFees;
              paidAmount = 0;
              balance = Int.fromNat(monthlyFees);
            };
          },
        );

        let dueCard : DueCard = {
          studentId;
          year;
          openingBalance = 0;
          monthlyEntries = entries;
        };

        let key = studentId * 10000 + year;
        dueCards.add(key, dueCard);
      };
    };
  };

  public shared ({ caller }) func regenerateDueCardFromMonth(
    studentId : Nat,
    year : Nat,
    fromMonth : Nat,
  ) : async () {
    let key = studentId * 10000 + year;
    switch (dueCards.get(key)) {
      case (null) { () };
      case (?existingCard) {
        let student = switch (students.get(studentId)) {
          case (null) { return () };
          case (?s) { s };
        };

        let monthlyFees = switch (student.currentBatchId) {
          case (null) { 0 };
          case (?batchId) {
            switch (batches.get(batchId)) {
              case (null) { 0 };
              case (?batch) { batch.monthlyFees };
            };
          };
        };

        let entries = Array.tabulate(
          12,
          func(i) {
            if (i + 1 < fromMonth) {
              // Keep existing entry for months before fromMonth
              if (i < existingCard.monthlyEntries.size()) {
                existingCard.monthlyEntries[i];
              } else {
                {
                  month = i + 1;
                  dueAmount = 0;
                  paidAmount = 0;
                  balance = 0;
                };
              };
            } else {
              let dueAmount = monthlyFees;
              let paidAmount = if (i < existingCard.monthlyEntries.size()) {
                existingCard.monthlyEntries[i].paidAmount;
              } else { 0 };
              let balance = Int.fromNat(dueAmount) - Int.fromNat(paidAmount);
              {
                month = i + 1;
                dueAmount;
                paidAmount;
                balance;
              };
            };
          },
        );

        let updatedDueCard = { existingCard with monthlyEntries = entries };
        dueCards.add(key, updatedDueCard);
      };
    };
  };

  public query func getDueCard(studentId : Nat, year : Nat) : async ?DueCard {
    let key = studentId * 10000 + year;
    dueCards.get(key);
  };

  // Solo Programmes - No permissions as per requirements
  public shared ({ caller }) func createSoloProgramme(
    name : Text,
    description : Text,
    startDate : Text,
    endDate : Text,
    scheduleTime : Text,
    scheduleDays : [Nat],
  ) : async Nat {
    let programme : SoloProgramme = {
      id = nextProgrammeId;
      name;
      description;
      startDate;
      endDate;
      scheduleTime;
      scheduleDays;
    };
    soloProgrammes.add(nextProgrammeId, programme);
    nextProgrammeId += 1;
    programme.id;
  };

  public query func getSoloProgramme(id : Nat) : async ?SoloProgramme {
    soloProgrammes.get(id);
  };

  public query func getAllSoloProgrammes() : async [SoloProgramme] {
    soloProgrammes.values().toArray();
  };

  public query func getSoloProgrammesByDay(day : Nat) : async [SoloProgramme] {
    let result = List.empty<SoloProgramme>();
    for ((_, programme) in soloProgrammes.entries()) {
      if (programme.scheduleDays.any(func(dayOfWeek) { dayOfWeek == day })) {
        result.add(programme);
      };
    };
    result.toArray();
  };

  // Solo Registrations - No permissions as per requirements
  public shared ({ caller }) func registerStudentForSolo(
    studentId : Nat,
    programmeId : Nat,
    feeAmount : Nat,
  ) : async () {
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

  public query func getAllSoloRegistrations() : async [SoloRegistration] {
    soloRegistrations.values().toArray();
  };

  public query func getSoloRegistrationsForStudent(studentId : Nat) : async [SoloRegistration] {
    let result = List.empty<SoloRegistration>();
    for ((_, reg) in soloRegistrations.entries()) {
      if (reg.studentId == studentId) {
        result.add(reg);
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func markSoloPaid(studentId : Nat, programmeId : Nat) : async () {
    for ((key, reg) in soloRegistrations.entries()) {
      if (reg.studentId == studentId and reg.programmeId == programmeId) {
        let updated = { reg with isPaid = true };
        soloRegistrations.add(key, updated);
      };
    };
  };

  public shared ({ caller }) func markSoloComplete(studentId : Nat, programmeId : Nat) : async () {
    for ((key, reg) in soloRegistrations.entries()) {
      if (reg.studentId == studentId and reg.programmeId == programmeId) {
        let updated = { reg with isCompleted = true };
        soloRegistrations.add(key, updated);
      };
    };

    // Mark student inactive
    switch (students.get(studentId)) {
      case (null) {};
      case (?student) {
        let updated = { student with isActive = false };
        students.add(studentId, updated);
      };
    };
  };

  // Fee Payments with Receipt Tracking - No permissions as per requirements
  public shared ({ caller }) func recordFeePayment(
    studentId : Nat,
    date : Text,
    feeType : Text,
    amount : Nat,
    remarks : Text,
    month : ?Nat,
    year : ?Nat,
    paymentMode : Text,
  ) : async Nat {
    receiptCounter += 1;
    let receiptNumber = receiptCounter;
    let payment : FeePayment = {
      receiptNumber;
      studentId;
      date;
      feeType;
      amount;
      remarks;
      month;
      year;
      paymentMode;
    };
    feePayments.add(nextPaymentId, payment);
    nextPaymentId += 1;
    receiptNumber;
  };

  public query func getPaymentsForStudent(studentId : Nat) : async [FeePayment] {
    let payments = List.empty<FeePayment>();
    for ((_, payment) in feePayments.entries()) {
      if (payment.studentId == studentId) {
        payments.add(payment);
      };
    };
    payments.toArray();
  };

  public query func getAllPayments() : async [FeePayment] {
    let paymentsArray = feePayments.values().toArray();
    paymentsArray.sort(func(p1, p2) { Nat.compare(p2.receiptNumber, p1.receiptNumber) });
  };

  public query func getNextReceiptNumber() : async Nat {
    receiptCounter + 1;
  };

  // Current Year - No permissions as per requirements
  public query func getCurrentYear() : async Nat {
    currentYear;
  };

  public shared ({ caller }) func updateCurrentYear(year : Nat) : async () {
    currentYear := year;
  };

  // FeeAssignment Management - No permissions as per requirements
  public shared ({ caller }) func createFeeAssignment(
    name : Text,
    feeType : FeeAssignmentType,
    amount : Nat,
    year : Nat,
    studentIds : [Nat],
    description : Text,
  ) : async Nat {
    let assignment : FeeAssignment = {
      id = nextFeeAssignmentId;
      name;
      feeType;
      amount;
      year;
      description;
    };

    feeAssignments.add(nextFeeAssignmentId, assignment);

    for (studentId in studentIds.values()) {
      let payment : FeeAssignmentPayment = {
        assignmentId = nextFeeAssignmentId;
        studentId;
        isPaid = false;
        paidDate = null;
        amount;
      };
      let paymentKey = nextFeeAssignmentId * 1000000 + studentId;
      feeAssignmentPayments.add(paymentKey, payment);
    };

    nextFeeAssignmentId += 1;
    assignment.id;
  };

  public query func getAllFeeAssignments() : async [FeeAssignment] {
    feeAssignments.values().toArray();
  };

  public query func getFeeAssignmentPayments(assignmentId : Nat) : async [FeeAssignmentPayment] {
    let payments = List.empty<FeeAssignmentPayment>();
    for ((_, payment) in feeAssignmentPayments.entries()) {
      if (payment.assignmentId == assignmentId) {
        payments.add(payment);
      };
    };
    payments.toArray();
  };

  public shared ({ caller }) func markFeeAssignmentPaymentPaid(
    assignmentId : Nat,
    studentId : Nat,
    paidDate : Text,
  ) : async () {
    let paymentKey = assignmentId * 1000000 + studentId;
    switch (feeAssignmentPayments.get(paymentKey)) {
      case (null) {};
      case (?payment) {
        let updatedPayment = { payment with isPaid = true; paidDate = ?paidDate };
        feeAssignmentPayments.add(paymentKey, updatedPayment);
      };
    };
  };

  public query func getAllFeeAssignmentPaymentsForStudent(studentId : Nat) : async [FeeAssignmentPayment] {
    let payments = List.empty<FeeAssignmentPayment>();
    for ((_, payment) in feeAssignmentPayments.entries()) {
      if (payment.studentId == studentId) {
        payments.add(payment);
      };
    };
    payments.toArray();
  };

  // Year Changeover - No permissions as per requirements
  public query func getYearChangeoverRecord(studentId : Nat, year : Nat) : async ?YearChangeoverRecord {
    let key = studentId * 10000 + year;
    yearChangeoverRecords.get(key);
  };

  public shared ({ caller }) func performYearChangeover(toYear : Nat) : async () {
    let studentIds = students.keys().toArray();

    for (studentId in studentIds.values()) {
      let student = switch (students.get(studentId)) {
        case (null) { return () };
        case (?s) { s };
      };

      if (student.isActive) {
        // Calculate opening balance from previous year due card
        let dueCardKey = studentId * 10000 + currentYear;
        let previousDueCard = dueCards.get(dueCardKey);

        var monthlyUnpaidBalance : Int = 0;
        switch (previousDueCard) {
          case (null) { () };
          case (?dc) {
            for (entry in dc.monthlyEntries.values()) {
              if (entry.balance > 0) {
                monthlyUnpaidBalance += entry.balance;
              };
            };
          };
        };

        // Build breakdown items
        let breakdownList = List.empty<OpeningBalanceItem>();

        // Add monthly dues if unpaid
        if (monthlyUnpaidBalance > 0) {
          breakdownList.add({
            description = "Monthly Dues " # currentYear.toText();
            amount = monthlyUnpaidBalance;
          });
        };

        // Calculate unpaid fee assignments for current year
        for ((_, payment) in feeAssignmentPayments.entries()) {
          if (payment.studentId == studentId and not payment.isPaid) {
            let assignmentId = payment.assignmentId;
            switch (feeAssignments.get(assignmentId)) {
              case (null) {};
              case (?assignment) {
                if (assignment.year == currentYear) {
                  breakdownList.add({
                    description = assignment.name # " - Rs. " # payment.amount.toText();
                    amount = Int.fromNat(payment.amount);
                  });
                };
              };
            };
          };
        };

        let breakdownItems = breakdownList.toArray();

        // Calculate total opening balance
        var totalOpeningBalance : Int = 0;
        for (item in breakdownItems.values()) {
          totalOpeningBalance += item.amount;
        };

        // Store year changeover record if there's an opening balance
        if (totalOpeningBalance > 0) {
          let changeoverRecord : YearChangeoverRecord = {
            studentId;
            fromYear = currentYear;
            toYear;
            totalOpeningBalance;
            breakdownItems;
          };
          let changeoverKey = studentId * 10000 + toYear;
          yearChangeoverRecords.add(changeoverKey, changeoverRecord);
        };

        // Create new due card for the next year
        let monthlyFees = switch (student.currentBatchId) {
          case (null) { 0 };
          case (?batchId) {
            switch (batches.get(batchId)) {
              case (null) { 0 };
              case (?batch) { batch.monthlyFees };
            };
          };
        };

        let newDueCard : DueCard = {
          studentId;
          year = toYear;
          openingBalance = totalOpeningBalance;
          monthlyEntries = Array.tabulate(
            12,
            func(i) {
              {
                month = i + 1;
                dueAmount = monthlyFees;
                paidAmount = 0;
                balance = Int.fromNat(monthlyFees);
              };
            },
          );
        };

        let newDueCardKey = studentId * 10000 + toYear;
        dueCards.add(newDueCardKey, newDueCard);
      };
    };

    currentYear := toYear;
  };
};
