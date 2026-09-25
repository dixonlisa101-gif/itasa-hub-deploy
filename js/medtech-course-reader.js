window.ItasaMedtechCourse={mount:function(container,data,options){
'use strict';
options=options||{};
container.innerHTML='<div id="itasa-medtech"><p class="mt-preview">Medical Technician Class preview · Review account only · Registration remains closed</p><div class="mt-top"><button class="mt-link" data-action="student-home">← Student Home</button><button class="mt-link" data-action="home">All Modules</button><button class="mt-link" data-action="skills">Skills Check-Off</button><span class="spacer"></span><span class="mt-meta">'+data.lesson_count+' lessons · '+data.planned_online_minutes+' online minutes</span></div><section id="mt-home"></section><section id="mt-reader" hidden></section><section id="mt-skills" hidden></section></div>';
const root=container.querySelector('#itasa-medtech'),home=root.querySelector('#mt-home'),reader=root.querySelector('#mt-reader'),skills=root.querySelector('#mt-skills');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studentKey=String(options.studentKey||'review').replace(/[^a-zA-Z0-9_-]/g,'_');
const POSITION_KEY='itasa_medtech_position_v2_'+studentKey;
let moduleIndex=0,tab='lessons',lessonIndex=0,currentView='home',choices={},lessonByModule={},tabByModule={};
let statusData=options.assessmentStatus||null;
let assessmentLoads={},assessmentAnswers={},assessmentResults={};

function clampState(){
 const modules=Array.isArray(data.sections)?data.sections:[];
 if(!modules.length){moduleIndex=0;lessonIndex=0;return;}
 moduleIndex=Math.max(0,Math.min(moduleIndex,modules.length-1));
 const items=Array.isArray(modules[moduleIndex].items)?modules[moduleIndex].items:[];
 lessonIndex=Math.max(0,Math.min(lessonIndex,Math.max(items.length-1,0)));
 if(tab!=='lessons'&&tab!=='assessment')tab='lessons';
}
function loadState(){
 try{
  const raw=sessionStorage.getItem(POSITION_KEY);if(!raw)return;
  const saved=JSON.parse(raw)||{};
  moduleIndex=Number(saved.moduleIndex)||0;lessonIndex=Number(saved.lessonIndex)||0;tab=saved.tab||'lessons';currentView=saved.currentView||'home';
  choices=saved.choices&&typeof saved.choices==='object'?saved.choices:{};
  lessonByModule=saved.lessonByModule&&typeof saved.lessonByModule==='object'?saved.lessonByModule:{};
  tabByModule=saved.tabByModule&&typeof saved.tabByModule==='object'?saved.tabByModule:{};
  if(lessonByModule[moduleIndex]!=null)lessonIndex=Number(lessonByModule[moduleIndex])||0;
  if(tabByModule[moduleIndex])tab=tabByModule[moduleIndex];
  clampState();
 }catch(e){}
}
function saveState(){
 try{
  lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;
  sessionStorage.setItem(POSITION_KEY,JSON.stringify({moduleIndex,lessonIndex,tab,currentView,choices,lessonByModule,tabByModule}));
 }catch(e){}
}
function show(name){currentView=name;home.hidden=name!=='home';reader.hidden=name!=='reader';skills.hidden=name!=='skills';saveState()}
function moduleAssessment(m){for(const i of (m.items||[])){if(i.assessment)return i.assessment}return null}
function assessmentProgress(key){
 const rows=statusData&&Array.isArray(statusData.assessments)?statusData.assessments:[];
 return rows.find(x=>x.assessment_key===key)||null;
}
function fmtDate(v){
 if(!v)return '';
 const d=new Date(v);if(isNaN(d.getTime()))return String(v);
 return d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}
function statusSummary(){
 if(!statusData||statusData.status!=='ok')return '';
 const passed=Number(statusData.required_assessments_passed||0),total=Number(statusData.required_assessments_total||0);
 if(total&&passed===total)return '<div class="mt-note"><strong>Knowledge assessments complete:</strong> '+passed+' of '+total+' passed. <strong>Skills Check-Off:</strong> '+(statusData.skills_ready?'Ready to schedule.':'Waiting for remaining course requirements.')+'</div>';
 return '<div class="mt-note"><strong>Assessment progress:</strong> '+passed+' of '+total+' required module assessments passed.</div>';
}
function renderHome(){
 home.innerHTML='<div class="mt-label">Medical Technician Class / Assistance with Self-Administration of Medications</div><h2>Your Virtual Learning Space</h2><p>Complete each module, take the required module assessment, and earn at least 80% before moving forward. After the online requirements are complete, your in-person physical and verbal skills check-off is the final course step.</p>'+statusSummary()+'<div class="mt-grid" style="margin-top:14px">'+(data.sections||[]).map((m,i)=>{
   const a=moduleAssessment(m),p=a?assessmentProgress(a.assessment_key):null;
   const badge=p?(p.passed?'Passed · '+esc(p.best_score)+'%':(p.attempts_used?'Best score '+esc(p.best_score)+'% · 80% required':'Assessment not taken')):'';
   return '<article class="mt-card"><div class="mt-label">Module '+(i+1)+' of '+data.module_count+'</div><h3>'+esc(m.title)+'</h3><p class="mt-meta">'+(m.items||[]).length+' lessons'+(a?' · required module assessment':'')+'</p>'+(badge?'<p class="mt-meta"><strong>'+badge+'</strong></p>':'')+'<button class="mt-btn" data-action="module" data-value="'+i+'">'+(i===moduleIndex&&currentView==='reader'?'Continue Module':'Open Module')+'</button></article>';
 }).join('')+'</div>';
}
function lessonHtml(l,idx,total){
 const c=l.content||{},sections=Array.isArray(c.lesson_sections)?c.lesson_sections:[],self=Array.isArray(c.self_check)?c.self_check:[];
 let html='<article class="mt-lesson"><div class="mt-label">Lesson '+(idx+1)+' of '+total+'</div><h3>'+esc(l.title)+'</h3>';
 if(l.description)html+='<p class="mt-meta">'+esc(l.description)+'</p>';
 if(c.lesson_intro)html+='<p>'+esc(c.lesson_intro)+'</p>';
 html+=sections.map(s=>'<h4>'+esc(s.heading||'Lesson point')+'</h4><p>'+esc(s.text||'')+'</p>').join('');
 if(c.worked_example)html+='<div class="mt-callout"><strong>Worked example</strong><p>'+esc(c.worked_example.scenario||'')+'</p><p><strong>Why it fits:</strong> '+esc(c.worked_example.why_it_fits||c.worked_example.correct_response||'')+'</p></div>';
 if(c.learning_activity)html+='<div class="mt-callout"><strong>'+esc(c.learning_activity.title||'Practice activity')+'</strong><p>'+esc(c.learning_activity.instructions||c.learning_activity.focus||'')+'</p></div>';
 if(self.length)html+='<details><summary><strong>Self-check</strong></summary>'+self.map((q,qi)=>{
   const key=moduleIndex+'-'+idx+'-'+qi,chosen=choices[key];
   return '<div class="mt-callout"><strong>'+esc(q.question)+'</strong>'+(q.answer_options||[]).map((o,oi)=>'<button class="mt-choice" data-self="'+key+'" data-opt="'+oi+'" aria-pressed="'+(String(chosen)===String(oi))+'">'+esc(o)+'</button>').join('')+'<p class="mt-meta">Practice only. Your required module assessment appears after the lessons.</p></div>';
 }).join('')+'</details>';
 if(Array.isArray(c.key_takeaways)&&c.key_takeaways.length)html+='<h4>Key takeaways</h4><ul>'+c.key_takeaways.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 return html+'</article>';
}
function lessonNav(m){
 const total=(m.items||[]).length,last=lessonIndex>=total-1;
 return '<div class="mt-top mt-lesson-nav"><button class="mt-link" data-action="prev-lesson" '+(lessonIndex<=0?'disabled':'')+'>← Previous Lesson</button><span class="mt-meta">Lesson '+(lessonIndex+1)+' of '+total+'</span><span class="spacer"></span><button class="mt-btn" data-action="'+(last?'assessment':'next-lesson')+'">'+(last?'Module Assessment →':'Next Lesson →')+'</button></div>';
}
function assessmentQuestionHtml(q,qi,key){
 const ans=(assessmentAnswers[key]||{})[q.question_key];
 return '<fieldset class="mt-assessment-question"><legend><strong>'+(qi+1)+'. '+esc(q.prompt)+'</strong></legend>'+(Array.isArray(q.options)?q.options:[]).map(o=>'<label class="mt-answer"><input type="radio" name="assess-'+esc(key)+'-'+esc(q.question_key)+'" data-assess-key="'+esc(key)+'" data-question-key="'+esc(q.question_key)+'" value="'+esc(o.key)+'" '+(ans===o.key?'checked':'')+'> <span>'+esc(o.text)+'</span></label>').join('')+'</fieldset>';
}
function renderAssessment(box,m,assessment){
 const key=assessment.assessment_key,p=assessmentProgress(key),loaded=assessmentLoads[key],result=assessmentResults[key];
 let html='<div class="mt-top"><button class="mt-link" data-action="back-to-last-lesson">← Back to Last Lesson</button><span class="spacer"></span><button class="mt-link" data-action="home">All Modules</button></div><h3>'+esc(assessment.title||'Module Assessment')+'</h3><p>'+esc(assessment.description||'Complete the required module assessment.')+'</p><div class="mt-note"><strong>Passing score:</strong> '+esc(assessment.passing_score)+'%</div>';
 if(p&&p.passed)html+='<div class="mt-result pass"><strong>Passed</strong><br>Best score: '+esc(p.best_score)+'%</div>';
 else if(p&&p.attempts_used)html+='<div class="mt-result retry"><strong>Not yet passed</strong><br>Best score: '+esc(p.best_score)+'% · 80% required</div>';
 if(result&&result.status==='graded'){
   html+='<div class="mt-result '+(result.passed?'pass':'retry')+'"><strong>'+(result.passed?'Passed':'Review and try again')+'</strong><br>Score: '+esc(result.score)+'% · '+esc(result.correct_count)+' of '+esc(result.question_count)+' correct</div>';
 }
 if(!loaded){
   html+='<p>When you are ready, open the assessment. Your score is recorded when you submit.</p><button class="mt-btn" data-action="start-assessment" data-key="'+esc(key)+'">Start Assessment</button>';
   box.innerHTML=html;return;
 }
 if(loaded.status!=='ok'){
   const msg={module_locked:'Complete and pass the prior module assessment first.',module_lessons_incomplete:'Complete all lessons in this module before taking the assessment.',attempt_limit_reached:'No assessment attempts remain.',assessment_unavailable:'This assessment is not available yet.'};
   box.innerHTML=html+'<div class="mt-result retry">'+esc(msg[loaded.status]||'The assessment could not be opened right now.')+'</div>';return;
 }
 const qs=Array.isArray(loaded.questions)?loaded.questions:[];
 html+='<form data-assessment-form="'+esc(key)+'">'+qs.map((q,i)=>assessmentQuestionHtml(q,i,key)).join('')+'<button class="mt-btn" type="submit">Submit Assessment</button></form>';
 box.innerHTML=html;
}
async function refreshStatus(){
 if(typeof options.getStatus!=='function')return;
 const s=await options.getStatus();
 if(s&&s.status==='ok')statusData=s;
}
async function startAssessment(key){
 if(typeof options.getAssessment!=='function')return;
 const b=root.querySelector('[data-action="start-assessment"][data-key="'+key+'"]');if(b){b.disabled=true;b.textContent='Opening Assessment…';}
 assessmentLoads[key]=await options.getAssessment(key);
 renderReader();
}
async function submitAssessment(key){
 const loaded=assessmentLoads[key],answers=assessmentAnswers[key]||{};
 if(!loaded||loaded.status!=='ok')return;
 const questions=Array.isArray(loaded.questions)?loaded.questions:[];
 const missing=questions.filter(q=>!answers[q.question_key]);
 if(missing.length){assessmentResults[key]={status:'incomplete',message:'Answer every question before submitting.'};renderReader();return;}
 if(typeof options.submitAssessment!=='function')return;
 const form=root.querySelector('[data-assessment-form="'+key+'"]'),btn=form&&form.querySelector('button[type="submit"]');
 if(btn){btn.disabled=true;btn.textContent='Submitting…';}
 const r=await options.submitAssessment(key,answers);
 assessmentResults[key]=r||{status:'error'};
 if(r&&r.status==='graded'){
   assessmentLoads[key]=null;
   assessmentAnswers[key]={};
   await refreshStatus();
 }
 renderReader();
}
function renderReader(){
 const m=(data.sections||[])[moduleIndex],assessment=moduleAssessment(m),items=Array.isArray(m.items)?m.items:[];
 clampState();
 reader.innerHTML='<div class="mt-top"><button class="mt-link" data-action="home">← All Modules</button><button class="mt-link" data-action="student-home">← Student Home</button></div><div class="mt-label">Module '+(moduleIndex+1)+' of '+data.module_count+'</div><h2>'+esc(m.title)+'</h2><nav class="mt-tabs"><button class="mt-link" data-tab="lessons">Lessons</button><button class="mt-link" data-tab="assessment">Assessment</button></nav><div id="mt-content" class="mt-panel"></div>';
 reader.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===tab?'true':'false'));
 const box=reader.querySelector('#mt-content');
 if(tab==='lessons'){
   if(items.length)box.innerHTML=lessonNav(m)+lessonHtml(items[lessonIndex],lessonIndex,items.length)+lessonNav(m);
   else box.innerHTML='<p class="mt-meta">No lessons are available in this module.</p>';
 }else if(assessment)renderAssessment(box,m,assessment);
 else box.innerHTML='<p class="mt-meta">No assessment is attached to this module.</p>';
 saveState();
}
function renderSkills(){
 const s=statusData&&statusData.status==='ok'?statusData:null;
 let statusHtml='<div class="mt-note"><strong>Status:</strong> Complete all required module assessments and online course requirements before the skills check-off is scheduled.</div>';
 if(s){
   if(s.skills_session){
     const ss=s.skills_session;
     statusHtml='<div class="mt-note"><strong>Skills Check-Off:</strong> '+esc(String(ss.status||'scheduled').replace(/_/g,' '))+(ss.scheduled_at?'<br><strong>Scheduled:</strong> '+esc(fmtDate(ss.scheduled_at)):'')+(ss.location?'<br><strong>Location:</strong> '+esc(ss.location):'')+(ss.validator_name?'<br><strong>Instructor:</strong> '+esc(ss.validator_name):'')+'</div>';
   }else if(s.skills_ready){
     statusHtml='<div class="mt-result pass"><strong>Online requirements complete.</strong><br>You are ready for your in-person skills check-off. Your scheduled date and location will appear here after ITASA posts the appointment.</div>';
   }else{
     statusHtml='<div class="mt-note"><strong>Assessment progress:</strong> '+esc(s.required_assessments_passed)+' of '+esc(s.required_assessments_total)+' required assessments passed.<br>Your skills check-off will be scheduled after all online requirements are complete.</div>';
   }
 }
 skills.innerHTML='<div class="mt-top"><button class="mt-link" data-action="home">← All Modules</button><button class="mt-link" data-action="student-home">← Student Home</button></div><div class="mt-label">Required completion step</div><h2>In-Person Physical & Verbal Skills Check-Off</h2><p>The instructor completes the official competency record during your in-person validation. Your course is not complete until the required skills are validated.</p>'+statusHtml+(data.skills_checklist||[]).map((x,i)=>'<article class="mt-skill"><div class="mt-label">Skill '+(i+1)+' of '+data.required_skills_count+'</div><h3>'+esc(x.item_name)+'</h3><p>'+esc(x.description)+'</p>'+(x.demonstration_mode?'<p class="mt-meta"><strong>Validation:</strong> '+esc(x.demonstration_mode)+'</p>':'')+'</article>').join('');
}
function focusReader(){setTimeout(()=>reader.scrollIntoView({behavior:'smooth',block:'start'}),0)}
root.addEventListener('change',function(e){
 const el=e.target;
 if(el.matches('[data-assess-key][data-question-key]')){
   const key=el.dataset.assessKey;
   assessmentAnswers[key]=assessmentAnswers[key]||{};
   assessmentAnswers[key][el.dataset.questionKey]=el.value;
 }
});
root.addEventListener('submit',function(e){
 const form=e.target.closest('[data-assessment-form]');if(!form)return;
 e.preventDefault();submitAssessment(form.dataset.assessmentForm);
});
root.addEventListener('click',function(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action==='student-home'){saveState();window.location.href='student-portal-cutover-preview.html?stay=1';return}
 if(b.dataset.action==='home'){show('home');renderHome();return}
 if(b.dataset.action==='skills'){show('skills');renderSkills();return}
 if(b.dataset.action==='module'){lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;moduleIndex=Number(b.dataset.value)||0;lessonIndex=Number(lessonByModule[moduleIndex])||0;tab=tabByModule[moduleIndex]||'lessons';clampState();show('reader');renderReader();focusReader();return}
 if(b.dataset.action==='prev-lesson'){if(lessonIndex>0){lessonIndex--;lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader()}return}
 if(b.dataset.action==='next-lesson'){const m=(data.sections||[])[moduleIndex];if(lessonIndex<(m.items||[]).length-1){lessonIndex++;lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader()}return}
 if(b.dataset.action==='assessment'){tab='assessment';tabByModule[moduleIndex]=tab;renderReader();focusReader();return}
 if(b.dataset.action==='start-assessment'){startAssessment(b.dataset.key);return}
 if(b.dataset.action==='back-to-last-lesson'){const m=(data.sections||[])[moduleIndex];lessonIndex=Math.max((m.items||[]).length-1,0);lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader();return}
 if(b.dataset.tab){tab=b.dataset.tab;tabByModule[moduleIndex]=tab;if(tab==='lessons')clampState();renderReader();focusReader();return}
 if(b.dataset.self!=null){choices[b.dataset.self]=Number(b.dataset.opt);root.querySelectorAll('[data-self="'+b.dataset.self+'"]').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');saveState();}
});
loadState();renderHome();
if(currentView==='reader'){show('reader');renderReader()}
else if(currentView==='skills'){show('skills');renderSkills()}
else show('home');
return{destroy:function(){saveState();container.innerHTML=''}};
}};