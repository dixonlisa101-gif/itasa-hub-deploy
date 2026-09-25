
window.ItasaIvCourse = { mount(container, data, options) {
  'use strict';
  options = options || {};
  container.innerHTML = "<div id=\"itasa-iv-course\">\n\n<p class=\"iv-preview\">First teaching draft \u00b7 Enrollment on hold \u00b7 Preview responses stay in this page only</p>\n<section class=\"iv-app\" aria-label=\"ITASA IV course draft\">\n<header class=\"iv-top\"><div class=\"iv-brand\">ITASA<small>Learning Center</small></div><div><button type=\"button\" class=\"iv-link cursor-interaction\" data-action=\"home\">All modules</button><button type=\"button\" class=\"iv-link cursor-interaction\" data-action=\"instructor\">Teaching notes</button></div></header>\n<main class=\"iv-body\">\n<section id=\"iv-home\"><div class=\"iv-label\">IV INSERTION &amp; VENIPUNCTURE</div><h2>Learn with purpose.</h2><p class=\"iv-sub\">Six modules. Eighteen lessons. One connected learning journey.</p><p id=\"iv-intro\"></p><div id=\"iv-modules\" class=\"iv-grid\"></div><div class=\"iv-actions\"><button type=\"button\" class=\"iv-button primary cursor-interaction\" data-action=\"capstone\">Open the final practice exercise</button><span class=\"iv-meta\">Knowledge practice + supervised skills preparation</span></div></section>\n<section id=\"iv-reader\" hidden><button type=\"button\" class=\"iv-link cursor-interaction\" data-action=\"home\">\u2190 All modules</button><div id=\"iv-module-number\" class=\"iv-label\"></div><h2 id=\"iv-module-heading\"></h2><p id=\"iv-module-goal\" class=\"iv-sub\"></p><nav id=\"iv-section-nav\" class=\"iv-controls\" aria-label=\"Module activities\"></nav><div id=\"iv-content\"></div><details><summary class=\"cursor-interaction\">References for this module</summary><ul id=\"iv-references\"></ul></details></section>\n<section id=\"iv-capstone\" hidden></section>\n<section id=\"iv-instructor\" hidden></section>\n<div id=\"iv-live\" class=\"iv-sr\" aria-live=\"polite\"></div>\n</main></section>\n\n\n</div>\n";
  const root=container.querySelector("#itasa-iv-course");
  const $=id=>root.querySelector('#'+id);
  const teaching = options.teachingNotes === true && Array.isArray(data.instructorNotes);
  root.querySelector('[data-action=instructor]').hidden = !teaching;
  root.querySelector('.iv-preview').textContent = options.review ? 'IV course draft · Revision 7 · Enrollment on hold · Practice responses are not saved' : 'IV course · Practice responses are not saved';
  const names=['Learn','Walkthrough','Patient case','Knowledge check','Skills practice'];
  const keys=['learn','walk','case','check','skills'];
  const state={module:0,section:'learn',lesson:0,scene:0,answers:{},reflections:{},skills:{},sequences:{},phaseQuestions:{}};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,value='',primary=false)=>'<button type="button" class="iv-button '+(primary?'primary ':'')+'cursor-interaction" data-action="'+action+'" data-value="'+esc(value)+'">'+esc(text)+'</button>';
  const paragraphs=arr=>arr.map(p=>'<p>'+esc(p)+'</p>').join('');
  const list=arr=>'<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  const announce=text=>$('iv-live').textContent=text;
  function view(name){['home','reader','capstone','instructor'].forEach(x=>$('iv-'+x).hidden=x!==name);}
  function home(){view('home');announce('Six IV course modules.');}
  function openModule(i){state.module=i;state.lesson=0;state.scene=0;state.section='learn';view('reader');render();}
  function refs(ids){return ids.map(id=>data.sources.find(s=>s.id===id)).filter(Boolean).map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><div class="iv-meta">'+esc(s.note)+'</div></li>').join('');}
  function sequenceState(){const key=data.modules[state.module].id+'-'+state.lesson;return state.sequences[key]||(state.sequences[key]={order:[],checked:false});}
  function tryIt(lesson){
    return '<div class="iv-callout"><strong>Try it</strong><p>'+esc(lesson.task)+'</p>'+(lesson.taskContext?'<p>'+esc(lesson.taskContext)+'</p>':'')+(lesson.taskSteps?'<ol>'+lesson.taskSteps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'')+(lesson.taskExample?'<p><strong>Example start:</strong> '+esc(lesson.taskExample)+'</p>':'')+'</div>';
  }
  function sequenceActivity(activity){
    if(!activity||activity.type!=='sequence')return '';
    const s=sequenceState(),items=activity.items,key=data.modules[state.module].id+'-'+state.lesson;
    const complete=s.order.length===items.length,correct=complete&&s.order.every((x,i)=>x===i);
    const choices=activity.displayOrder.map(i=>{const position=s.order.indexOf(i);return '<button type="button" class="iv-choice cursor-interaction" data-action="phase-pick" data-value="'+i+'" aria-pressed="'+(position!==-1)+'" '+(position!==-1?'disabled':'')+'>'+esc(items[i].label)+(position!==-1?'<small>Placed at position '+(position+1)+'</small>':'')+'</button>';}).join('');
    const ordered=s.order.length?'<ol>'+s.order.map((x,i)=>'<li>'+esc(items[x].label)+(s.checked?'<div class="iv-meta">'+(x===i?'Correct position. ':'Review this position. ')+esc(items[x].why)+'</div>':'')+'</li>').join('')+'</ol>':'<p>Your first selection goes here.</p>';
    const feedback=s.checked?'<div class="iv-callout" role="status"><strong>'+(correct?'Correct order':'Review your order')+'</strong><p>'+(correct?'Now write one safety question for each phase.':'Use the explanations beside your choices, then start again or undo your last choice.')+'</p></div>':'';
    const questions=s.checked&&correct?'<h4>Your safety questions</h4>'+items.map((item,i)=>{const id=key+'-'+i;return '<label for="iv-phase-question-'+i+'">'+(i+1)+'. '+esc(item.label)+'</label><textarea id="iv-phase-question-'+i+'" data-phase-question="'+esc(id)+'" placeholder="What would you need to confirm at this phase?">'+esc(state.phaseQuestions[id]||'')+'</textarea>';}).join('')+'<p class="iv-meta">Your questions stay on this page until it is reloaded. They are not submitted or automatically graded.</p>':'';
    return '<section class="iv-sequence" aria-label="Five-phase ordering activity"><h4>'+esc(activity.title)+'</h4><p>Tap the phase you would do first, then continue in order.</p>'+choices+'<h4>Your order · '+s.order.length+' of '+items.length+'</h4>'+ordered+'<div class="iv-actions"><button type="button" class="iv-button cursor-interaction" data-action="phase-undo" '+(!s.order.length?'disabled':'')+'>Undo last choice</button><button type="button" class="iv-button cursor-interaction" data-action="phase-reset" '+(!s.order.length?'disabled':'')+'>Start again</button><button type="button" class="iv-button primary cursor-interaction" data-action="phase-check" '+(!complete?'disabled':'')+'>Check order</button></div>'+feedback+questions+'</section>';
  }
  function render(){
    const m=data.modules[state.module],selected=state.section;
    $('iv-module-number').textContent='MODULE '+String(state.module+1).padStart(2,'0');$('iv-module-heading').textContent=m.title;$('iv-module-goal').textContent=m.goal;
    $('iv-section-nav').innerHTML=keys.map((key,i)=>'<button type="button" class="iv-button cursor-interaction" data-action="section" data-value="'+key+'" aria-pressed="'+(selected===key)+'">'+names[i]+'</button>').join('');
    let html='';
    if(selected==='learn'){
      const l=m.lessons[state.lesson];
      html='<div class="iv-controls" aria-label="Lessons">'+m.lessons.map((l,i)=>'<button type="button" class="iv-button cursor-interaction" data-action="lesson" data-value="'+i+'" aria-pressed="'+(state.lesson===i)+'">Lesson '+(i+1)+'</button>').join('')+'</div><article class="iv-panel"><div class="iv-label">LESSON '+(state.lesson+1)+' OF '+m.lessons.length+'</div><h3>'+esc(l.title)+'</h3>'+paragraphs(l.body)+tryIt(l)+sequenceActivity(l.activity)+'</article><div class="iv-actions">'+(state.lesson?button('← Previous lesson','lesson',state.lesson-1):'<span></span>')+button(state.lesson<m.lessons.length-1?'Next lesson →':'Open the walkthrough →',state.lesson<m.lessons.length-1?'lesson':'section',state.lesson<m.lessons.length-1?state.lesson+1:'walk',true)+'</div>';
    }else if(selected==='walk'){
      const s=m.story[state.scene];
      html='<article class="iv-panel"><div class="iv-label">STUDENT WALKTHROUGH · SCENE '+(state.scene+1)+' OF '+m.story.length+'</div><h3>'+esc(s.title)+'</h3><div class="iv-callout"><p>'+esc(s.voice)+'</p></div><h4>What to notice</h4><p>'+esc(s.notice)+'</p><div class="iv-actions">'+button('← Previous','scene',Math.max(0,state.scene-1))+button(state.scene<m.story.length-1?'Next scene →':'Try the patient case →',state.scene<m.story.length-1?'scene':'section',state.scene<m.story.length-1?state.scene+1:'case',true)+'</div></article><p class="iv-meta">Use this walkthrough to prepare for practice with your instructor.</p>';
    }else if(selected==='case'){
      const c=m.case,answer=state.answers[m.id+'-case'];
      html='<article class="iv-panel"><div class="iv-label">FICTIONAL PATIENT CASE</div><h3>'+esc(c.title)+'</h3><p>'+esc(c.scene)+'</p>'+c.choices.map((ch,i)=>'<button type="button" class="iv-choice cursor-interaction" data-action="case-answer" data-value="'+i+'" aria-pressed="'+(answer===i)+'">'+esc(ch.label)+'</button>').join('')+(answer!==undefined?'<div class="iv-callout" role="status"><strong>'+(c.choices[answer].best?'Reasoning to carry forward':'Revisit the decision')+'</strong><p>'+esc(c.choices[answer].feedback)+'</p></div>':'')+'<label for="iv-reflection">Explain your thinking</label><p>'+esc(c.reflection)+'</p><textarea id="iv-reflection" data-reflection="'+esc(m.id)+'" placeholder="Use fictional information only…">'+esc(state.reflections[m.id]||'')+'</textarea><p class="iv-meta">Your writing stays on this page until the page is reloaded. It is not submitted or automatically graded.</p>'+button('Continue to knowledge check →','section','check',true)+'</article>';
    }else if(selected==='check'){
      html='<p class="iv-sub">Two practice questions. Review the explanation after each choice.</p>'+m.checks.map((q,qi)=>{const a=state.answers[m.id+'-q'+qi];return '<article class="iv-panel"><div class="iv-label">QUESTION '+(qi+1)+'</div><h3>'+esc(q.prompt)+'</h3>'+q.choices.map((choice,i)=>'<button type="button" class="iv-choice cursor-interaction" data-action="check-answer" data-question="'+qi+'" data-value="'+i+'" aria-pressed="'+(a===i)+'">'+esc(choice)+'</button>').join('')+(a!==undefined?'<div class="iv-callout" role="status"><strong>'+(a===q.answer?'Correct reasoning':'Review and try again')+'</strong><p>'+esc(q.why)+'</p></div>':'')+'</article>';}).join('')+'<p class="iv-meta">Practice feedback only; no official grade or completion credit is recorded.</p>'+button('Prepare for skills practice →','section','skills',true);
    }else{
      html='<article class="iv-panel"><h3>Bring this to supervised practice</h3><p>Use these prompts to prepare questions for your instructor. Checking a box here does not validate a skill.</p><div class="iv-checklist">'+m.skills.map((s,i)=>'<label><input type="checkbox" data-skill="'+i+'" '+(state.skills[m.id+'-'+i]?'checked':'')+'><span>'+esc(s)+'</span></label>').join('')+'</div></article><div class="iv-actions">'+button('Back to modules','home')+button(state.module<data.modules.length-1?'Next module →':'Final practice exercise →',state.module<data.modules.length-1?'module':'capstone',state.module+1,true)+'</div>';
    }
    $('iv-content').innerHTML=html;$('iv-references').innerHTML=refs(m.sources);announce(m.title+' — '+names[keys.indexOf(selected)]);
    if (options.rememberLocation) history.replaceState(null, '', '#module='+(state.module+1)+'&lesson='+(state.lesson+1)+'&section='+state.section);
  }
  function instructor(){
    if (!teaching) return;
    $('iv-instructor').innerHTML=button('← Learning space','home')+'<div class="iv-label">INSTRUCTOR COMPANION</div><h2>Teach the reasoning. Observe the skill.</h2><div class="iv-panel"><h3>Course development & release notes</h3>'+list(data.instructorNotes)+'</div>'+data.modules.map((m,i)=>'<details><summary class="cursor-interaction">'+(i+1)+'. '+esc(m.title)+'</summary><div class="iv-panel"><h4>Set up the activity</h4><p>'+esc(m.instructor.setup)+'</p>'+(m.instructor.sessionChecklist?'<h4>Required session sequence — draft</h4><ol>'+m.instructor.sessionChecklist.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'')+'<h4>Discussion prompts</h4>'+list(m.instructor.prompts)+'<h4>What to observe</h4><p>'+esc(m.instructor.evidence)+'</p><h4>Practice checklist</h4>'+list(m.skills)+'</div></details>').join('')+'<details><summary class="cursor-interaction">Source register</summary><ul>'+refs(data.sources.map(s=>s.id))+'</ul></details>';
    view('instructor');announce('Instructor companion and course development notes.');
  }
  function capstone(){
    const c=data.capstone;$('iv-capstone').innerHTML=button('← Learning space','home')+'<div class="iv-label">FINAL PRACTICE EXERCISE</div><h2>'+esc(c.title)+'</h2><p>'+esc(c.brief)+'</p><article class="iv-panel"><h3>Your rehearsal</h3><ol>'+c.tasks.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></article><article class="iv-panel"><h3>Your practice goals</h3>'+c.rubric.map(r=>'<h4>'+esc(r.area)+'</h4><p>'+esc(r.lookFor)+'</p>').join('')+'</article><p class="iv-meta">This exercise does not automatically issue a certificate or record a competency decision.</p>';view('capstone');announce('Final practice exercise.');
  }
  $('iv-intro').textContent=data.introduction;
  $('iv-modules').innerHTML=data.modules.map((m,i)=>'<button type="button" class="iv-card-button cursor-interaction" data-action="module" data-value="'+i+'"><span class="iv-number">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(m.title)+'</strong><small>'+esc(m.subtitle)+'</small><small>3 lessons · case · practice →</small></span></button>').join('');
  root.addEventListener('click',event=>{
    const b=event.target.closest('button[data-action]');if(!b||!root.contains(b))return;
    const a=b.dataset.action,v=b.dataset.value;
    if(a==='home')return home();if(a==='module')return openModule(Number(v));if(a==='instructor')return instructor();if(a==='capstone')return capstone();
    if(a==='section'){state.section=v;render();return;}
    if(a==='lesson'){state.lesson=Number(v);render();return;}
    if(a==='scene'){state.scene=Number(v);render();return;}
    if(a.startsWith('phase-')){
      const activity=data.modules[state.module].lessons[state.lesson].activity;
      if(state.section!=='learn'||!activity||activity.type!=='sequence')return;
      const s=sequenceState(),n=Number(v);
      if(a==='phase-pick'&&Number.isInteger(n)&&n>=0&&n<activity.items.length&&!s.order.includes(n)){s.order.push(n);s.checked=false;}
      if(a==='phase-undo'){s.order.pop();s.checked=false;}
      if(a==='phase-reset'){s.order=[];s.checked=false;}
      if(a==='phase-check'&&s.order.length===activity.items.length)s.checked=true;
      render();
      const correct=s.checked&&s.order.every((x,i)=>x===i);
      announce(a==='phase-check'?(correct?'Correct order. Write your safety questions below.':'Review your order and try again.'):s.order.length+' of '+activity.items.length+' phases placed.');
      const selector=correct?'.iv-sequence textarea':a==='phase-check'?'[data-action="phase-reset"]':s.order.length<activity.items.length?'[data-action="phase-pick"]:not(:disabled)':'[data-action="phase-check"]';
      const target=root.querySelectorAll?.(selector)?.[0];if(target)target.focus();
      return;
    }
    const m=data.modules[state.module];
    if(a==='case-answer'){state.answers[m.id+'-case']=Number(v);render();return;}
    if(a==='check-answer'){state.answers[m.id+'-q'+b.dataset.question]=Number(v);render();return;}
  });
  root.addEventListener('input',event=>{const el=event.target;if(el.dataset.reflection)state.reflections[el.dataset.reflection]=el.value;if(el.dataset.phaseQuestion)state.phaseQuestions[el.dataset.phaseQuestion]=el.value;});
  root.addEventListener('change',event=>{const el=event.target;if(el.dataset.skill!==undefined)state.skills[data.modules[state.module].id+'-'+el.dataset.skill]=el.checked;});
  home();
  if (options.rememberLocation) {
    const route = new URLSearchParams(location.hash.slice(1));
    const moduleIndex = Number(route.get('module')) - 1;
    if (Number.isInteger(moduleIndex) && moduleIndex >= 0 && moduleIndex < data.modules.length) {
      openModule(moduleIndex);
      const lessonIndex = Number(route.get('lesson')) - 1;
      if (Number.isInteger(lessonIndex) && lessonIndex >= 0 && lessonIndex < data.modules[moduleIndex].lessons.length) state.lesson = lessonIndex;
      if (keys.includes(route.get('section'))) state.section = route.get('section');
      render();
    }
  }
  return { destroy() { container.replaceChildren(); } };
}};
