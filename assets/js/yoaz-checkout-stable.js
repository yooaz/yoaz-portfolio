/* YOAZ shop — single checkout click handler; preserves existing five print cards. */
(() => {
 'use strict';
 const ENDPOINT='/.netlify/functions/create-checkout';
 const HOSTS=new Set(['buy.stripe.com','checkout.stripe.com','pay.stripe.com']);
 let requestActive=false;
 const copy={
  fr:{loading:'PAIEMENT…',error:'Le paiement est momentanément indisponible. Réessayez ou écrivez à ',buy:'Acheter'},
  en:{loading:'CHECKOUT…',error:'Checkout is temporarily unavailable. Please retry or email ',buy:'Buy'},
  nl:{loading:'BETALEN…',error:'Betalen is tijdelijk niet mogelijk. Probeer opnieuw of mail ',buy:'Kopen'},
  es:{loading:'PAGO…',error:'El pago no está disponible temporalmente. Reintenta o escribe a ',buy:'Comprar'}
 };
 const t=()=>copy[(document.documentElement.lang||'fr').slice(0,2)]||copy.fr;
 function statusElement(){
   let status=document.getElementById('stripe-inline-status');
   if(status)return status;
   const shop=document.getElementById('shop');
   if(!shop)return null;
   status=document.createElement('p');
   status.id='stripe-inline-status';
   status.setAttribute('role','status');
   status.setAttribute('aria-live','polite');
   status.style.cssText='margin:1rem auto 0;max-width:760px;font-size:.85rem;line-height:1.5;color:#4e4942;text-align:center';
   (shop.querySelector('.editions-head')||shop).appendChild(status);
   return status;
 }
 function safeCheckout(value){
   try{
     const url=new URL(String(value||''));
     if(url.protocol!=='https:' || url.username || url.password || !HOSTS.has(url.hostname.toLowerCase()))return null;
     return url.href;
   }catch(_){return null;}
 }
 document.addEventListener('click',async event=>{
   const button=event.target.closest&&event.target.closest('#shop button[data-buy]');
   if(!button)return;
   event.preventDefault();
   event.stopImmediatePropagation();
   if(button.disabled||requestActive)return;
   requestActive=true;
   button.disabled=true;
   const originalLabel=button.textContent;
   button.textContent=t().loading;
   const notice=statusElement();
   if(notice)notice.textContent='';
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),12000);
   try{
     const response=await fetch(ENDPOINT,{
       method:'POST',
       headers:{'Content-Type':'application/json','Accept':'application/json'},
       body:JSON.stringify({slug:button.getAttribute('data-buy')}),
       signal:controller.signal
     });
     if(!response.ok)throw new Error('Checkout unavailable');
     const result=await response.json();
     const destination=safeCheckout(result&&result.url);
     if(!destination)throw new Error('Invalid checkout destination');
     window.location.assign(destination);
   }catch(_){
     if(notice){
       notice.textContent=t().error;
       const email=document.createElement('a');
       email.href='mailto:yoaz@hotmail.fr';
       email.textContent='yoaz@hotmail.fr';
       email.style.textDecoration='underline';
       notice.appendChild(email);
     }
     button.disabled=false;
     button.textContent=originalLabel||t().buy;
     requestActive=false;
   }finally{
     clearTimeout(timeout);
   }
 },true);
})();
