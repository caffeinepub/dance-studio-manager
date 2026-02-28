# Dance Studio Manager

## Current State
The Student type in the backend stores: id, name, dateOfAdmission, age (Nat), gender, contactNumber, guardianName, guardianRelationship, guardianPhone, currentBatchId, isActive, admissionFees. There is no DOB field, no Aadhar fields for student or guardian. The frontend form has Age as a manual number input. Most fields are not enforced as required in the form.

## Requested Changes (Diff)

### Add
- `dateOfBirth` (Text) field to backend `Student` type
- `studentAadhar` (Text) field to backend `Student` type
- `guardianAadhar` (Text) field to backend `Student` type
- DOB date input in frontend student form (required)
- Student Aadhar Card Number input in Student Details section (required)
- Guardian Aadhar Card Number input in Guardian Details section (required)
- Auto-calculate age from DOB vs Date of Admission (display as read-only)

### Modify
- Backend `createStudent` and `updateStudent` functions to accept and store `dateOfBirth`, `studentAadhar`, `guardianAadhar`
- Frontend `StudentFormData` interface to include `dateOfBirth`, `studentAadhar`, `guardianAadhar`
- Age field changed from manual input to read-only auto-populated display
- All fields except photo marked as required with validation on submit: name, dateOfBirth, dateOfAdmission, gender, contactNumber, studentAadhar, guardianName, guardianRelationship, guardianPhone, guardianAadhar, admissionFees (for new student)
- Student profile modal to show DOB, studentAadhar, guardianAadhar

### Remove
- Manual age number input (replaced by auto-calculated read-only display)

## Implementation Plan
1. Update `Student` type in `main.mo` to add `dateOfBirth`, `studentAadhar`, `guardianAadhar` fields
2. Update `createStudent` function signature and body to accept and store the three new fields
3. Update `updateStudent` function signature and body to accept and store the three new fields
4. Update `backend.d.ts` to reflect the new Student type and function signatures
5. Update `StudentFormData` interface in `StudentsPage.tsx` to add the three new fields
6. Add DOB date input, Aadhar inputs to the form with required validation
7. Replace Age manual input with a read-only calculated field (age = years between DOB and Date of Admission)
8. Add required validation for all fields on submit (except photo)
9. Update `StudentProfileModal` to display DOB, studentAadhar, guardianAadhar
