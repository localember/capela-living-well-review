/* ============================================================
   SAGE v2 - shared behaviour, homepage + internal pages.

   Extracted from v2.html's inline script 2026-08-01 when the
   internal pages were added, because five copies of a reveal
   observer is five places a correction has to land.

   Every block here is null-guarded on the elements it needs, so
   the same file runs on a page that has a hero and a page that
   does not. Nothing below MAKES CONTENT EXIST - the hidden
   start-states are gated on `.js` in the stylesheet, so a page
   whose script fails renders fully visible rather than blank.
   ============================================================ */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return [].slice.call((c||document).querySelectorAll(s)); };

  /* ---- reveal / wipe / mask: one observer, one timing ---- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      if(e.target.hasAttribute('data-count')) countUp(e.target);
      $$('[data-count]', e.target).forEach(countUp);
    });
  }, {threshold:0.14, rootMargin:'0px 0px -6% 0px'});
  $$('.reveal,.wipe,.slide-l,.slide-r,.ghost,[data-count],.hero .mask,.hero,.ihero')
    .forEach(function(el){ io.observe(el); });

  /* The about choreography gets its own, much LATER trigger. The page-wide
     observer fires at 14% visible with a -6% inset, i.e. the moment a band
     peeks in from the bottom - which had this sequence finished before it was
     ever looked at. This one waits until the stack is 45% visible AND 28% up
     from the bottom edge, then fires the ghost and all three figures from a
     single point so the stagger stays entirely in CSS. */
  var aboutGrid = $('#about .about__grid');
  if (aboutGrid) {
    var aboutGhost = $('#about .ghost');
    if (aboutGhost) io.unobserve(aboutGhost);   // driven by ioAbout, not the page-wide one
    var ioAbout = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        ioAbout.disconnect();
        if (aboutGhost) aboutGhost.classList.add('is-in');
        $$('.about__stack figure').forEach(function(f){ f.classList.add('is-in'); });
      });
    }, {threshold: 0.45, rootMargin: '0px 0px -28% 0px'});
    ioAbout.observe(aboutGrid);
  }

  // a hero is above the fold, so kick it immediately
  requestAnimationFrame(function(){
    var h = $('.hero') || $('.ihero');
    if (h) h.classList.add('is-in');
  });

  /* The TRUE value is the element's own text, so a stalled or failed
     animation leaves the real number on screen rather than "0". */
  function countUp(el){
    if(el.dataset.done) return; el.dataset.done='1';
    var t=parseFloat(el.dataset.count), dec=parseInt(el.dataset.dec||'0',10), sfx=el.dataset.suffix||'', dur=reduce?0:1500, t0=null;
    if(!dur){ el.textContent=t.toFixed(dec)+sfx; return; }
    (function step(ts){
      if(t0===null) t0=ts;
      var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3);
      el.textContent=(t*e).toFixed(dec)+sfx;
      if(p<1) requestAnimationFrame(step);
    })(performance.now());
  }

  /* ---- scroll-linked: hero parallax + nav condense + CONTACT US rise ---- */
  var nav=$('#nav'), heroImg=$('#heroImg'), hero=$('.hero'),
      mega=$('#mega'), megaWrap=$('.foot__megawrap'), stuck=null, ticking=false;

  function frame(){
    ticking=false;
    var y=scrollY;

    if(nav){
      var s=y>60;
      if(s!==stuck){ nav.classList.toggle('is-stuck',s); stuck=s; }
    }

    if(!reduce && heroImg && hero){
      var hh=hero.offsetHeight;
      if(y<hh) heroImg.style.transform='translate3d(0,'+(y*0.22)+'px,0) scale('+(1+y/hh*0.06)+')';
    }

    /* CONTACT US slides up from behind the cards as the footer enters */
    if(mega && megaWrap){
      var r=megaWrap.getBoundingClientRect();
      var p=(innerHeight-r.top)/(innerHeight*0.55);
      p=Math.max(0,Math.min(1,p));
      var eased=1-Math.pow(1-p,3);
      mega.style.setProperty('--rise', reduce ? '0%' : (100-eased*100).toFixed(2)+'%');
    }
  }
  addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } },{passive:true});
  addEventListener('resize',frame,{passive:true});
  frame();

  /* ---- team band: solo <-> team (homepage only) ---- */
  $$('.teamswitch button').forEach(function(b){
    b.addEventListener('click',function(){
      $$('.teamswitch button').forEach(function(o){ o.classList.toggle('on',o===b); });
      $$('.teamstate').forEach(function(s){ s.classList.remove('on'); });
      var t=document.getElementById('state-'+b.dataset.state);
      if(!t) return;
      t.classList.add('on');
      $$('.reveal',t).forEach(function(el){ el.classList.add('is-in'); });
    });
  });

  /* ---- FAQ accordion: one at a time. Scoped per list, so two FAQ
          groups on one page do not close each other. ---- */
  $$('.faq__list').forEach(function(list){
    var ds=$$('details',list);
    ds.forEach(function(d){
      d.addEventListener('toggle',function(){
        if(d.open) ds.forEach(function(o){ if(o!==d) o.open=false; });
      });
    });
  });

  /* ---- offer popups (/special/) ----
     Stands in for the native Breakdance Popup the real button opens. On the
     build the popup is a separate post resolved BY TITLE at write time
     ("Offer 1", "Offer 2", ...), which is why build order is load-bearing
     there and why the mapping here is by index too. */
  function closeModals(){ $$('.modal').forEach(function(m){ m.classList.remove('on'); }); }
  $$('[data-popup]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var m = document.getElementById('popup-' + btn.dataset.popup);
      if(!m) return;
      closeModals();
      m.classList.add('on');
      var first = m.querySelector('input,textarea,button');
      if(first) first.focus();
    });
  });
  $$('.modal').forEach(function(m){
    m.addEventListener('click', function(e){
      if(e.target === m || e.target.classList.contains('modal__veil') || e.target.closest('.modal__x')) closeModals();
    });
  });
  addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModals(); });

  /* ---- in-page contents rail (internal long-form pages) ----
     Highlights the section currently under the top third of the window. */
  var toc = $('.toc');
  if (toc) {
    var tlinks = $$('a', toc);
    var targets = tlinks.map(function(a){ return $(a.getAttribute('href')); }).filter(Boolean);
    if (targets.length) {
      var tspy = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(!e.isIntersecting) return;
          tlinks.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+e.target.id); });
        });
      },{threshold:0, rootMargin:'-18% 0px -70% 0px'});
      targets.forEach(function(t){ tspy.observe(t); });
    }
  }

  /* ---- nav active state (homepage anchor nav) ---- */
  var links=$$('.nav__links a[href^="#"]');
  if (links.length) {
    var secs=links.map(function(a){ return $(a.getAttribute('href')); }).filter(Boolean);
    if (secs.length) {
      var spy=new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting) links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+e.target.id); });
        });
      },{threshold:0.1, rootMargin:'-28% 0px -55% 0px'});
      secs.forEach(function(s){ spy.observe(s); });
    }
  }
})();
