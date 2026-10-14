(function(){
  'use strict';
  const hub=window.ItasaStaffHub, box=document.getElementById('review-course'), status=document.getElementById('review-status');
  const signIn=document.getElementById('review-signin'),signOut=document.getElementById('review-signout'),refresh=document.getElementById('review-refresh');
  let generation=0,reader=null,loadedFor=null;
  function clear(){if(reader)reader.destroy();reader=null;box.replaceChildren();box.hidden=true;loadedFor=null;}
  async function load(force){
    const staff=hub&&hub.getCurrentStaff();
    if(!staff){generation++;clear();status.hidden=false;status.textContent='Sign in with your ITASA staff account to review the IV course.';signIn.hidden=false;signOut.hidden=true;refresh.hidden=true;return;}
    if(!force&&loadedFor===staff.id)return;
    const request=++generation;clear();signIn.hidden=true;signOut.hidden=false;refresh.hidden=false;refresh.disabled=true;
    status.hidden=false;status.textContent='Opening the IV teaching draft…';
    try{
      // Existing RLS grants access only to administrators or assigned instructors.
      const result=await hub.client.from('course_items').select('item_key,content')
        .eq('course_section_id','c1968d67-cffe-4813-b0b5-1151cccbc223')
        .in('item_key',['iv_teaching_draft_20260924','iv_teaching_companion_20260924']);
      if(request!==generation||hub.getCurrentStaff()?.id!==staff.id)return;
      if(result.error)throw result.error;
      const rows=result.data||[],lesson=rows.find(x=>x.item_key==='iv_teaching_draft_20260924'),notes=rows.find(x=>x.item_key==='iv_teaching_companion_20260924');
      if(lesson?.content?.schema_version!=='itasa_iv_interactive_v1')throw new Error('The IV draft is not available to this account. An ITASA administrator can review your course assignment.');
      const curriculum=JSON.parse(JSON.stringify(lesson.content.curriculum));
      const companion=notes?.content?.companion;
      if(companion){curriculum.instructorNotes=companion.instructorNotes;curriculum.modules.forEach(m=>{m.instructor=companion.modules[m.id];});}
      reader=window.ItasaIvCourse.mount(box,curriculum,{review:true,teachingNotes:!!companion,rememberLocation:true});
      box.hidden=false;loadedFor=staff.id;status.hidden=true;
    }catch(error){if(request===generation){clear();status.hidden=false;status.textContent=error.message||'The draft could not be loaded. Select Refresh course to try again.';}}
    finally{if(request===generation)refresh.disabled=false;}
  }
  refresh.addEventListener('click',()=>load(true));
  signOut.addEventListener('click',async()=>{generation++;clear();await hub.signOut();load();});
  if(!hub){status.textContent='Staff sign-in is temporarily unavailable. Return to the Instructor Workspace.';signIn.hidden=false;return;}
  hub.onSessionChange(session=>{if(session.resolved)load();});
  if(hub.isResolved())load();
})();
