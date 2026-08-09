const glow=document.querySelector('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});

const demoButton=document.querySelector('#demoButton');
demoButton.addEventListener('click',()=>document.querySelector('#demo').scrollIntoView({behavior:'smooth'}));
document.querySelector('#enterButton').addEventListener('click',()=>document.querySelector('#demo').scrollIntoView({behavior:'smooth'}));

const form=document.querySelector('#composer');
const input=document.querySelector('#prompt');
const messages=document.querySelector('#messages');
const replies=[
  'That is exactly the interesting part. The best interfaces do not compete with the intelligence behind them. They make it easier for a person to direct it.',
  'A useful rule: remove friction before adding features. Complexity should exist underneath the surface, not become the user’s problem.',
  'The machine can generate the answer. The interface should help the human decide what question is worth asking next.'
];
let replyIndex=0;
form.addEventListener('submit',e=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text)return;
  const user=document.createElement('div');
  user.className='message user-message';
  user.innerHTML=`<span class="avatar">B</span><p></p>`;
  user.querySelector('p').textContent=text;
  messages.appendChild(user);
  input.value='';
  const ai=document.createElement('div');
  ai.className='message ai-message';
  ai.innerHTML='<span class="ai-symbol">✦</span><div><div class="thinking"><span></span><span></span><span></span></div><p></p></div>';
  messages.appendChild(ai);
  messages.scrollTop=messages.scrollHeight;
  setTimeout(()=>{
    ai.querySelector('.thinking').remove();
    ai.querySelector('p').textContent=replies[replyIndex++%replies.length];
  },700);
});

document.querySelectorAll('.history').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.history').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}));
