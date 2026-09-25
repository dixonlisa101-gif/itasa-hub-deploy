(function(){
'use strict';
function client(){
  return window.ItasaStaffHub&&window.ItasaStaffHub.client?window.ItasaStaffHub.client:null;
}
async function rpc(name,args){
  var c=client();if(!c)throw new Error('Staff sign-in is not ready.');
  var r=await c.rpc(name,args||{});
  if(r.error)throw r.error;
  return r.data||{status:'error'};
}
window.ItasaAssessmentSkillsStaff={
  fetchRoster:function(){return rpc('get_assessment_skills_roster');},
  scheduleSkills:function(enrollmentId,scheduledAt,location){
    return rpc('schedule_student_skills_checkoff',{
      p_student_enrollment_id:enrollmentId,
      p_scheduled_at:scheduledAt,
      p_location:location||''
    });
  },
  getSessionDetail:function(sessionId){
    return rpc('get_my_skills_session_detail',{p_session_id:sessionId});
  },
  saveCompetency:function(sessionId,itemId,result,reason){
    return rpc('record_my_competency_result',{
      p_session_id:sessionId,
      p_item_id:itemId,
      p_result:result,
      p_deficiency_reason:reason||''
    });
  },
  finalizeSession:function(sessionId,location,signature){
    return rpc('finalize_my_course_skills_session',{
      p_session_id:sessionId,
      p_validation_location:location||'',
      p_signature_name:signature||''
    });
  }
};
})();