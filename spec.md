# Dance Studio Manager

## Current State

The app has:
- Student management (create, update, delete/soft-deactivate, batch assign)
- Batch management (create, update, delete)
- Due card generation and viewing
- Solo Programme management (create, register students) -- currently stored in sessionStorage workaround
- Fee collection (record payments for 7 categories)
- Dashboard showing today's schedule and student counts

The backend has:
- `deleteStudent` which sets `isActive = false` (soft delete already)
- `registerStudentForSolo` which creates a SoloRegistration with `isPaid = false`
- No endpoint to list solo registrations for a student
- No endpoint to mark a solo registration as paid
- No endpoint to mark a student inactive (separate from delete)
- No endpoint to list all solo programmes

The frontend:
- Solo programmes stored in sessionStorage (unreliable across sessions)
- Fee Collection shows all active students regardless of fee type
- Students page has a Delete button that soft-deletes but shows as destructive action with "Delete" label
- No "Mark Inactive" button separate from delete
- No "Mark Complete" for solo registrations

## Requested Changes (Diff)

### Add
- Backend: `markStudentInactive(studentId)` -- sets `isActive = false`, preserves all history
- Backend: `getSoloProgramme(programmeId)` -- returns a single SoloProgramme by ID
- Backend: `getAllSoloProgrammes()` -- returns array of all SoloProgrammes
- Backend: `getSoloRegistrationsForStudent(studentId)` -- returns registrations for a student
- Backend: `getAllSoloRegistrations()` -- returns all registrations
- Backend: `markSoloPaid(studentId, programmeId)` -- sets `isPaid = true` on matching registration
- Backend: `markSoloComplete(studentId, programmeId)` -- marks registration complete AND deactivates the student
- Frontend: "Mark Inactive" button on each student row (replaces the Trash2 delete button visually, keeps history)
- Frontend: Fee Collection page -- when fee type "Solo" is selected, only show students who have a solo registration (not all students)
- Frontend: Solo Programmes page -- show registered students per programme with their payment status; after solo fee payment is recorded, enable "Mark Complete" button for that student; clicking Mark Complete deactivates the student

### Modify
- Frontend: Students page -- rename Delete to "Mark Inactive", change confirmation dialog text to reflect it marks inactive (not permanently deletes)
- Frontend: Solo Programmes page -- replace sessionStorage with real backend calls using `getAllSoloProgrammes`
- Frontend: useQueries.ts -- add hooks for new backend endpoints

### Remove
- Frontend: sessionStorage workaround for solo programmes and solo IDs

## Implementation Plan

1. Regenerate backend with all new endpoints listed above
2. Update `useQueries.ts` with new query/mutation hooks:
   - `useAllSoloProgrammes` (fetches from `getAllSoloProgrammes`)
   - `useSoloRegistrationsForStudent(studentId)`
   - `useAllSoloRegistrations`
   - `useMarkSoloPaid`
   - `useMarkSoloComplete`
   - `useMarkStudentInactive`
3. Update `StudentsPage.tsx`:
   - Rename "Delete" button to "Mark Inactive" with appropriate icon (UserMinus or EyeOff)
   - Change confirmation dialog text to "This will mark the student as inactive. All history is preserved."
   - Use `markStudentInactive` instead of `deleteStudent`
4. Update `FeeCollectionPage.tsx`:
   - When feeType === "Solo", load all solo registrations and filter student list to only registered solo students
5. Update `SoloProgrammesPage.tsx`:
   - Replace sessionStorage with `useAllSoloProgrammes` hook
   - For each programme, show list of registered students with payment status
   - After a solo fee payment is detected (student has `isPaid=true`), enable "Mark Complete" button
   - Mark Complete calls `markSoloComplete`, deactivates the student
