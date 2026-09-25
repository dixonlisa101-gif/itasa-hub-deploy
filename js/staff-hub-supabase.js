/*
 * ITASA Hub vNext — staff auth + Information Session roster.
 *
 * Preview branch only. This is intentionally independent of GenSpark's
 * workspace.html route and uses Supabase Auth + RLS as the authorization
 * boundary.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://eigkebtzkhyglsqdfpvr.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yXPEpK3gC5p91PH8-tmJgw_BuM8Y5Zv';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('ITASA staff hub: Supabase client unavailable.');
    return;
  }

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  var currentStaff = null;
  var resolved = false;
  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) {
      try { fn({ staff: currentStaff, resolved: resolved }); } catch (e) {}
    });
  }

  async function resolveStaff() {
    resolved = false;
    emit();
    try {
      var sess = await client.auth.getSession();
      var user = sess && sess.data && sess.data.session ? sess.data.session.user : null;
      if (!user) {
        currentStaff = null;
        resolved = true;
        emit();
        return null;
      }

      var result = await client
        .from('staff')
        .select('id,email,full_name,role,active')
        .eq('id', user.id)
        .maybeSingle();

      if (result.error) throw result.error;
      if (!result.data || !result.data.active) {
        currentStaff = null;
      } else {
        currentStaff = {
          id: result.data.id,
          email: result.data.email,
          full_name: result.data.full_name || '',
          role: result.data.role || ''
        };
      }
    } catch (err) {
      console.error('ITASA staff hub: resolveStaff failed', err);
      currentStaff = null;
    }
    resolved = true;
    emit();
    return currentStaff;
  }

  client.auth.onAuthStateChange(function () {
    setTimeout(resolveStaff, 0);
  });

  async function signIn(email, password) {
    var result = await client.auth.signInWithPassword({
      email: (email || '').trim().toLowerCase(),
      password: password || ''
    });
    if (result.error) return { ok: false, error: result.error };
    var staff = await resolveStaff();
    if (!staff) {
      await client.auth.signOut();
      return { ok: false, error: new Error('This account is not active ITASA staff.') };
    }
    return { ok: true, staff: staff };
  }

  async function signOut() {
    try { await client.auth.signOut(); }
    finally {
      currentStaff = null;
      resolved = true;
      emit();
    }
  }

  async function fetchInfoSessionRoster() {
    if (!currentStaff) throw new Error('Staff sign-in required.');

    var result = await client
      .from('interest_list')
      .select([
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'nursing_school',
        'graduation_date',
        'nclex_exam_type',
        'attempt_status',
        'testing_timeframe',
        'referral_source',
        'support_notes',
        'prospect_intent',
        'program_interest',
        'info_session_attendance',
        'info_session_attendance_at',
        'info_session_attendance_by',
        'created_at'
      ].join(','))
      .eq('prospect_intent', 'nclex_info_session')
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function updateAttendance(id, status) {
    if (!currentStaff) throw new Error('Staff sign-in required.');
    var allowed = ['registered', 'Attended', 'No-show', 'Blocked'];
    if (allowed.indexOf(status) === -1) throw new Error('Invalid attendance status.');

    var result = await client
      .from('interest_list')
      .update({ info_session_attendance: status })
      .eq('id', id)
      .select('id,info_session_attendance,info_session_attendance_at,info_session_attendance_by')
      .single();

    if (result.error) throw result.error;
    return result.data;
  }


  function requireStaff() {
    if (!currentStaff) throw new Error('Staff sign-in required.');
    return currentStaff;
  }

  function requireOperator() {
    var st = requireStaff();
    if (['administrator', 'instructor'].indexOf(st.role) === -1) {
      throw new Error('Administrator or instructor access required.');
    }
    return st;
  }

  // READ-ONLY financial/access roster. The operations UI intentionally does
  // not expose manual payment mutation or portal-access grant controls.
  async function fetchStudents() {
    requireStaff();
    var result = await client
      .from('students')
      .select([
        'id','first_name','last_name','email','phone','program_id','cohort_id',
        'payment_status','enrollment_status','portal_access','intake_complete',
        'certificate_status','amount_paid','remaining_balance','next_payment_due',
        'payment_option','registration_email_sent','payment_email_sent',
        'access_email_sent','created_at','updated_at','intake'
      ].join(','))
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function fetchClassAccess() {
    requireStaff();
    var result = await client
      .from('class_access')
      .select('id,cohort_id,class_time,link,meeting_id,passcode,note,updated_at,updated_by')
      .order('cohort_id', { ascending: true });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function upsertClassAccess(entry) {
    requireOperator();
    var cohortId = String(entry && entry.cohort_id || '').trim();
    if (!cohortId) throw new Error('Class/cohort is required.');
    var row = {
      cohort_id: cohortId,
      class_time: String(entry && entry.class_time || '').trim() || null,
      link: String(entry && entry.link || '').trim() || null,
      meeting_id: String(entry && entry.meeting_id || '').trim() || null,
      passcode: String(entry && entry.passcode || '').trim() || null,
      note: String(entry && entry.note || '').trim() || null
    };
    var result = await client
      .from('class_access')
      .upsert(row, { onConflict: 'cohort_id' })
      .select('id,cohort_id,class_time,link,meeting_id,passcode,note,updated_at,updated_by')
      .single();
    if (result.error) throw result.error;
    return result.data;
  }


  async function fetchServiceAccess() {
    requireStaff();
    var result = await client
      .from('service_access')
      .select('service_key,service_name,link,meeting_id,passcode,schedule_text,note,updated_at,updated_by')
      .order('service_key', { ascending: true });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function upsertServiceAccess(entry) {
    var st=requireStaff();
    if (String(st.role || '').toLowerCase() !== 'administrator') {
      throw new Error('Administrator access required.');
    }
    var serviceKey=String(entry && entry.service_key || '').trim();
    if (['information_session','one_on_one'].indexOf(serviceKey)===-1) {
      throw new Error('Invalid service access key.');
    }
    var row={
      service_key: serviceKey,
      service_name: serviceKey==='information_session'?'ITASA Information Session':'1:1 Test-Taking Strategies Session',
      link: String(entry && entry.link || '').trim() || null,
      meeting_id: String(entry && entry.meeting_id || '').trim() || null,
      passcode: String(entry && entry.passcode || '').trim() || null,
      schedule_text: String(entry && entry.schedule_text || '').trim() || null,
      note: String(entry && entry.note || '').trim() || null,
      updated_by: st.id,
      updated_at: new Date().toISOString()
    };
    var result=await client
      .from('service_access')
      .upsert(row,{onConflict:'service_key'})
      .select('service_key,service_name,link,meeting_id,passcode,schedule_text,note,updated_at,updated_by')
      .single();
    if(result.error) throw result.error;
    return result.data;
  }

  async function fetchCertificates() {
    requireStaff();
    var result = await client
      .from('certificates')
      .select([
        'id','student_id','cohort_id','status','issued_at','certificate_url',
        'number','completion_date','program_id','certificate_title',
        'training_hours','provider_name','trainer_name','trainer_credential',
        'training_location','created_at'
      ].join(','))
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function fetchOneOnOneRequests() {
    requireOperator();
    var result = await client
      .from('one_on_one_session_requests')
      .select([
        'id','program_id','first_name','last_name','email','phone',
        'session_length','session_amount','pricing_version','assistance_needed',
        'preferred_datetime_1','preferred_datetime_2','preferred_datetime_3',
        'confirmed_datetime','status','status_history','portal_code','access_issued_at',
        'zoom_link','meeting_id','passcode','created_at','updated_at'
      ].join(','))
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function updateOneOnOneStatus(id, status, confirmedDatetime, details) {
    requireOperator();
    var allowed = ['Pending','Approved','Request Different Times','Declined','Payment Sent','Paid','Completed'];
    if (allowed.indexOf(status) === -1) throw new Error('Invalid 1:1 request status.');
    if (status === 'Approved' && !String(confirmedDatetime || '').trim()) {
      throw new Error('Confirmed appointment date/time is required when approving.');
    }
    var patch = { status: status };
    if (status === 'Approved') patch.confirmed_datetime = String(confirmedDatetime).trim();
    details = details || {};
    if (Object.prototype.hasOwnProperty.call(details,'zoom_link')) patch.zoom_link = String(details.zoom_link || '').trim() || null;
    if (Object.prototype.hasOwnProperty.call(details,'meeting_id')) patch.meeting_id = String(details.meeting_id || '').trim() || null;
    if (Object.prototype.hasOwnProperty.call(details,'passcode')) patch.passcode = String(details.passcode || '').trim() || null;

    var result = await client
      .from('one_on_one_session_requests')
      .update(patch)
      .eq('id', id)
      .select('id,status,confirmed_datetime,zoom_link,meeting_id,passcode,status_history,updated_at')
      .single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function fetchAuditLog(limit) {
    requireStaff();
    var n = Math.max(1, Math.min(Number(limit) || 50, 200));
    var result = await client
      .from('audit_log')
      .select('id,actor_name,role,action,target_type,target_id,details,at')
      .order('at', { ascending: false })
      .limit(n);
    if (result.error) throw result.error;
    return result.data || [];
  }




  async function fetchInstructorReadiness() {
    requireStaff();
    var result = await client.rpc('get_my_instructor_readiness');
    if (result.error) throw result.error;
    return result.data || { status: 'error', assignments: [], credentials: [] };
  }

  async function fetchAssessmentSkillsRoster() {
    requireOperator();
    var result = await client.rpc('get_assessment_skills_roster');
    if (result.error) throw result.error;
    return result.data || { status: 'error', rows: [] };
  }

  async function fetchKnowledgeFeed(channel, offeringKey, limit) {
    requireStaff();
    var result = await client.rpc('get_my_staff_knowledge_feed', {
      p_channel: channel || 'updates',
      p_offering_key: offeringKey || null,
      p_limit: Number(limit || 50)
    });
    if (result.error) throw result.error;
    return result.data || { status: 'error', items: [] };
  }

  async function fetchNclexCompletionRoster() {
    requireOperator();
    var result = await client.rpc('get_nclex_completion_roster');
    if (result.error) throw result.error;
    return result.data || { status: 'error', rows: [] };
  }

  async function completeNclexStudent(studentId) {
    requireOperator();
    var result = await client.rpc('complete_nclex_student_and_issue_certificate', {
      p_student_id: studentId
    });
    if (result.error) throw result.error;
    return result.data || { status: 'error' };
  }


  async function fetchItSystemOversight() {
    requireStaff();
    var result = await client.rpc('get_it_system_oversight');
    if (result.error) throw result.error;
    return result.data || { status: 'error' };
  }

  function onSessionChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (x) { return x !== fn; });
    };
  }

  window.ItasaStaffHub = {
    client: client,
    signIn: signIn,
    signOut: signOut,
    resolveStaff: resolveStaff,
    getCurrentStaff: function () { return currentStaff; },
    isResolved: function () { return resolved; },
    fetchInfoSessionRoster: fetchInfoSessionRoster,
    updateAttendance: updateAttendance,
    fetchStudents: fetchStudents,
    fetchClassAccess: fetchClassAccess,
    upsertClassAccess: upsertClassAccess,
    fetchServiceAccess: fetchServiceAccess,
    upsertServiceAccess: upsertServiceAccess,
    fetchCertificates: fetchCertificates,
    fetchOneOnOneRequests: fetchOneOnOneRequests,
    updateOneOnOneStatus: updateOneOnOneStatus,
    fetchAuditLog: fetchAuditLog,
    fetchInstructorReadiness: fetchInstructorReadiness,
    fetchAssessmentSkillsRoster: fetchAssessmentSkillsRoster,
    fetchKnowledgeFeed: fetchKnowledgeFeed,
    fetchNclexCompletionRoster: fetchNclexCompletionRoster,
    completeNclexStudent: completeNclexStudent,
    fetchItSystemOversight: fetchItSystemOversight,
    onSessionChange: onSessionChange
  };

  resolveStaff();
})();