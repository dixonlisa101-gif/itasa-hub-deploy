window.ItasaMedtechCourse={mount:function(container,data){
'use strict';
container.innerHTML='<div id="itasa-medtech"><p class="mt-preview">Medication Technician course preview · Review account only · Registration remains closed</p><div class="mt-top"><button class="mt-link" data-action="home">All modules</button><button class="mt-link" data-action="skills">In-person skills validation</button><span class="spacer"></span><span class="mt-meta">'+data.lesson_count+' lessons · '+data.planned_online_minutes+' online minutes</span></div><section id="mt-home"></section><section id="mt-reader" hidden></section><section id="mt-skills" hidden></section></div>';
const root=container.querySelector('#itasa-medtech'),home=root.querySelector('#mt-home'),reader=root.querySelector('#mt-reader'),skills=root.querySelector('#mt-skills');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let moduleIndex=0,tab='lessons';
function show(name){home.hidden=name!=='home';reader.hidden=name!=='reader';skills.hidden=name!=='skills'}
function moduleAssessment(m){for(const i of (m.items||[])){if(i.assessment)return i.assessment}return null}
function renderHome(){
 home.innerHTML='<div class="mt-label">Medication Technician / Assistance with Self-Administration of Medications</div><h2>Your Virtual Learning Space</h2><p>Complete the online learning modules in order, use the practice activities to check your understanding, and prepare for the required in-person physical and verbal skills validation.</p><div class="mt-note"><strong>Preview status:</strong> MT remains Coming Soon. This review account does not open registration, payment, certificates, or production student access.</div><div class="mt-grid" style="margin-top:14px">'+(data.sections||[]).map((m,i)=>'<article class="mt-card"><div class="mt-label">Module '+(i+1)+' of '+data.module_count+'</div><h3>'+esc(m.title)+'</h3><p class="mt-meta">'+(m.items||[]).length+' lessons'+(moduleAssessment(m)?' · required module assessment':'')+'</p><button class="mt-btn" data-action="module" data-value="'+i+'">Open module</button></article>').join('')+'</div>';
}
function lessonHtml(l,idx,total){
 const c=l.content||{},sections=Array.isArray(c.lesson_sections)?c.lesson_sections:[],self=Array.isArray(c.self_check)?c.self_check:[];
 let html='<article class="mt-lesson"><div class="mt-label">Lesson '+(idx+1)+' of '+total+'</div><h3>'+esc(l.title)+'</h3>';
 if(l.description)html+='<p class="mt-meta">'+esc(l.description)+'</p>';
 if(c.lesson_intro)html+='<p>'+esc(c.lesson_intro)+'</p>';
 html+=sections.map(s=>'<h4>'+esc(s.heading||'Lesson point')+'</h4><p>'+esc(s.text||'')+'</p>').join('');
 if(c.worked_example)html+='<div class="mt-callout"><strong>Worked example</strong><p>'+esc(c.worked_example.scenario||'')+'</p><p><strong>Why it fits:</strong> '+esc(c.worked_example.why_it_fits||c.worked_example.correct_response||'')+'</p></div>';
 if(c.learning_activity)html+='<div class="mt-callout"><strong>'+esc(c.learning_activity.title||'Practice activity')+'</strong><p>'+esc(c.learning_activity.instructions||c.learning_activity.focus||'')+'</p></div>';
 if(self.length)html+='<details><summary><strong>Self-check</strong></summary>'+self.map((q,qi)=>'<div class="mt-callout"><strong>'+esc(q.question)+'</strong>'+(q.answer_options||[]).map((o,oi)=>'<button class="mt-choice" data-self="'+idx+'-'+qi+'" data-opt="'+oi+'" aria-pressed="false">'+esc(o)+'</button>').join('')+'<p class="mt-meta">Preview choice only. Correct-answer scoring is reserved for the secure released assessment.</p></div>').join('')+'</details>';
 if(Array.isArray(c.key_takeaways)&&c.key_takeaways.length)html+='<h4>Key takeaways</h4><ul>'+c.key_takeaways.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 return html+'</article>';
}
function renderReader(){
 const m=(data.sections||[])[moduleIndex],assessment=moduleAssessment(m);
 reader.innerHTML='<button class="mt-link" data-action="home">← All modules</button><div class="mt-label" style="margin-top:14px">Module '+(moduleIndex+1)+' of '+data.module_count+'</div><h2>'+esc(m.title)+'</h2><nav class="mt-tabs"><button class="mt-link" data-tab="lessons">Lessons</button><button class="mt-link" data-tab="assessment">Assessment</button></nav><div id="mt-content" class="mt-panel"></div>';
 reader.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===tab?'true':'false'));
 const box=reader.querySelector('#mt-content');
 if(tab==='lessons')box.innerHTML=(m.items||[]).map((l,i)=>lessonHtml(l,i,m.items.length)).join('');
 else if(assessment)box.innerHTML='<h3>'+esc(assessment.title||'Module assessment')+'</h3><p>'+esc(assessment.description||'Complete the secure module assessment after finishing the lessons.')+'</p><div class="mt-note"><strong>Passing score:</strong> '+esc(assessment.passing_score)+'%'+(assessment.max_attempts?'<br><strong>Maximum attempts:</strong> '+esc(assessment.max_attempts):'')+'<br><br>Assessment questions are intentionally not exposed in this review page. They remain behind the secure student assessment system.</div>';
 else box.innerHTML='<p class="mt-meta">No assessment metadata is attached to this module preview.</p>';
}
function renderSkills(){
 skills.innerHTML='<button class="mt-link" data-action="home">← All modules</button><div class="mt-label" style="margin-top:14px">Required completion step</div><h2>In-Person Physical & Verbal Skills Validation</h2><p>Online training does not complete the course by itself. These required items must be validated in person by the qualified ITASA training provider before the course can be completed.</p><div class="mt-note">'+esc(data.student_completion_message||'Online Training Complete — In-Person Skills Validation Pending')+'</div>'+(data.skills_checklist||[]).map((s,i)=>'<article class="mt-skill"><div class="mt-label">Skill '+(i+1)+' of '+data.required_skills_count+'</div><h3>'+esc(s.item_name)+'</h3><p>'+esc(s.description)+'</p>'+(s.demonstration_mode?'<p class="mt-meta"><strong>Validation:</strong> '+esc(s.demonstration_mode)+'</p>':'')+'</article>').join('');
}
root.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action==='home'){show('home');renderHome();return}
 if(b.dataset.action==='skills'){show('skills');renderSkills();return}
 if(b.dataset.action==='module'){moduleIndex=Number(b.dataset.value)||0;tab='lessons';show('reader');renderReader();return}
 if(b.dataset.tab){tab=b.dataset.tab;renderReader();return}
 if(b.dataset.self!=null){const group=b.dataset.self;root.querySelectorAll('[data-self="'+group+'"]').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');}
});
renderHome();show('home');return{destroy:function(){container.innerHTML=''}};
}};