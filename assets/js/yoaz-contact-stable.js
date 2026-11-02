/* YOAZ contact form — single submit handler, safe error state, no forced mail app. */
(() => {
  'use strict';
  const phrases={
    fr:{send:'ENVOYER',busy:'ENVOI…',ok:'✓ Message envoyé. Je vous répondrai dès que possible.',error:'Envoi impossible pour le moment. Vous pouvez écrire directement à ',retry:'RÉESSAYER'},
    en:{send:'SEND',busy:'SENDING…',ok:'✓ Message sent. I will reply as soon as possible.',error:'The form is temporarily unavailable. Please email ',retry:'RETRY'},
    nl:{send:'VERZENDEN',busy:'VERZENDEN…',ok:'✓ Bericht verzonden. Ik reageer zo snel mogelijk.',error:'Het formulier is tijdelijk niet beschikbaar. Mail rechtstreeks naar ',retry:'OPNIEUW'},
    es:{send:'ENVIAR',busy:'ENVIANDO…',ok:'✓ Mensaje enviado. Responderé lo antes posible.',error:'El formulario no está disponible temporalmente. Escribe a ',retry:'REINTENTAR'}
  };
  function init(){
    const form=document.getElementById('contact-form');
    const button=document.getElementById('submit-btn');
    const message=document.getElementById('form-ok');
    if(!form||!button||!message) return;
    let sending=false;
    message.setAttribute('role','status');
    message.setAttribute('aria-live','polite');
    const language=()=>phrases[(document.documentElement.lang||'fr').slice(0,2)]||phrases.fr;
    const label=button.querySelector('span')||button;
    const presentError=()=>{
      message.textContent=language().error;
      const a=document.createElement('a');
      a.href='mailto:yoaz@hotmail.fr';
      a.textContent='yoaz@hotmail.fr';
      a.style.textDecoration='underline';
      a.style.marginLeft='.35em';
      message.appendChild(a);
      message.style.display='block';
    };
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(sending || !form.reportValidity()) return;
      sending=true;
      button.disabled=true;
      label.textContent=language().busy;
      message.style.display='none';
      message.textContent='';
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),10000);
      try{
        const response=await fetch(form.action,{
          method:'POST',
          headers:{Accept:'application/json'},
          body:new FormData(form),
          signal:controller.signal
        });
        if(!response.ok)throw new Error('Form endpoint unavailable');
        form.reset();
        message.textContent=language().ok;
        message.style.display='block';
      }catch(_){
        presentError();
      }finally{
        clearTimeout(timeout);
        sending=false;
        button.disabled=false;
        label.textContent=language().send;
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
