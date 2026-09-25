window.ItasaSkillsCourse={mount:function(container,data,options){
'use strict';
options=options||{};
container.innerHTML='<div id="itasa-skills-course"><p class="skills-preview">Skills Refresher teaching draft · Review account only · Practice responses are not submitted</p><div class="skills-top"><button class="skills-link" data-action="student-home">← Student Home</button><button class="skills-link" data-action="home">All Modules</button><button class="skills-link" data-action="capstone">Final Integrated Scenario</button><span class="spacer"></span><span class="skills-meta">120 hours · Six weekends</span></div><section id="skills-home"></section><section id="skills-reader" hidden></section><section id="skills-capstone" hidden></section></div>';
const root=container.querySelector('#itasa-skills-course'),home=root.querySelector('#skills-home'),reader=root.querySelector('#skills-reader'),cap=root.querySelector('#skills-capstone');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studentKey=String(options.studentKey||'review').replace(/[^a-zA-Z0-9_-]/g,'_');
const POSITION_KEY='itasa_skills_position_v1_'+studentKey;
let moduleIndex=0,tab='lessons',lessonIndex=0,currentView='home',lessonByModule={},tabByModule={};

function clamp(){
 const mods=Array.isArray(data.modules)?data.modules:[];
 if(!mods.length){moduleIndex=0;lessonIndex=0;return}
 moduleIndex=Math.max(0,Math.min(moduleIndex,mods.length-1));
 const lessons=Array.isArray(mods[moduleIndex].lessons)?mods[moduleIndex].lessons:[];
 lessonIndex=Math.max(0,Math.min(lessonIndex,Math.max(lessons.length-1,0)));
 const allowed=['lessons','case','check','skills','refs'];
 if(!allowed.includes(tab))tab='lessons';
}
function loadState(){
 try{
   const raw=sessionStorage.getItem(POSITION_KEY);if(!raw)return;
   const s=JSON.parse(raw)||{};
   moduleIndex=Number(s.moduleIndex)||0;lessonIndex=Number(s.lessonIndex)||0;tab=s.tab||'lessons';currentView=s.currentView||'home';
   lessonByModule=s.lessonByModule&&typeof s.lessonByModule==='object'?s.lessonByModule:{};
   tabByModule=s.tabByModule&&typeof s.tabByModule==='object'?s.tabByModule:{};
   if(lessonByModule[moduleIndex]!=null)lessonIndex=Number(lessonByModule[moduleIndex])||0;
   if(tabByModule[moduleIndex])tab=tabByModule[moduleIndex];
   clamp();
 }catch(e){}
}
function saveState(){
 try{
   lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;
   sessionStorage.setItem(POSITION_KEY,JSON.stringify({moduleIndex,lessonIndex,tab,currentView,lessonByModule,tabByModule}));
 }catch(e){}
}
function show(name){currentView=name;home.hidden=name!=='home';reader.hidden=name!=='reader';cap.hidden=name!=='capstone';saveState()}
function focusReader(){setTimeout(()=>reader.scrollIntoView({behavior:'smooth',block:'start'}),0)}
function renderHome(){
 home.innerHTML='<div class="skills-label">RN Skills Refresher</div><h2>'+esc(data.title)+'</h2><p>'+esc(data.introduction)+'</p><div class="skills-hours"><div><strong>6 hrs</strong><br><span class="skills-meta">Knowledge review</span></div><div><strong>4 hrs</strong><br><span class="skills-meta">Cases & judgment</span></div><div><strong>8 hrs</strong><br><span class="skills-meta">Guided practice</span></div><div><strong>2 hrs</strong><br><span class="skills-meta">Reflection/check-off</span></div></div><p class="skills-meta">'+esc(data.hour_model.note)+'</p><div class="skills-grid">'+data.modules.map((m,i)=>'<article class="skills-module"><div class="skills-label">Weekend '+esc(m.weekend)+' · 20 hours</div><h3>'+esc(m.title)+'</h3><p>'+esc(m.subtitle)+'</p><p class="skills-meta">'+m.lessons.length+' lessons · '+m.checkoffs.length+' check-off skill'+(m.checkoffs.length===1?'':'s')+'</p><button class="skills-btn" data-action="module" data-value="'+i+'">'+(i===moduleIndex&&currentView==='reader'?'Continue Module':'Open Module')+'</button></article>').join('')+'</div>';
}
function lessonNav(m){
 const last=lessonIndex>=m.lessons.length-1;
 return '<div class="skills-top skills-lesson-nav"><button class="skills-link" data-action="prev-lesson" '+(lessonIndex===0?'disabled':'')+'>← Previous Lesson</button><span class="skills-meta">Lesson '+(lessonIndex+1)+' of '+m.lessons.length+'</span><span class="spacer"></span><button class="skills-btn" data-action="'+(last?'case':'next-lesson')+'">'+(last?'Patient Case →':'Next Lesson →')+'</button></div>';
}
function renderReader(){
 clamp();
 const m=data.modules[moduleIndex];
 reader.innerHTML='<div class="skills-top"><button class="skills-link" data-action="home">← All Modules</button><button class="skills-link" data-action="student-home">← Student Home</button></div><div class="skills-label">Weekend '+esc(m.weekend)+' · Module '+(moduleIndex+1)+'</div><h2>'+esc(m.title)+'</h2><p>'+esc(m.goal)+'</p><nav class="skills-nav"><button class="skills-link" data-tab="lessons">Lessons</button><button class="skills-link" data-tab="case">Patient Case</button><button class="skills-link" data-tab="check">Knowledge Check</button><button class="skills-link" data-tab="skills">Skills Check-Offs</button><button class="skills-link" data-tab="refs">References</button></nav><div id="skills-content" class="skills-panel"></div>';
 reader.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===tab?'true':'false'));
 const box=reader.querySelector('#skills-content');
 if(tab==='lessons'){
   const l=m.lessons[lessonIndex];
   box.innerHTML=lessonNav(m)+'<article class="skills-lesson"><div class="skills-label">Lesson '+(lessonIndex+1)+' of '+m.lessons.length+'</div><h3>'+esc(l.title)+'</h3>'+l.body.map(p=>'<p>'+esc(p)+'</p>').join('')+'<div class="skills-callout"><strong>Try it</strong><p>'+esc(l.practice)+'</p></div></article>'+lessonNav(m);
 }else if(tab==='case'){
   box.innerHTML='<div class="skills-top"><button class="skills-link" data-action="last-lesson">← Last Lesson</button><span class="spacer"></span><button class="skills-btn" data-action="check">Knowledge Check →</button></div><h3>'+esc(m.case.title)+'</h3><p>'+esc(m.case.scene)+'</p>'+m.case.choices.map((c,i)=>'<button class="skills-choice" data-case="'+i+'">'+esc(c.label)+'</button>').join('')+'<div id="skills-case-feedback"></div>';
 }else if(tab==='check'){
   box.innerHTML='<div class="skills-top"><button class="skills-link" data-action="case">← Patient Case</button><span class="spacer"></span><button class="skills-btn" data-action="skills">Skills Check-Offs →</button></div>'+m.checks.map((q,qi)=>'<article class="skills-lesson"><h3>'+esc(q.q)+'</h3>'+q.options.map((o,oi)=>'<button class="skills-choice" data-q="'+qi+'" data-a="'+oi+'">'+esc(o)+'</button>').join('')+'<div id="skills-qf-'+qi+'"></div></article>').join('');
 }else if(tab==='skills'){
   box.innerHTML='<div class="skills-top"><button class="skills-link" data-action="check">← Knowledge Check</button><span class="spacer"></span><button class="skills-btn" data-action="refs">References →</button></div><p class="skills-meta">These are preparation guides. The instructor uses the approved procedure-specific checklist and current facility/device instructions for validation.</p>'+m.checkoffs.map((s,i)=>'<article class="skills-checkoff"><div class="skills-label">Check-Off '+(i+1)+'</div><h3>'+esc(s.title)+'</h3><p><strong>Student preparation:</strong> '+esc(s.studentPrep)+'</p><strong>Instructor looks for:</strong><ul>'+s.lookFor.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></article>').join('');
 }else{
   box.innerHTML='<div class="skills-top"><button class="skills-link" data-action="skills">← Skills Check-Offs</button><span class="spacer"></span><button class="skills-btn" data-action="'+(moduleIndex<data.modules.length-1?'next-module':'capstone')+'">'+(moduleIndex<data.modules.length-1?'Next Module →':'Final Integrated Scenario →')+'</button></div><h3>References for this module</h3><ul>'+m.sources.map(id=>data.sources.find(s=>s.id===id)).filter(Boolean).map(s=>'<li><a target="_blank" rel="noopener" href="'+esc(s.url)+'">'+esc(s.title)+'</a><div class="skills-meta">'+esc(s.note)+'</div></li>').join('')+'</ul>';
 }
 saveState();
}
function renderCapstone(){
 cap.innerHTML='<div class="skills-top"><button class="skills-link" data-action="home">← All Modules</button><button class="skills-link" data-action="student-home">← Student Home</button></div><div class="skills-capstone"><div class="skills-label">Final Integration</div><h2>'+esc(data.final_capstone.title)+'</h2><p>'+esc(data.final_capstone.brief)+'</p><h3>Required evidence</h3><ul>'+data.final_capstone.required_evidence.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><h3>Remediation</h3><p>'+esc(data.final_capstone.remediation)+'</p></div>';
}
function switchTab(next){tab=next;tabByModule[moduleIndex]=tab;show('reader');renderReader();focusReader()}
root.addEventListener('click',function(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action==='student-home'){saveState();window.location.href='student-portal-cutover-preview.html?stay=1';return}
 if(b.dataset.action==='home'){show('home');renderHome();return}
 if(b.dataset.action==='capstone'){show('capstone');renderCapstone();return}
 if(b.dataset.action==='module'){lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;moduleIndex=Number(b.dataset.value)||0;lessonIndex=Number(lessonByModule[moduleIndex])||0;tab=tabByModule[moduleIndex]||'lessons';clamp();show('reader');renderReader();focusReader();return}
 if(b.dataset.action==='prev-lesson'){if(lessonIndex>0){lessonIndex--;lessonByModule[moduleIndex]=lessonIndex;switchTab('lessons')}return}
 if(b.dataset.action==='next-lesson'){if(lessonIndex<data.modules[moduleIndex].lessons.length-1){lessonIndex++;lessonByModule[moduleIndex]=lessonIndex;switchTab('lessons')}return}
 if(b.dataset.action==='last-lesson'){lessonIndex=Math.max(data.modules[moduleIndex].lessons.length-1,0);lessonByModule[moduleIndex]=lessonIndex;switchTab('lessons');return}
 if(['case','check','skills','refs'].includes(b.dataset.action)){switchTab(b.dataset.action);return}
 if(b.dataset.action==='next-module'){lessonByModule[moduleIndex]=lessonIndex;tabByModule[moduleIndex]=tab;moduleIndex=Math.min(moduleIndex+1,data.modules.length-1);lessonIndex=Number(lessonByModule[moduleIndex])||0;tab=tabByModule[moduleIndex]||'lessons';clamp();show('reader');renderReader();focusReader();return}
 if(b.dataset.tab){switchTab(b.dataset.tab);return}
 if(b.dataset.case!=null){
   const c=data.modules[moduleIndex].case.choices[Number(b.dataset.case)];
   reader.querySelector('#skills-case-feedback').innerHTML='<div class="skills-feedback"><strong>'+(c.best?'Good clinical reasoning':'Review this choice')+'</strong><p>'+esc(c.feedback)+'</p></div>';return
 }
 if(b.dataset.q!=null){
   const q=data.modules[moduleIndex].checks[Number(b.dataset.q)],correct=Number(b.dataset.a)===q.answer;
   reader.querySelector('#skills-qf-'+b.dataset.q).innerHTML='<div class="skills-feedback"><strong>'+(correct?'Correct':'Try again')+'</strong><p>'+esc(q.why)+'</p></div>';return
 }
});
loadState();renderHome();
if(currentView==='reader'){show('reader');renderReader()}
else if(currentView==='capstone'){show('capstone');renderCapstone()}
else show('home');
return{destroy:function(){saveState();container.innerHTML=''}};
}};