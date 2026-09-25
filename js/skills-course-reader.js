window.ItasaSkillsCourse={mount:function(container,data){
'use strict';
container.innerHTML='<div id="itasa-skills-course"><p class="skills-preview">Skills Refresher teaching draft · Review account only · Practice responses are not saved</p><div class="skills-top"><button class="skills-link" data-action="home">All modules</button><button class="skills-link" data-action="capstone">Final integrated scenario</button><span class="spacer"></span><span class="skills-meta">120 hours · Six weekends</span></div><section id="skills-home"></section><section id="skills-reader" hidden></section><section id="skills-capstone" hidden></section></div>';
const root=container.querySelector('#itasa-skills-course'),home=root.querySelector('#skills-home'),reader=root.querySelector('#skills-reader'),cap=root.querySelector('#skills-capstone');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let moduleIndex=0,tab='lessons';
function show(name){home.hidden=name!=='home';reader.hidden=name!=='reader';cap.hidden=name!=='capstone'}
function renderHome(){
 home.innerHTML='<div class="skills-label">RN Skills Refresher</div><h2>'+esc(data.title)+'</h2><p>'+esc(data.introduction)+'</p><div class="skills-hours"><div><strong>6 hrs</strong><br><span class="skills-meta">Knowledge review</span></div><div><strong>4 hrs</strong><br><span class="skills-meta">Cases & judgment</span></div><div><strong>8 hrs</strong><br><span class="skills-meta">Guided practice</span></div><div><strong>2 hrs</strong><br><span class="skills-meta">Reflection/check-off</span></div></div><p class="skills-meta">'+esc(data.hour_model.note)+'</p><div class="skills-grid">'+data.modules.map((m,i)=>'<article class="skills-module"><div class="skills-label">Weekend '+esc(m.weekend)+' · 20 hours</div><h3>'+esc(m.title)+'</h3><p>'+esc(m.subtitle)+'</p><p class="skills-meta">'+m.lessons.length+' lessons · '+m.checkoffs.length+' check-off skill'+(m.checkoffs.length===1?'':'s')+'</p><button class="skills-btn" data-action="module" data-value="'+i+'">Open module</button></article>').join('')+'</div>';
}
function renderReader(){
 const m=data.modules[moduleIndex];
 reader.innerHTML='<button class="skills-link" data-action="home">← All modules</button><div class="skills-label" style="margin-top:14px">Weekend '+esc(m.weekend)+' · Module '+(moduleIndex+1)+'</div><h2>'+esc(m.title)+'</h2><p>'+esc(m.goal)+'</p><nav class="skills-nav"><button class="skills-link" data-tab="lessons">Lessons</button><button class="skills-link" data-tab="case">Patient case</button><button class="skills-link" data-tab="check">Knowledge check</button><button class="skills-link" data-tab="skills">Skills check-offs</button><button class="skills-link" data-tab="refs">References</button></nav><div id="skills-content" class="skills-panel"></div>';
 reader.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.tab===tab?'true':'false')});
 const box=reader.querySelector('#skills-content');
 if(tab==='lessons'){
   box.innerHTML=m.lessons.map((l,i)=>'<article class="skills-lesson"><div class="skills-label">Lesson '+(i+1)+' of '+m.lessons.length+'</div><h3>'+esc(l.title)+'</h3>'+l.body.map(p=>'<p>'+esc(p)+'</p>').join('')+'<div class="skills-callout"><strong>Try it</strong><p>'+esc(l.practice)+'</p></div></article>').join('');
 } else if(tab==='case'){
   box.innerHTML='<h3>'+esc(m.case.title)+'</h3><p>'+esc(m.case.scene)+'</p>'+m.case.choices.map((c,i)=>'<button class="skills-choice" data-case="'+i+'">'+esc(c.label)+'</button>').join('')+'<div id="skills-case-feedback"></div>';
 } else if(tab==='check'){
   box.innerHTML=m.checks.map((q,qi)=>'<article class="skills-lesson"><h3>'+esc(q.q)+'</h3>'+q.options.map((o,oi)=>'<button class="skills-choice" data-q="'+qi+'" data-a="'+oi+'">'+esc(o)+'</button>').join('')+'<div id="skills-qf-'+qi+'"></div></article>').join('');
 } else if(tab==='skills'){
   box.innerHTML='<p class="skills-meta">These are preparation guides. The instructor uses the approved procedure-specific checklist and current facility/device instructions for validation.</p>'+m.checkoffs.map((s,i)=>'<article class="skills-checkoff"><div class="skills-label">Check-off '+(i+1)+'</div><h3>'+esc(s.title)+'</h3><p><strong>Student preparation:</strong> '+esc(s.studentPrep)+'</p><strong>Instructor looks for:</strong><ul>'+s.lookFor.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></article>').join('');
 } else {
   box.innerHTML='<h3>References for this module</h3><ul>'+m.sources.map(id=>data.sources.find(s=>s.id===id)).filter(Boolean).map(s=>'<li><a target="_blank" rel="noopener" href="'+esc(s.url)+'">'+esc(s.title)+'</a><div class="skills-meta">'+esc(s.note)+'</div></li>').join('')+'</ul>';
 }
}
function renderCapstone(){
 cap.innerHTML='<button class="skills-link" data-action="home">← All modules</button><div class="skills-capstone" style="margin-top:14px"><div class="skills-label">Final integration</div><h2>'+esc(data.final_capstone.title)+'</h2><p>'+esc(data.final_capstone.brief)+'</p><h3>Required evidence</h3><ul>'+data.final_capstone.required_evidence.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><h3>Remediation</h3><p>'+esc(data.final_capstone.remediation)+'</p></div>';
}
root.addEventListener('click',function(e){
 const b=e.target.closest('button'); if(!b)return;
 if(b.dataset.action==='home'){show('home');renderHome();return}
 if(b.dataset.action==='capstone'){show('capstone');renderCapstone();return}
 if(b.dataset.action==='module'){moduleIndex=Number(b.dataset.value)||0;tab='lessons';show('reader');renderReader();return}
 if(b.dataset.tab){tab=b.dataset.tab;renderReader();return}
 if(b.dataset.case!=null){
   const c=data.modules[moduleIndex].case.choices[Number(b.dataset.case)];
   reader.querySelector('#skills-case-feedback').innerHTML='<div class="skills-feedback"><strong>'+(c.best?'Good clinical reasoning':'Review this choice')+'</strong><p>'+esc(c.feedback)+'</p></div>';return
 }
 if(b.dataset.q!=null){
   const q=data.modules[moduleIndex].checks[Number(b.dataset.q)],correct=Number(b.dataset.a)===q.answer;
   reader.querySelector('#skills-qf-'+b.dataset.q).innerHTML='<div class="skills-feedback"><strong>'+(correct?'Correct':'Try again')+'</strong><p>'+esc(q.why)+'</p></div>';return
 }
});
renderHome();show('home');
return{destroy:function(){container.innerHTML=''}};
}};