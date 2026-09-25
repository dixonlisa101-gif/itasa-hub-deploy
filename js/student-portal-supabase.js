/*
 * ITASA Learning Center — PREPARED (NOT YET WIRED) Supabase bridge for the
 * public student Learning Center sign-in / dashboard.
 *
 * STATUS: this file is part of the Student Cutover preparation package only.
 * It is NOT referenced by any <script> tag in index.html or workspace.html
 * yet, and calling any function it exposes has no effect on the live site
 * today. It will only become active once a separate, explicit future task
 * adds a <script src="js/student-portal-supabase.js"></script> tag AND
 * rewires handlePortalLogin() / enhancePortal() to call it in place of the
 * current local-cache-only email lookup. Committing this file does not
 * deploy or change any current live behavior by itself.
 *
 * PURPOSE AT CUTOVER: replace the D1/local-cache-based student lookup
 * (js/shared-sync.js fetching the entire `tables/students` list into the
 * browser, then matching by email client-side) with a single, narrowly
 * scoped call to the Supabase RPC public.student_portal_login(email,
 * access_code) — defined in supabase/migration-005-student-portal-access.sql
 * — which validates the email + access-code pair server-side and returns
 * data for exactly one student, never the whole table. anon still has ZERO
 * direct SELECT access to public.students; this RPC is the only path.
 *
 * CREDENTIAL MODEL: unchanged from the live app — email + access code
 * (portal_code), submitted together. No Supabase Auth session for students,
 * exactly as today. See migration-005's inline comments for the exact
 * result contract (not_found / pending_review / invalid_code / ok) that
 * intentionally mirrors handlePortalLogin()'s existing three messages, plus
 * the success case, so no UI copy needs to change at cutover.
 *
 * REVISION NOTES (this revision — fixes applied per the Student Cutover
 * bounded-revision request, before any wiring/deployment):
 *
 *   (1) `login()` now extracts and returns the Supabase `id` alongside the
 *       reshaped student object ONLY on a successful ('ok') result — never
 *       on not_found/pending_review/invalid_code/error. This is required
 *       because the live app's session object is created as
 *       `setSession({role:'student', studentId: st.id, ...})`; at cutover,
 *       `studentId` would be populated from this `id`.
 *
 *   (2) Added `mapPortalStudent(row, programs)` — a reshaping function that
 *       converts the RPC's flat snake_case payload into the EXACT nested
 *       object shape the existing dashboard code already expects, so
 *       enhancePortal() / renderPaymentStage() / normalizeStudent() do not
 *       need to change at all at cutover. This mirrors the precedent
 *       already established by `mapStudentRow(row, programs)` in
 *       js/workspace-supabase.js (the staff-side bridge), which reshapes a
 *       Supabase row into the same `financial{}` shape the same way.
 *
 *       Field-by-field mapping (dashboard contract -> source):
 *         - financial.tuition          <- looked up LIVE from the `programs`
 *                                          reference array by program_id,
 *                                          exactly as normalizeStudent() /
 *                                          renderPaymentStage() do today
 *                                          (`Number(programs.find(x =>
 *                                          x.id === row.program_id)?.price
 *                                          || 0)`). Tuition is never stored
 *                                          per-student in Supabase or D1 —
 *                                          this preserves that.
 *         - financial.amountPaid       <- row.amount_paid (stored column)
 *         - financial.remainingBalance <- row.remaining_balance (stored column)
 *         - financial.nextPaymentDue   <- row.next_payment_due (stored column)
 *         - financial.paymentStatus    <- row.payment_status (stored column)
 *         - financial.receiptLink      <- row.stripe_receipt_url (stored
 *                                          column; '' if absent). This is the
 *                                          real backing value for the
 *                                          dashboard's "Receipt" link.
 *         - financial.invoiceLink      <- '' (always). The live app's only
 *                                          invoiceLink value today is a
 *                                          synthetic local anchor string
 *                                          (`#invoice-${studentId}-
 *                                          ${paymentId}`) generated inside
 *                                          finalizeEnrollmentAfterPayment()/
 *                                          confirmRemainingBalancePayment() —
 *                                          both of which are REMOVED at
 *                                          cutover (see requirement 4). There
 *                                          is no genuinely stored invoice
 *                                          link anywhere in Supabase, so per
 *                                          "do not invent a new database
 *                                          column", this is left blank rather
 *                                          than fabricated or backed by a new
 *                                          column.
 *         - financial.enrollmentOption <- the fixed literal 'complete',
 *                                          matching what the RPC returns and
 *                                          what createOrUpdateRegistration()
 *                                          hardcodes on every registration
 *                                          today. No Supabase column is
 *                                          referenced or invented for this.
 *         - financial.history          <- [] (always). payment_history is
 *                                          intentionally never returned by
 *                                          the anon-callable RPC (it is
 *                                          staff/Zapier-internal), so there
 *                                          is nothing to reshape here.
 *         - portalAccess / portalCode / certificateStatus / intake /
 *           progress / programId / cohortId / enrollmentStatus / paymentStatus
 *                                       <- straight passthrough from the RPC
 *                                          row (renamed to the camelCase keys
 *                                          the dashboard already reads).
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://eigkebtzkhyglsqdfpvr.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yXPEpK3gC5p91PH8-tmJgw_BuM8Y5Zv';

  function getClient() {
    if (window.__itasaStudentPortalClient) return window.__itasaStudentPortalClient;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    window.__itasaStudentPortalClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    return window.__itasaStudentPortalClient;
  }

  var SESSION_KEY = 'itasa_student_session_v1';
  var SESSION_TTL_MS = 8 * 60 * 60 * 1000;

  function setSessionCredentials(email, accessCode) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        email: (email || '').trim().toLowerCase(),
        accessCode: accessCode || '',
        savedAt: Date.now()
      }));
      return true;
    } catch (e) {
      console.error('ITASA student portal: unable to save session credentials', e);
      return false;
    }
  }

  function getSessionCredentials() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.email || !data.accessCode || !data.savedAt) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      if (Date.now() - Number(data.savedAt) > SESSION_TTL_MS) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { email: data.email, accessCode: data.accessCode };
    } catch (e) {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
      return null;
    }
  }

  function clearSessionCredentials() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  /**
   * Reshapes the RPC's flat snake_case student payload into the exact
   * nested camelCase object shape the existing dashboard code
   * (normalizeStudent() / enhancePortal() / renderPaymentStage()) already
   * expects, so none of that code needs to change at cutover.
   * @param {object} row - the `student` object from a successful RPC result
   * @param {Array<{id:string, price:number}>} programs - the same static
   *   `programs` reference array the live app already holds client-side
   *   (`s.programs` today), used only to look up tuition by program_id —
   *   never a new stored value.
   * @returns {object}
   */
  function mapPortalStudent(row, programs) {
    row = row || {};
    var program = (programs || []).find(function (p) { return p && p.id === row.program_id; });
    var tuition = Number((program && program.price) || 0);
    return {
      id: row.id,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      programId: row.program_id || '',
      cohortId: row.cohort_id || '',
      enrollmentOption: 'complete',
      enrollmentStatus: row.enrollment_status || '',
      paymentStatus: row.payment_status || 'pending',
      portalAccess: !!row.portal_access,
      portalCode: row.portal_code || '',
      certificateStatus: row.certificate_status || 'not issued',
      intake: row.intake || {},
      progress: row.progress || {},
      financial: {
        tuition: tuition,
        amountPaid: Number(row.amount_paid || 0),
        remainingBalance: Number(row.remaining_balance || 0),
        nextPaymentDue: row.next_payment_due || '',
        paymentStatus: row.payment_status || 'pending',
        receiptLink: row.stripe_receipt_url || '',
        invoiceLink: '',
        enrollmentOption: 'complete',
        history: []
      }
    };
  }

  /**
   * Validates one email + access-code pair against Supabase and, on
   * success, returns the reshaped student object the live dashboard already
   * expects, PLUS the top-level `id` needed to populate the session's
   * `studentId`. Does not throw on a wrong credential — that is a normal
   * `{status: '...'}` result, not an error, matching how handlePortalLogin()
   * already treats a bad login as a status message rather than an
   * exception. `id` is present ONLY when status === 'ok'.
   * @param {string} email
   * @param {string} accessCode
   * @param {Array<{id:string, price:number}>} [programs] - optional; pass
   *   the live app's `programs` reference array so tuition can be derived
   *   the same way it is today. If omitted, tuition defaults to 0.
   * @returns {Promise<{status:string, id?:string, student?:object, error?:Error}>}
   */
  async function login(email, accessCode, programs) {
    var client = getClient();
    if (!client) {
      return { status: 'error', error: new Error('Supabase client library failed to load.') };
    }
    try {
      var result = await client.rpc('student_portal_login', {
        p_email: email || '',
        p_access_code: accessCode || ''
      });
      if (result.error) return { status: 'error', error: result.error };
      var payload = result.data || {};
      if (payload.status !== 'ok' || !payload.student) {
        // not_found / pending_review / invalid_code — never include id.
        return { status: payload.status || 'error' };
      }
      var mapped = mapPortalStudent(payload.student, programs);
      return { status: 'ok', id: mapped.id, student: mapped };
    } catch (err) {
      return { status: 'error', error: err };
    }
  }

  // At cutover, the frontend's handlePortalLogin() would call
  // window.ItasaStudentPortal.login(email, accessCode, s.programs) once at
  // sign-in, cache the validated {email, accessCode} pair in sessionStorage
  // alongside the existing session object (using result.id as studentId in
  // setSession({role:'student', studentId: result.id, ...})), and
  // enhancePortal() would call login() again (silently, with the cached
  // pair) whenever the dashboard needs a fresh read — never caching student
  // data itself beyond the current page view, matching the "no redesign of
  // authentication" instruction.

  /**
   * SECURE replacement for the old getClassAccess(cohortId). Reads the
   * real, staff-populated Zoom class-access details (link, meeting ID,
   * passcode, class time, note) for the CALLING STUDENT'S OWN current
   * class only, via the anon-callable SECURITY DEFINER RPC
   * public.get_my_class_access — see
   * supabase/migration-008-secure-zoom-access-bridge.sql.
   *
   * SECURITY: this function takes the student's email + access code (the
   * SAME two values already used for Learning Center sign-in), NEVER a
   * cohort id. The server validates that pair and resolves the student's
   * cohort internally — a student can never request or receive another
   * cohort's Zoom credentials through this path. This replaces the old
   * getClassAccess(cohortId) design (migration-007), which took an
   * unauthenticated cohort_id directly from the client and has been
   * retired for that reason (it was never run against production).
   *
   * Returns a plain object shaped for renderStudentClassAccess():
   * { link, meetingId, passcode, classTime, note } on success, or null when
   * the credential pair does not validate, no access details have been
   * posted yet for this student's cohort, or the RPC is unavailable (e.g.
   * migration-008 has not been run yet in Supabase) — in every case the
   * caller should fall back to its existing "not yet available" placeholder
   * copy, never throw.
   *
   * @param {string} email
   * @param {string} accessCode
   * @returns {Promise<{link:string, meetingId:string, passcode:string, classTime:string, note:string}|null>}
   */
  async function getZoomAccess(email, accessCode) {
    if (!email || !accessCode) return null;
    var client = getClient();
    if (!client) return null;
    try {
      var result = await client.rpc('get_my_class_access', {
        p_email: email,
        p_access_code: accessCode
      });
      if (result.error) {
        console.error('ITASA student portal: get_my_class_access failed', result.error);
        return null;
      }
      var payload = result.data || {};
      if (payload.status !== 'ok' || !payload.access) return null;
      var a = payload.access;
      return {
        link: a.link || '',
        meetingId: a.meeting_id || '',
        passcode: a.passcode || '',
        classTime: a.class_time || '',
        note: a.note || ''
      };
    } catch (err) {
      console.error('ITASA student portal: get_my_class_access threw', err);
      return null;
    }
  }

  /**
   * getLearningWorkspace(email, accessCode)
   *
   * Calls the protected get_my_learning_workspace RPC using the SAME
   * validated email/access code already used for login()/getZoomAccess() —
   * this function does not perform any credential validation of its own
   * and does not create any new account/credential system. It is purely an
   * additive bridge call for the multi-course Learning Workspace renderer.
   *
   * The RPC is the sole authority for course/section/item/requirement data
   * (offerings, course_versions, student_enrollments,
   * completion_requirements, student_requirement_progress,
   * course_sections, course_items, etc.) — the browser never queries those
   * tables directly. This function returns the RPC response payload
   * exactly as received (no reshaping), since the shape is documented and
   * owned by the backend/RPC contract, not by this bridge file.
   *
   * Never throws. On any client/RPC failure, logs via console.error and
   * resolves to {status:'error'} so callers can simply check
   * `result.status` before rendering.
   *
   * @param {string} email
   * @param {string} accessCode
   * @returns {Promise<object>} RPC response payload, or {status:'error'}
   */
  async function getLearningWorkspace(email, accessCode) {
    var client = getClient();
    if (!client) {
      console.error('ITASA student portal: getLearningWorkspace failed — Supabase client unavailable.');
      return { status: 'error' };
    }
    try {
      var result = await client.rpc('get_my_learning_workspace', {
        p_email: (email || '').trim().toLowerCase(),
        p_access_code: (accessCode || '').trim()
      });
      if (result.error) {
        console.error('ITASA student portal: get_my_learning_workspace failed', result.error);
        return { status: 'error' };
      }
      return result.data || { status: 'error' };
    } catch (err) {
      console.error('ITASA student portal: get_my_learning_workspace threw', err);
      return { status: 'error' };
    }
  }


  /**
   * getIvReviewPreview(email, accessCode)
   *
   * Credential-checked review bridge for the designated IV REVIEW TEST
   * student account. It returns the draft IV curriculum without changing
   * offering/course publication status or granting access to real students.
   */
  async function getIvReviewPreview(email, accessCode) {
    var client = getClient();
    if (!client) return { status: 'error' };
    try {
      var result = await client.rpc('get_iv_review_student_preview', {
        p_email: (email || '').trim().toLowerCase(),
        p_access_code: (accessCode || '').trim()
      });
      if (result.error) {
        console.error('ITASA student portal: get_iv_review_student_preview failed', result.error);
        return { status: 'error' };
      }
      return result.data || { status: 'error' };
    } catch (err) {
      console.error('ITASA student portal: get_iv_review_student_preview threw', err);
      return { status: 'error' };
    }
  }


  async function getSkillsReviewPreview(email, accessCode) {
    var client = getClient();
    if (!client) return { status: 'error' };
    try {
      var result = await client.rpc('get_skills_review_student_preview', {
        p_email: (email || '').trim().toLowerCase(),
        p_access_code: (accessCode || '').trim()
      });
      if (result.error) {
        console.error('ITASA student portal: get_skills_review_student_preview failed', result.error);
        return { status: 'error' };
      }
      return result.data || { status: 'error' };
    } catch (err) {
      console.error('ITASA student portal: get_skills_review_student_preview threw', err);
      return { status: 'error' };
    }
  }


  async function getMedtechReviewPreview(email, accessCode) {
    var client = getClient();
    if (!client) return { status: 'error' };
    try {
      var result = await client.rpc('get_medtech_review_student_preview', {
        p_email: (email || '').trim().toLowerCase(),
        p_access_code: (accessCode || '').trim()
      });
      if (result.error) {
        console.error('ITASA student portal: get_medtech_review_student_preview failed', result.error);
        return { status: 'error' };
      }
      return result.data || { status: 'error' };
    } catch (err) {
      console.error('ITASA student portal: get_medtech_review_student_preview threw', err);
      return { status: 'error' };
    }
  }


  /**
   * getCertificates(email, accessCode)
   *
   * Read-only certificate retrieval for the validated student via the
   * production public.get_my_course_certificates RPC. The RPC verifies the
   * same email + access-code pair used by the portal login and only returns
   * certificate records linked to that student's own enrollments.
   *
   * This function never writes to the database and never queries
   * public.certificates directly from the browser.
   *
   * @param {string} email
   * @param {string} accessCode
   * @returns {Promise<object>} RPC response payload, or {status:'error'}
   */
  async function getCertificates(email, accessCode) {
    var client = getClient();
    if (!client) {
      console.error('ITASA student portal: getCertificates failed — Supabase client unavailable.');
      return { status: 'error' };
    }
    try {
      var result = await client.rpc('get_my_course_certificates', {
        p_email: (email || '').trim().toLowerCase(),
        p_access_code: (accessCode || '').trim()
      });
      if (result.error) {
        console.error('ITASA student portal: get_my_course_certificates failed', result.error);
        return { status: 'error' };
      }
      return result.data || { status: 'error' };
    } catch (err) {
      console.error('ITASA student portal: get_my_course_certificates threw', err);
      return { status: 'error' };
    }
  }

  window.ItasaStudentPortal = {
    login: login,
    mapPortalStudent: mapPortalStudent,
    getZoomAccess: getZoomAccess,
    getLearningWorkspace: getLearningWorkspace,
    getIvReviewPreview: getIvReviewPreview,
    getSkillsReviewPreview: getSkillsReviewPreview,
    getMedtechReviewPreview: getMedtechReviewPreview,
    getCertificates: getCertificates,
    setSessionCredentials: setSessionCredentials,
    getSessionCredentials: getSessionCredentials,
    clearSessionCredentials: clearSessionCredentials
  };
})();
