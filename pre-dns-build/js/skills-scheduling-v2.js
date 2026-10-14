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
 },
 createRemediationOpportunity:function(payload){
  payload=payload||{};
  return rpc('create_remediation_opportunity',{
   p_offering_key:payload.offeringKey||'',
   p_validator_staff_id:payload.validatorStaffId||null,
   p_title:payload.title||'Remediation / Reassessment',
   p_scheduled_at:payload.startAt,
   p_scheduled_end_at:payload.endAt,
   p_location:payload.location||'',
   p_delivery_mode:payload.deliveryMode||'in_person',
   p_capacity:payload.capacity==null?null:Number(payload.capacity),
   p_instructions:payload.instructions||''
  });
 },
 getRemediationStaffOptions:function(){
  return rpc('get_remediation_staff_options');
 },
 getRemediationOpportunities:function(){
  return rpc('get_remediation_opportunities_staff');
 }
};
})();