# Dance Studio Manager

## Current State

Full-stack dance studio management app with:
- Student registration (DOB, Aadhar, guardian details, photo upload, admission fees)
- Batch management with schedule days/times and monthly fees
- Batch assignment (AssignBatchDialog in StudentsPage, BatchStudentAssignModal in BatchesPage)
- Due card system per student per year with monthly entries
- Solo programmes with schedule and registration
- Fee collection (smart student-first filtering, Cash/UPI mode, receipt PDF)
- Fee tracker (Puja, Annual Day, Other fees assigned to multiple students)
- Year changeover with itemized opening balance carry-forward
- Reports page (daily cash/UPI summary, fee-type breakdown)
- Role-based auth (Admin/Staff/Guest) with custom login + auto-logout
- User management page

**Root problem recurring across all deployments:** `main.tsx` never includes `AuthProvider`. Every deployment regenerates `main.tsx` without it, causing `useAuth()` to throw and crash the app silently, showing only the gradient background.

## Requested Changes (Diff)

### Add
- Nothing new feature-wise in this build

### Modify
- `main.tsx`: Permanently wrap `<App />` with `<AuthProvider>` from `./contexts/AuthContext`. This is the single fix needed to stop blank pages.
- Add a comment in `main.tsx` clearly marking `AuthProvider` as CRITICAL and must never be removed.

### Remove
- Nothing

## Implementation Plan

1. Edit `main.tsx` to add `AuthProvider` wrapper around `<App />` with a prominent CRITICAL comment.
2. Validate frontend build passes.
3. Deploy.
