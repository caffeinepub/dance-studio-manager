# Dance Studio Manager

## Current State

- Full-stack app with Motoko backend and React frontend
- Student model has single guardianName, guardianRelationship, guardianPhone, guardianAadhar fields
- No attendance system exists
- main.tsx is missing AuthProvider causing blank page
- Data reset was requested but data may still exist

## Requested Changes (Diff)

### Add
- Attendance module: batch-wise per-class-day attendance
  - AttendanceRecord type with studentId, batchId, date, status (present/absent/holiday), submittedBy, isLocked
  - Backend: submitAttendance, getAttendanceForBatch, getAttendanceForStudent, markHoliday, modifyAttendance (admin only)
  - Attendance sidebar menu (Admin and Staff only)
  - Take Attendance page: select batch, select date (only batch-active days), checkbox list of students, submit locks record
  - Holiday marking per batch/day
  - Admin-only modification of submitted attendance
  - Per-student calendar view with summary ("18 out of 22 classes") and P/A/H markers; non-class days grayed
  - Per-batch view showing attendance sheet for a date
  - Dashboard "Take Attendance" button on each batch schedule card
- Father's details: fatherName, fatherMobile (separate from mother)
- Mother's details: motherName, motherMobile
- One-time data reset: clear all students, batches, assignments, due cards, solo programmes, fee payments, fee assignments (preserve admin user)

### Modify
- Student type: replace guardianName/guardianRelationship/guardianPhone/guardianAadhar with fatherName, fatherMobile, motherName, motherMobile, guardianAadhar (single Aadhar for primary guardian)
- createStudent and updateStudent backend functions: updated parameters
- StudentPage registration form and edit form: updated guardian fields
- App.tsx: add attendance page route
- main.tsx: wrap app with AuthProvider (CRITICAL - prevents blank page)

### Remove
- guardianRelationship field from student model
- Single guardianName / guardianPhone fields

## Implementation Plan

1. Update Motoko backend:
   - New Student type with fatherName, fatherMobile, motherName, motherMobile, guardianAadhar
   - New AttendanceRecord type and attendance functions
   - One-time data clear on first deploy (clear students, batches, etc., preserve admin)
2. Update backend.d.ts with new types
3. Fix main.tsx: add AuthProvider wrapper
4. Add AttendancePage component (take attendance, holiday marking, calendar view per student)
5. Update StudentsPage: new guardian fields in registration and edit forms
6. Update DashboardPage: "Take Attendance" button on batch schedule cards
7. Update App.tsx: add attendance page type and route
8. Update Sidebar: add Attendance menu item (Admin/Staff only)
