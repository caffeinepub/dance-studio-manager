import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  // Actor type before changes in this iteration
  type OldStudent = {
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
    admissionFees : Nat;
  };

  type OldActor = {
    students : Map.Map<Nat, OldStudent>;
  };

  // Actor type after changes in this iteration
  type NewStudent = {
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

  type NewActor = {
    students : Map.Map<Nat, NewStudent>;
  };

  // Function transforming the stored old actor instance to the new one
  public func run(old : OldActor) : NewActor {
    let newStudents = old.students.map<Nat, OldStudent, NewStudent>(
      func(_id, oldStudent) {
        {
          oldStudent with
          dateOfBirth = "";
          studentAadhar = "";
          guardianAadhar = "";
        };
      }
    );
    { students = newStudents };
  };
};
