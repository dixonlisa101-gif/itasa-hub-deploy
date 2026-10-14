(function(){
'use strict';
function staffClient(){
  return window.ItasaStaffHub && window.ItasaStaffHub.client ? window.ItasaStaffHub.client : null;
}
async function callRpc(name,args){
  var c=staffClient();
  if(!c) throw new Error('Staff sign-in is not ready.');
  var r=await c.rpc(name,args||{});
  if(r.error) throw r.error;
  return r.data||{status:'error'};
}
async function uploadEvidence(sessionId,file,notes){
  var c=staffClient();
  if(!c) throw new Error('Staff sign-in is not ready.');
  if(!file) throw new Error('Choose a scanned checklist file first.');
  var safe=(file.name||'skills-checkoff').replace(/[^a-zA-Z0-9._-]/g,'_');
  var path=sessionId+'/'+Date.now()+'-'+safe;
  var up=await c.storage.from('skills-checkoff-evidence').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
  if(up.error) throw up.error;
  var rec=await callRpc('record_skills_checkoff_evidence',{
    p_session_id:sessionId,
    p_storage_path:path,
    p_original_filename:file.name||safe,
    p_mime_type:file.type||'',
    p_notes:notes||''
  });
  if(!rec||rec.status!=='recorded') throw new Error((rec&&rec.status)||'Evidence record was not saved.');
  return rec;
}
async function listEvidence(sessionId){
  return callRpc('get_skills_checkoff_evidence',{p_session_id:sessionId});
}
async function signedEvidenceUrl(path){
  var c=staffClient();
  var r=await c.storage.from('skills-checkoff-evidence').createSignedUrl(path,300);
  if(r.error) throw r.error;
  return r.data&&r.data.signedUrl||'';
}
window.ItasaSkillsEvidence={
  upload:uploadEvidence,
  list:listEvidence,
  signedUrl:signedEvidenceUrl
};
})();