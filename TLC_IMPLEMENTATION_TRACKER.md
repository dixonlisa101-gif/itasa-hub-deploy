# ITASA TLC Implementation Tracker

Status key: ⬜ Not Started · 🟨 In Progress · 🟩 Built · ✅ Tested/Verified Live · ⏸ Blocked/Pending Decision

## 1. Attendance & Make-Up Engine
- ✅ Durable open-obligation table created for attendance/make-up/remediation tracking
- ✅ NCLEX completion rule: 100% required class attendance
- ✅ Create persistent required-session records for each NCLEX class meeting
- ⏸ Automatically record/reconcile student attendance from the approved class-access/Zoom pathway — production Zoom participation feed not yet connected to TLC backend
- ✅ Preserve original absence; never overwrite history
- ✅ Create an open make-up requirement when a required NCLEX session is missed
- 🟩 Automatically match that open requirement to the next valid future session
- 🟩 Student sees attendance history, missing requirements, and next opportunity
- ✅ Instructor sees course roster attendance and completion eligibility
- ✅ Course completion remains locked until all required attendance is satisfied
- 🟩 Student joins make-up class through the normal protected TLC class-access path
- 🟩 Successful make-up closes the open attendance requirement and preserves the original absence (completion depends on attendance evidence feed)

## 2. Skills / IV / Medical Technician Remediation Engine
- 🟩 Shared rule: unfinished requirements remain open until satisfied
- 🟩 Skills Refresher 16-item competency checklist exists
- 🟩 Skills Refresher roster/check-off workflow exists in Assessments & Skills
- 🟩 IV skills + knowledge-assessment gate exists
- 🟩 Medical Technician assessment + skills-readiness gate exists
- 🟩 Automatically create remediation requirement from documented failed competency evidence
- 🟩 Student sees exact failed requirement and remediation status
- 🟩 Add "Choose Next Remediation Date" self-service button
- 🟩 Only show ITASA-approved valid remediation opportunities
- 🟩 Automatically reserve selected remediation opportunity
- 🟩 Route student to approved remediation date, delivery mode, location/access note, and instructions
- 🟩 Reassessment closes requirement only when standard is met
- 🟩 Repeat remediation remains available until passed

## 3. Course Completion & Certificate Controls
- 🟩 Current NCLEX completion/certificate flow exists
- 🟩 Skills Refresher completion + certificate backend exists
- 🟩 IV completion/certificate backend exists
- 🟩 Medical Technician completion/certificate backend exists
- 🟩 Separate "Mark Training Complete" from "Issue / Print Certificate of Completion"
- 🟩 Completion button unlocks only after system-verified requirements are satisfied
- 🟩 Certificate issue button appears only after training completion; Print / Save COC appears only after certificate issuance
- 🟩 Printable COC includes instructor/validator identity, credential, signature line, and date-signed line
- 🟩 Show completion basis to instructor before completion action
- 🟩 Show completion/certificate status to student

## 4. Evidence & Pass/Fail Validation
- 🟩 Digital competency results exist for skills-based courses
- 🟩 Assessment scores are stored for IV/MT
- 🟩 Instructor identity/date/location are captured for skills validation
- 🟩 Signed checklist upload exists in Assessments & Skills
- 🟩 Require deficiency reason/evidence before remediation is created
- 🟩 Link failed competency to remediation requirement
- 🟩 Preserve all reassessment history
- 🟩 Student sees plain-language reason for remediation
- 🟩 Instructor sees evidence supporting pass/not-pass before completion

## 5. Audit Trail
- ✅ Functional validation: safe system-generated audit event written and Admin/IT viewer updated to display it
- 🟩 public.audit_log exists
- 🟩 RLS enabled on audit_log
- 🟩 Staff can read audit records
- ✅ Harden audit log to append-only for normal application roles
- ✅ Automatically log attendance events
- ✅ Automatically log assessment-result changes
- ✅ Automatically log competency-result changes
- 🟩 Automatically log remediation creation/resolution
- 🟨 Automatically log make-up scheduling/completion
- ✅ Automatically log course completion
- 🟩 Automatically log certificate issuance/printing events
- 🟩 Automatically log access-recovery events
- 🟩 Admin/IT Audit Trail viewer with category/retention visibility and filters
- 🟩 Separate 5-year training/compliance events from 180-day technical audit noise

## 6. Five-Year Retention & Purge
- 🟩 Training/compliance audit retention set to 5 years
- 🟩 Signed checklists/supporting evidence retained 5 years
- 🟩 Store retention/purge date with uploaded evidence
- 🟩 Scheduled purge job removes expired bulky evidence files
- 🟩 Keep lightweight purge audit record after file deletion
- 🟩 Preserve certificate/training audit records for full 5-year period
- 🟩 Routine technical/system audit records use 180-day retention with scheduled purge
- 🟩 Admin/IT can see upcoming/processed purge activity

## 7. Student Access Recovery — No Paid SMS
- 🟩 Rule: no paid SMS/texting services
- 🟩 "Forgot access code?" self-service email recovery
- 🟩 Time-limited recovery link
- 🟩 Reissue new access code and invalidate old code
- 🟩 Collect/verify backup email
- 🟩 Issue one-time recovery key from Student Home (one-time key, previous key invalidated)
- 🟩 "Forgot registration email?" guided masked-email reminder
- 🟩 Automated recovery through verified backup email/recovery key
- 🟩 Create Access Recovery Exception only when self-service fails
- 🟩 Admin/IT queue with Approve & Reissue Access / Deny / Needs Review
- 🟩 Approved recovery updates email, reissues access, closes case, logs audit event

## 8. Instructor Simplicity
- 🟨 Goal: Marie teaches; TLC handles routine administration
- 🟩 Course Workspaces now show all four ITASA courses consistently
- 🟩 Assessments & Skills includes IV, MT, and Skills Refresher roster workflows
- 🟩 Show course-level student counts
- 🟩 Group roster clearly by course
- 🟩 Show each student's current requirement/completion status at a glance
- ⬜ Minimize manual attendance work
- 🟩 Minimize manual remediation scheduling
- 🟩 Minimize manual access-recovery work
- 🟩 Keep exceptions in small Admin/IT action queues

## 9. Verification Discipline
For every feature:
1. Build
2. Test backend rule
3. Test instructor/admin workflow
4. Test student workflow
5. Test mobile/desktop where applicable
6. Verify live deployment
7. Only then mark ✅ Verified Live

## Current Build Order
1. ✅ Audit + durable requirement foundation
2. 🟨 NCLEX automated attendance/make-up engine — Zoom evidence feed is the remaining external dependency
3. 🟩 Shared remediation scheduling engine — built; end-to-end review-account verification pending
4. 🟨 Two-step training completion / COC controls — built; end-to-end review-account verification pending
5. 🟨 Five-year retention/purge automation — built and automation test passed with no due files; live evidence-file lifecycle verification pending
6. 🟨 Free student access-recovery system — built; live email-delivery verification depends on the existing Resend/domain release hold
7. 🟨 Admin/IT queues + audit viewer — recovery queue and audit filters built; remaining exception/QA work pending
8. ⬜ Final cross-course QA and live verification
