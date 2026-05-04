# Security Specification for SimpegPakar

## 1. Data Invariants
- An employee record cannot be created without a valid NIP and Join Date.
- History records must always be linked to an existing employee ID.
- Approval requests must start with a 'pending' status.
- Only administrators can transition an approval request from 'pending' to 'approved' or 'rejected'.
- Employees cannot edit their own records (assuming a centralized admin system, but we'll allow authenticated users for this demo if they are part of the org).

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create an employee with an `ownerId` that is not the requester's UID.
2. **State Shortcutting**: Attempt to create an `ApprovalRequest` with status 'approved' directly.
3. **Privilege Escalation**: Non-admin user attempting to update an `Employee` rank directly.
4. **ID Poisoning**: Creating an employee with a 1MB string as the document ID.
5. **Timestamp Fraud**: Sending a `createdAt` date from the client that is in the past/future.
6. **Shadow Fields**: Adding a `isAdmin: true` field to a user profile if we had one.
7. **Type Poisoning**: Sending `currentSalary` as a string instead of a number.
8. **Orphaned Writes**: Creating a `History` record for a non-existent `employeeId`.
9. **Bulk Scraping**: A logged-in user attempting to read all employees without a proper filter (if we restrict view).
10. **Immutability Breach**: Attempting to change the `nip` of an employee after creation.
11. **Resource Exhaustion**: Sending a 1MB string for an employee's `name`.
12. **Unauthorized Approval**: User A attempting to approve a request they didn't create (and aren't admin).

## 3. Test Runner Concept
The `firestore.rules` will be validated against these scenarios.
