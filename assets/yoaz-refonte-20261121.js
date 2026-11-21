/* YOAZ 2026-11-21: restore immediately visible contact and verified social links */
(function(){
'use strict';
function a(href,label,klass){var el=document.createElement('a');el.href=href;el.textContent=label;if(klass)el.className=klass;if(/^https:/.test(href)){el.target='_blank';el.rel='noopener noreferrer'}return el}
function addOnce(parent,selector,build){if(parent&&!parent.querySelector(selector))parent.appendChild(build())}
function render(){
  var contact=document.getElementById('contact');
  if(contact){
    contact.removeAttribute('hidden');contact.setAttribute('aria-label','Contact — projets et collaborations');
    var intro=contact.querySelector('.ct-intro');
    if(intro){
      addOnce(intro,'.ct-contact-actions',function(){var row=document.createElement('div');row.className='ct-contact-actions';row.appendChild(a('mailto:yoaz@hotmail.fr?subject=Projet%20illustration%20YOAZ','Envoyer un e-mail','yoaz-direct-contact'));row.appendChild(a('#contact-form','Écrire via le formulaire','yoaz-direct-contact'));return row});
      var socials=intro.querySelector('.ct-socials');
      if(socials){
        [['https://www.facebook.com/27Yoaz/','Facebook'],['https://fr.pinterest.com/yoaz27/','Pinterest']].forEach(function(item){if(!Array.from(socials.querySelectorAll('a')).some(function(el){return el.href===item[0]}))socials.appendChild(a(item[0],item[1],'ct-soc'))})
      }
    }
    var form=contact.querySelector('#contact-form');if(form){form.removeAttribute('hidden');form.style.removeProperty('display');form.setAttribute('aria-label','Formulaire de demande de projet')}
  }
  var footer=document.querySelector('.site-footer .footer-links');
  if(footer){[['https://www.linkedin.com/in/yo-az-2982815a/','LinkedIn'],['https://fr.pinterest.com/yoaz27/','Pinterest'],['https://www.facebook.com/27Yoaz/','Facebook']].forEach(function(item){if(!Array.from(footer.querySelectorAll('a')).some(function(el){return el.href===item[0]})){var sep=document.createElement('span');sep.textContent='·';sep.className='footer-sep';sep.setAttribute('aria-hidden','true');footer.appendChild(sep);footer.appendChild(a(item[0],item[1]))}})}
  [document.querySelector('#hero .hbtns'),document.querySelector('#yoaz-mobile-hero .yoaz-mobile-hero-copy')].forEach(function(box){addOnce(box,'.yoaz-direct-contact',function(){return a('mailto:yoaz@hotmail.fr?subject=Collaboration%20YOAZ','Parler d’un projet','yoaz-direct-contact')})});
  var gallery=document.getElementById('gallery');if(gallery){var city=gallery.querySelector('.gal-item img[src*="cite-psychedelique"]');if(city){city.setAttribute('loading','lazy');city.style.objectFit='contain'}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
