(function(){
'use strict';
function client(){return window.__itasaStudentPortalClient||null;}
async function rpc(name,args){
  var c=client();
  if(!c)return{status:'error'};
  try{
    var r=await c.rpc(name,args||{});
    if(r.error){console.error('ITASA assessment/skills RPC failed',name,r.error);return{status:'error'};}
    return r.data||{status:'error'};
  }catch(e){console.error('ITASA assessment/skills RPC threw',name,e);return{status:'error'};}
}
window.ItasaAssessmentSkills={
  getCourseAssessment:function(email,code,key){return rpc('get_my_course_assessment',{p_email:(email||'').trim().toLowerCase(),p_access_code:(code||'').trim(),p_assessment_key:key||''});},
  submitCourseAssessment:function(email,code,key,answers){return rpc('submit_my_course_assessment',{p_email:(email||'').trim().toLowerCase(),p_access_code:(code||'').trim(),p_assessment_key:key||'',p_answers:answers||{}});},
  getMedtechReviewAssessment:function(email,code,key){return rpc('get_medtech_review_course_assessment',{p_email:(email||'').trim().toLowerCase(),p_access_code:(code||'').trim(),p_assessment_key:key||''});},
  submitMedtechReviewAssessment:function(email,code,key,answers){return rpc('submit_medtech_review_course_assessment',{p_email:(email||'').trim().toLowerCase(),p_access_code:(code||'').trim(),p_assessment_key:key||'',p_answers:answers||{}});},
  getStatus:function(email,code){return rpc('get_my_assessment_skills_status',{p_email:(email||'').trim().toLowerCase(),p_access_code:(code||'').trim()});}
};
})();