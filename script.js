const glow=document.querySelector('.cursor-glow');
const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('pointermove',e=>{
  if(prefersReducedMotion)return;
  glow.style.left=e.clientX+'px';
  glow.style.top=e.clientY+'px';
});

const scrollToDemo=()=>document.querySelector('#demo').scrollIntoView({behavior:'smooth'});
document.querySelector('#demoButton').addEventListener('click',scrollToDemo);
document.querySelector('#enterButton').addEventListener('click',scrollToDemo);

const form=document.querySelector('#composer');
const input=document.querySelector('#prompt');
const messages=document.querySelector('#messages');
const replies=[
  'It wins because it feels like a collaborator, not a calculator in a blazer. The conversation stays stable while the task changes.',
  'The interface is doing real work here. It removes friction, keeps context alive, and makes the next step obvious without being pushy.',
  'The strongest system is the one that keeps the human oriented. Everything else is just expensive noise.'
];
let replyIndex=0;

const historyButtons=document.querySelectorAll('.history');
historyButtons.forEach(btn=>btn.addEventListener('click',()=>{
  historyButtons.forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  input.value=btn.textContent.trim();
}));

form.addEventListener('submit',e=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text)return;

  const user=document.createElement('div');
  user.className='message user-message';
  user.innerHTML='<span class="avatar">B</span><p></p>';
  user.querySelector('p').textContent=text;
  messages.appendChild(user);

  input.value='';
  const ai=document.createElement('div');
  ai.className='message ai-message';
  ai.innerHTML='<span class="ai-symbol">✦</span><div><div class="thinking"><span></span><span></span><span></span></div><p></p></div>';
  messages.appendChild(ai);
  messages.scrollTop=messages.scrollHeight;

  setTimeout(()=>{
    const thinking=ai.querySelector('.thinking');
    if(thinking)thinking.remove();
    ai.querySelector('p').textContent=replies[replyIndex++%replies.length];
    messages.scrollTop=messages.scrollHeight;
  }, prefersReducedMotion ? 0 : 760);
});

const revealItems=[...document.querySelectorAll('.feature-card, .rival-card, .statement h2, .statement-copy, .future-copy')];
if(!prefersReducedMotion && 'IntersectionObserver' in window){
  revealItems.forEach(el=>el.classList.add('reveal'));
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.15});
  revealItems.forEach(el=>io.observe(el));
}
