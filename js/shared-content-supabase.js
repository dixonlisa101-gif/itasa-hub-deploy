/*
 * ITASA Hub vNext — public shared-content Supabase bridge.
 *
 * Preview branch only. Replaces the student-facing D1/local-cache reads for
 * classes, announcements, and IV Q&A with the existing Supabase
 * public.itasa_shared_content table.
 *
 * SECURITY:
 * - Uses only the browser-safe Supabase publishable key.
 * - Reads only the three collections allowed by the existing
 *   shared_public_read RLS policy.
 * - Performs no INSERT/UPDATE/DELETE.
 * - Never uses a service-role/secret key.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://eigkebtzkhyglsqdfpvr.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yXPEpK3gC5p91PH8-tmJgw_BuM8Y5Zv';
  var ALLOWED = ['classes', 'announcements', 'iv_qa'];

  function client() {
    if (window.__itasaSharedContentClient) return window.__itasaSharedContentClient;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    window.__itasaSharedContentClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    return window.__itasaSharedContentClient;
  }

  function recordTime(row) {
    var r = row && row.record || {};
    var raw = r.updated_at || r.created_at || row.updated_at || row.created_at || '';
    var ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }

  function semanticKey(collection, row) {
    var r = row && row.record || {};
    if (collection === 'classes') {
      return String(r.program_id || r.class_key || r.id || row.id || '').toLowerCase();
    }
    if (collection === 'announcements') {
      return String(r.item_key || ((r.title || '') + '|' + (r.body || '')) || r.id || row.id || '').toLowerCase();
    }
    if (collection === 'iv_qa') {
      return String(r.item_key || ((r.question || '') + '|' + (r.answer || '')) || r.id || row.id || '').toLowerCase();
    }
    return String(row && row.id || '');
  }

  function dedupe(collection, rows) {
    var byKey = new Map();
    (rows || []).forEach(function (row) {
      var key = semanticKey(collection, row);
      if (!key) return;
      var prev = byKey.get(key);
      if (!prev || recordTime(row) >= recordTime(prev)) byKey.set(key, row);
    });
    return Array.from(byKey.values())
      .sort(function (a, b) {
        var ao = Number(a && a.source_order);
        var bo = Number(b && b.source_order);
        if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo;
        return recordTime(b) - recordTime(a);
      })
      .map(function (row) { return row.record || {}; });
  }

  async function fetchCollection(collection) {
    if (ALLOWED.indexOf(collection) === -1) {
      return { data: [], error: new Error('Collection not allowed.') };
    }
    var c = client();
    if (!c) return { data: [], error: new Error('Supabase client unavailable.') };
    try {
      var result = await c
        .from('itasa_shared_content')
        .select('collection,id,record,source_order,created_at,updated_at')
        .eq('collection', collection)
        .order('source_order', { ascending: true, nullsFirst: false });
      if (result.error) return { data: [], error: result.error };
      return { data: dedupe(collection, result.data || []), error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  }

  async function fetchAll() {
    var results = await Promise.all(ALLOWED.map(fetchCollection));
    return {
      classes: results[0].data,
      announcements: results[1].data,
      iv_qa: results[2].data,
      errors: results.map(function (r) { return r.error; }).filter(Boolean)
    };
  }

  window.ItasaSharedContentSupabase = {
    fetchCollection: fetchCollection,
    fetchAll: fetchAll,
    dedupe: dedupe
  };
})();