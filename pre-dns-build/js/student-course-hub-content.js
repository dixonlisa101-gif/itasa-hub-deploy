(function(){
'use strict';

function esc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function fmt(v){
  if(!v)return '';
  var d=new Date(v);
  return isNaN(d.getTime())?String(v):d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}
function label(v){
  return v==='announcement'?'Announcement':
    v==='assignment'?'Assignment':
    v==='workbook_instruction'?'Workbook Instruction':
    v==='material'?'Course Material':
    v==='resource'?'Course Resource':
    v==='instructor_message'?'Instructor Communication':'Class Information';
}
function render(box,payload){
  var items=payload&&payload.status==='ok'&&Array.isArray(payload.items)?payload.items:[];
  if(!items.length){
    box.innerHTML='<p class="muted">No instructor-posted class items are available right now.</p>';
    return;
  }
  var order=['announcement','instructor_message','assignment','workbook_instruction','material','resource'];
  box.innerHTML=order.map(function(type){
    var rows=items.filter(function(x){return x.item_type===type});
    if(!rows.length)return '';
    return '<section class="course-hub-group"><h3>'+esc(label(type))+'</h3>'+
      rows.map(function(x){
        return '<article class="course-hub-item">'+
          '<div class="eyebrow">'+esc(label(type))+'</div>'+
          '<h3>'+esc(x.title||'Class item')+'</h3>'+
          (x.posted_by?'<div class="muted">Posted by '+esc(x.posted_by)+(x.updated_at?' · '+esc(fmt(x.updated_at)):'')+'</div>':'')+
          (x.due_at?'<p class="muted"><strong>Due:</strong> '+esc(fmt(x.due_at))+'</p>':'')+
          (x.body?'<p>'+esc(x.body)+'</p>':'')+
          (x.resource_url?'<p><a class="btn secondary" target="_blank" rel="noopener" href="'+esc(x.resource_url)+'">Open linked item</a></p>':'')+
        '</article>';
      }).join('')+'</section>';
  }).join('');
}
async function load(box,email,code){
  if(!box)return;
  box.innerHTML='<p class="muted">Loading instructor-posted class items…</p>';
  try{
    if(!window.ItasaStudentPortal||!window.ItasaStudentPortal.getCourseHubItems)throw new Error('Student Hub bridge unavailable.');
    var r=await window.ItasaStudentPortal.getCourseHubItems(email,code);
    if(!r||r.status!=='ok')throw new Error((r&&r.status)||'Unable to load class Hub items.');
    render(box,r);
  }catch(e){
    console.error('ITASA class Hub content load failed',e);
    box.innerHTML='<p class="muted">Instructor-posted class items could not be loaded right now. Your course lessons and progress are still available.</p>';
  }
}
window.ItasaStudentCourseHub={load:load,render:render};
})();