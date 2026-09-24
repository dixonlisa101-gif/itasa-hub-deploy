/*
 * ITASA Learning Center — Hub vNext public controller.
 *
 * GenSpark-independent preview architecture:
 * browser -> Supabase Data API/RPCs -> Stripe only after registration when a
 * confirmed direct checkout link exists.
 *
 * No D1, Worker table API, localStorage database, or GenSpark route is used.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://eigkebtzkhyglsqdfpvr.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yXPEpK3gC5p91PH8-tmJgw_BuM8Y5Zv';

  // Preserved, confirmed Pay-in-Full checkout configuration from the existing
  // ITASA source. Non-full/promotional choices intentionally have no invented
  // checkout URL; ITASA follow-up completes those choices.
  var PAYMENT_CONFIG = {
    review: {
      standardPrice: '$1,199',
      checkoutUrl: 'https://buy.stripe.com/3cI9AT02q6ErdgIer67Vm01',
      options: [
        { key: 'full', label: 'Pay in Full', amountText: '$1,199' },
        { key: '2pay', label: '2 Payments', amountText: '$650 × 2 = $1,300' },
        { key: '3pay', label: '3 Payments', amountText: '$450 × 3 = $1,350' }
      ],
      promo: {
        ends: '2026-10-31',
        priceText: '$999',
        options: [
          { key: 'promo_full', label: 'Promotional Price — Pay in Full', amountText: '$999' },
          { key: 'promo_2pay', label: 'Promotional Payment Option', amountText: '2 Payments of $500 = $1,000' }
        ]
      }
    },
    skills: {
      standardPrice: '$1,999',
      checkoutUrl: 'https://buy.stripe.com/28E28r9D04wj5Og1Ek7Vm03',
      options: [
        { key: 'full', label: 'Pay in Full', amountText: '$1,999' },
        { key: '2pay', label: '2 Payments', amountText: '$1,050 × 2 = $2,100' },
        { key: '3pay', label: '3 Payments', amountText: '$700 × 3 = $2,100' },
        { key: '4pay', label: '4 Payments', amountText: '$550 × 4 = $2,200' }
      ],
      promo: {
        ends: '2026-10-31',
        priceText: '$1,799',
        options: [
          { key: 'promo_full', label: 'Promotional Price — Pay in Full', amountText: '$1,799' },
          { key: 'promo_3pay', label: 'Promotional Payment Option', amountText: '3 Payments of $600 = $1,800' }
        ]
      }
    },
    iv: {
      standardPrice: '$599',
      checkoutUrl: 'https://buy.stripe.com/8x28wPeXkgf15Og0Ag7Vm02',
      options: [
        { key: 'full', label: 'Pay in Full', amountText: '$599' }
      ],
      promo: null
    }
  };

  function client() {
    if (window.__itasaPublicHubClient) return window.__itasaPublicHubClient;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    window.__itasaPublicHubClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    return window.__itasaPublicHubClient;
  }

  function dateOnlyInEastern(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    var obj = {};
    parts.forEach(function (p) { if (p.type !== 'literal') obj[p.type] = p.value; });
    return [obj.year, obj.month, obj.day].join('-');
  }

  function todayEastern() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    var obj = {};
    parts.forEach(function (p) { if (p.type !== 'literal') obj[p.type] = p.value; });
    return [obj.year, obj.month, obj.day].join('-');
  }

  function isFirstDay(classRow) {
    return !!classRow && dateOnlyInEastern(classRow.start_date) === todayEastern();
  }

  function promoIsActive(promo) {
    return !!promo && todayEastern() <= promo.ends;
  }

  function paymentOptions(courseId, classRow) {
    var cfg = PAYMENT_CONFIG[courseId];
    if (!cfg) return [];
    if (isFirstDay(classRow)) return cfg.options.filter(function (o) { return o.key === 'full'; });
    var all = cfg.options.slice();
    if (promoIsActive(cfg.promo)) all = all.concat(cfg.promo.options);
    return all;
  }

  function checkoutFor(courseId, paymentOptionKey) {
    var cfg = PAYMENT_CONFIG[courseId];
    if (!cfg || paymentOptionKey !== 'full') return null;
    return cfg.checkoutUrl || null;
  }

  async function getClasses() {
    if (window.ItasaSharedContentSupabase) {
      var result = await window.ItasaSharedContentSupabase.fetchCollection('classes');
      if (result.error) throw result.error;
      return result.data || [];
    }
    var c = client();
    if (!c) throw new Error('Supabase client unavailable.');
    var response = await c
      .from('itasa_shared_content')
      .select('record,source_order,updated_at')
      .eq('collection', 'classes')
      .order('source_order', { ascending: true, nullsFirst: false });
    if (response.error) throw response.error;
    return (response.data || []).map(function (row) { return row.record || {}; });
  }

  async function submitInformationSession(entry) {
    var c = client();
    if (!c) return { status: 'error', error: new Error('Supabase client unavailable.') };
    try {
      var result = await c.rpc('submit_information_session_interest_vnext', {
        p_first_name: entry.first_name || '',
        p_last_name: entry.last_name || '',
        p_email: entry.email || '',
        p_phone: entry.phone || null,
        p_course_interest: entry.course_interest || 'general',
        p_support_notes: entry.support_notes || null,
        p_follow_up_consent: !!entry.follow_up_consent
      });
      if (result.error) return { status: 'error', error: result.error };
      return result.data || { status: 'error' };
    } catch (err) {
      return { status: 'error', error: err };
    }
  }

  async function submitRegistration(entry) {
    var c = client();
    if (!c) return { status: 'error', error: new Error('Supabase client unavailable.') };
    try {
      var result = await c.rpc('submit_student_registration_hub_vnext', {
        p_first_name: entry.first_name || '',
        p_last_name: entry.last_name || '',
        p_email: entry.email || '',
        p_course_id: entry.course_id || '',
        p_payment_option: entry.payment_option || '',
        p_phone: entry.phone || null,
        p_preferred_contact: entry.preferred_contact || null,
        p_professional_support_ack: !!entry.professional_support_ack,
        p_certificate_outcomes_ack: !!entry.certificate_outcomes_ack,
        p_learning_center_disclaimer_ack: !!entry.learning_center_disclaimer_ack,
        p_payment_policy_ack: !!entry.payment_policy_ack,
        p_first_day_full_payment_ack: !!entry.first_day_full_payment_ack
      });
      if (result.error) return { status: 'error', error: result.error };
      return result.data || { status: 'error' };
    } catch (err) {
      return { status: 'error', error: err };
    }
  }


  async function submitOneOnOne(entry) {
    var c = client();
    if (!c) return { status: 'error', error: new Error('Supabase client unavailable.') };
    try {
      var result = await c.rpc('submit_one_on_one_request_vnext', {
        p_first_name: entry.first_name || '',
        p_last_name: entry.last_name || '',
        p_email: entry.email || '',
        p_session_length: entry.session_length || '',
        p_preferred_datetime_1: entry.preferred_datetime_1 || '',
        p_phone: entry.phone || null,
        p_assistance_needed: entry.assistance_needed || null,
        p_preferred_datetime_2: entry.preferred_datetime_2 || null,
        p_preferred_datetime_3: entry.preferred_datetime_3 || null,
        p_acknowledgement: !!entry.acknowledgement
      });
      if (result.error) return { status: 'error', error: result.error };
      return result.data || { status: 'error' };
    } catch (err) {
      return { status: 'error', error: err };
    }
  }

  window.ItasaPublicHubVNext = {
    getClasses: getClasses,
    submitInformationSession: submitInformationSession,
    submitRegistration: submitRegistration,
    submitOneOnOne: submitOneOnOne,
    paymentOptions: paymentOptions,
    checkoutFor: checkoutFor,
    isFirstDay: isFirstDay,
    paymentConfig: PAYMENT_CONFIG
  };
})();