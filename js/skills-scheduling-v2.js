(function(){
'use strict';
function c(){return window.ItasaStaffHub&&window.ItasaStaffHub.client?window.ItasaStaffHub.client:null}
async function rpc(name,args){var x=c();if(!x)throw new Error('Staff sign-in is not ready.');var r=await x.rpc(name,args||{});if(r.error)throw r.error;return r.data||{status:'error'}}
window.ItasaSkillsScheduleV2={
 schedule:function(enrollmentId,startAt,endAt,location){
  return rpc('schedule_student_skills_checkoff',{p_student_enrollment_id:enrollmentId,p_scheduled_at:startAt,p_scheduled_end_at:endAt,p_location:location||''});
 },
 markRemediation:function(sessionId,notes){
  return rpc('mark_my_skills_session_for_remediation',{p_session_id:sessionId,p_notes:notes||''});
 },
 reassess:function(priorSessionId,startAt,endAt,location){
  return rpc('schedule_student_skills_reassessment',{p_prior_session_id:priorSessionId,p_scheduled_at:startAt,p_scheduled_end_at:endAt,p_location:location||''});
 }
};
})();