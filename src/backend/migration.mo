import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldStudent = {
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

  type NewStudent = {
    id : Nat;
    name : Text;
    dateOfAdmission : Text;
    dateOfBirth : Text;
    age : Nat;
    gender : Text;
    contactNumber : Text;
    studentAadhar : Text;
    fatherName : Text;
    fatherMobile : Text;
    motherName : Text;
    motherMobile : Text;
    guardianAadhar : Text;
    currentBatchId : ?Nat;
    isActive : Bool;
    admissionFees : Nat;
  };

  type OldActor = {
    students : Map.Map<Nat, OldStudent>;
  };

  type NewActor = {
    students : Map.Map<Nat, NewStudent>;
  };

  public func run(old : OldActor) : NewActor {
    {
      students = old.students.map<Nat, OldStudent, NewStudent>(
        func(_, oldStudent) {
          {
            oldStudent with
            fatherName = "";
            fatherMobile = "";
            motherName = "";
            motherMobile = "";
          };
        }
      );
    };
  };
};
