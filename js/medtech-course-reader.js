window.ItasaMedtechCourse={mount:function(container,data,options){
'use strict';
options=options||{};
container.innerHTML='<div id="itasa-medtech"><p class="mt-preview">Medical Technician Class preview · Review account only · Registration remains closed</p><div class="mt-top"><button class="mt-link" data-action="student-home">← Student Home</button><button class="mt-link" data-action="home">All modules</button><button class="mt-link" data-action="skills">In-person skills validation</button><span class="spacer"></span><span class="mt-meta">'+data.lesson_count+' lessons · '+data.planned_online_minutes+' online minutes</span></div><section id="mt-home"></section><section id="mt-reader" hidden></section><section id="mt-skills" hidden></section></div>';
const root=container.querySelector('#itasa-medtech'),home=root.querySelector('#mt-home'),reader=root.querySelector('#mt-reader'),skills=root.querySelector('#mt-skills');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studentKey=String(options.studentKey||'review').replace(/[^a-zA-Z0-9_-]/g,'_');
const POSITION_KEY='itasa_medtech_position_v1_'+studentKey;
let moduleIndex=0,tab='lessons',lessonIndex=0,currentView='home',choices={},lessonByModule={},tabByModule={};

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
   moduleIndex=Number(saved.moduleIndex)||0;
   lessonIndex=Number(saved.lessonIndex)||0;
   tab=saved.tab||'lessons';
   currentView=saved.currentView||'home';
   choices=saved.choices&&typeof saved.choices==='object'?saved.choices:{};
   lessonByModule=saved.lessonByModule&&typeof saved.lessonByModule==='object'?saved.lessonByModule:{};
   tabByModule=saved.tabByModule&&typeof saved.tabByModule==='object'?saved.tabByModule:{};
   if(lessonByModule[moduleIndex]!=null)lessonIndex=Number(lessonByModule[moduleIndex])||0;
   if(tabByModule[moduleIndex])tab=tabByModule[moduleIndex];
   clampState();
 }catch(e){}
}
function saveState(){
 try{lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;sessionStorage.setItem(POSITION_KEY,JSON.stringify({moduleIndex,lessonIndex,tab,currentView,choices,lessonByModule,tabByModule}));}catch(e){}
}
function show(name){currentView=name;home.hidden=name!=='home';reader.hidden=name!=='reader';skills.hidden=name!=='skills';saveState()}
function moduleAssessment(m){for(const i of (m.items||[])){if(i.assessment)return i.assessment}return null}
function progressLabel(m){
 const count=(m.items||[]).length;
 return count?('Lesson '+(lessonIndex+1)+' of '+count):'No lessons';
}
function renderHome(){
 home.innerHTML='<div class="mt-label">Medical Technician Class / Assistance with Self-Administration of Medications</div><h2>Your Virtual Learning Space</h2><p>Complete the online learning modules in order, use the practice activities to check your understanding, and prepare for the required in-person physical and verbal skills validation.</p><div class="mt-note"><strong>Preview status:</strong> Medical Technician Class remains Coming Soon. This review account does not open registration, payment, certificates, or production student access.</div><div class="mt-grid" style="margin-top:14px">'+(data.sections||[]).map((m,i)=>'<article class="mt-card"><div class="mt-label">Module '+(i+1)+' of '+data.module_count+'</div><h3>'+esc(m.title)+'</h3><p class="mt-meta">'+(m.items||[]).length+' lessons'+(moduleAssessment(m)?' · required module assessment':'')+'</p><button class="mt-btn" data-action="module" data-value="'+i+'">'+(i===moduleIndex&&currentView==='reader'?'Continue module':'Open module')+'</button></article>').join('')+'</div>';
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
   return '<div class="mt-callout"><strong>'+esc(q.question)+'</strong>'+(q.answer_options||[]).map((o,oi)=>'<button class="mt-choice" data-self="'+key+'" data-opt="'+oi+'" aria-pressed="'+(String(chosen)===String(oi))+'">'+esc(o)+'</button>').join('')+'<p class="mt-meta">Preview choice only. Correct-answer scoring is reserved for the module assessment.</p></div>';
 }).join('')+'</details>';
 if(Array.isArray(c.key_takeaways)&&c.key_takeaways.length)html+='<h4>Key takeaways</h4><ul>'+c.key_takeaways.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 return html+'</article>';
}
function lessonNav(m){
 const total=(m.items||[]).length;
 const prevDisabled=lessonIndex<=0;
 const last=lessonIndex>=total-1;
 return '<div class="mt-top mt-lesson-nav"><button class="mt-link" data-action="prev-lesson" '+(prevDisabled?'disabled':'')+'>← Previous Lesson</button><span class="mt-meta">'+esc(progressLabel(m))+'</span><span class="spacer"></span><button class="mt-btn" data-action="'+(last?'assessment':'next-lesson')+'">'+(last?'Module Assessment →':'Next Lesson →')+'</button></div>';
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
 }else if(assessment){
   box.innerHTML='<div class="mt-top"><button class="mt-link" data-action="back-to-last-lesson">← Back to Last Lesson</button><span class="spacer"></span><button class="mt-link" data-action="home">All Modules</button></div><h3>'+esc(assessment.title||'Module assessment')+'</h3><p>'+esc(assessment.description||'Complete the secure module assessment after finishing the lessons.')+'</p><div class="mt-note"><strong>Passing score:</strong> '+esc(assessment.passing_score)+'%'+(assessment.max_attempts?'<br><strong>Maximum attempts:</strong> '+esc(assessment.max_attempts):'')+'</div>';
 }else box.innerHTML='<p class="mt-meta">No assessment metadata is attached to this module preview.</p>';
 saveState();
}
function renderSkills(){
 skills.innerHTML='<div class="mt-top"><button class="mt-link" data-action="home">← All Modules</button><button class="mt-link" data-action="student-home">← Student Home</button></div><div class="mt-label">Required completion step</div><h2>In-Person Physical & Verbal Skills Validation</h2><p>Online training does not complete the course by itself. These required items must be validated in person by the qualified ITASA training provider before the course can be completed.</p><div class="mt-note">'+esc(data.student_completion_message||'Online Training Complete — In-Person Skills Validation Pending')+'</div>'+(data.skills_checklist||[]).map((s,i)=>'<article class="mt-skill"><div class="mt-label">Skill '+(i+1)+' of '+data.required_skills_count+'</div><h3>'+esc(s.item_name)+'</h3><p>'+esc(s.description)+'</p>'+(s.demonstration_mode?'<p class="mt-meta"><strong>Validation:</strong> '+esc(s.demonstration_mode)+'</p>':'')+'</article>').join('');
}
function focusReader(){setTimeout(()=>reader.scrollIntoView({behavior:'smooth',block:'start'}),0)}
root.addEventListener('click',function(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action==='student-home'){saveState();window.location.href='student-portal-cutover-preview.html?stay=1';return}
 if(b.dataset.action==='home'){show('home');renderHome();return}
 if(b.dataset.action==='skills'){show('skills');renderSkills();return}
 if(b.dataset.action==='module'){lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;moduleIndex=Number(b.dataset.value)||0;lessonIndex=Number(lessonByModule[moduleIndex])||0;tab=tabByModule[moduleIndex]||'lessons';clampState();show('reader');renderReader();focusReader();return}
 if(b.dataset.action==='prev-lesson'){if(lessonIndex>0){lessonIndex--;lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader()}return}
 if(b.dataset.action==='next-lesson'){const m=(data.sections||[])[moduleIndex];if(lessonIndex<(m.items||[]).length-1){lessonIndex++;lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader()}return}
 if(b.dataset.action==='assessment'){tab='assessment';tabByModule[moduleIndex]=tab;renderReader();focusReader();return}
 if(b.dataset.action==='back-to-last-lesson'){const m=(data.sections||[])[moduleIndex];lessonIndex=Math.max((m.items||[]).length-1,0);lessonByModule[moduleIndex]=lessonIndex;tab='lessons';tabByModule[moduleIndex]=tab;renderReader();focusReader();return}
 if(b.dataset.tab){tab=b.dataset.tab;tabByModule[moduleIndex]=tab;if(tab==='lessons')clampState();renderReader();focusReader();return}
 if(b.dataset.self!=null){choices[b.dataset.self]=Number(b.dataset.opt);root.querySelectorAll('[data-self="'+b.dataset.self+'"]').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');saveState();}
});
loadState();
renderHome();
if(currentView==='reader'){show('reader');renderReader()}
else if(currentView==='skills'){show('skills');renderSkills()}
else show('home');
return{destroy:function(){saveState();container.innerHTML=''}};
}};