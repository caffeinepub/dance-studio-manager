import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
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
    age : Nat;
    gender : Text;
    contactNumber : Text;
    guardianName : Text;
    guardianRelationship : Text;
    guardianPhone : Text;
    currentBatchId : ?Nat;
    isActive : Bool;
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

  type OldSoloRegistration = {
    studentId : Nat;
    programmeId : Nat;
    feeAmount : Nat;
    isPaid : Bool;
  };

  type NewSoloRegistration = {
    studentId : Nat;
    programmeId : Nat;
    feeAmount : Nat;
    isPaid : Bool;
    isCompleted : Bool;
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    batches : Map.Map<Nat, Batch>;
    students : Map.Map<Nat, Student>;
    batchAssignments : Map.Map<Nat, BatchAssignment>;
    dueCards : Map.Map<Nat, DueCard>;
    soloProgrammes : Map.Map<Nat, SoloProgramme>;
    soloRegistrations : Map.Map<Nat, OldSoloRegistration>;
    feePayments : Map.Map<Nat, FeePayment>;
    nextAvailableId : Nat;
    nextBatchId : Nat;
    nextStudentId : Nat;
    nextAssignmentId : Nat;
    nextProgrammeId : Nat;
    nextRegistrationId : Nat;
    nextPaymentId : Nat;
    currentYear : Nat;
    accessControlState : {
      var adminAssigned : Bool;
      userRoles : Map.Map<Principal, { #admin; #user; #guest }>;
    };
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    batches : Map.Map<Nat, Batch>;
    students : Map.Map<Nat, Student>;
    batchAssignments : Map.Map<Nat, BatchAssignment>;
    dueCards : Map.Map<Nat, DueCard>;
    soloProgrammes : Map.Map<Nat, SoloProgramme>;
    soloRegistrations : Map.Map<Nat, NewSoloRegistration>;
    feePayments : Map.Map<Nat, FeePayment>;
    nextAvailableId : Nat;
    nextBatchId : Nat;
    nextStudentId : Nat;
    nextAssignmentId : Nat;
    nextProgrammeId : Nat;
    nextRegistrationId : Nat;
    nextPaymentId : Nat;
    currentYear : Nat;
    accessControlState : {
      var adminAssigned : Bool;
      userRoles : Map.Map<Principal, { #admin; #user; #guest }>;
    };
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newSoloRegistrations = old.soloRegistrations.map<Nat, OldSoloRegistration, NewSoloRegistration>(
      func(_id, oldRegistration) {
        { oldRegistration with isCompleted = false };
      }
    );
    { old with soloRegistrations = newSoloRegistrations };
  };
};
