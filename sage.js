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


  /* ---- header: keep the fixed nav below the utility bar ----
     The bar wraps to two lines on some widths; the nav's top offset follows
     its real height (CSS var --util-h, used by le-nav.css). */
  var utilBar = $('.util');
  function setUtilH(){
    document.documentElement.style.setProperty('--util-h', (utilBar ? utilBar.offsetHeight : 0) + 'px');
  }
  setUtilH();
  addEventListener('resize', setUtilH, {passive:true});
  addEventListener('load', setUtilH);

  /* ---- desktop dropdowns ("Who We Are") ----
     Hover and keyboard focus open them in CSS; the chevron button toggles
     them for touch screens wide enough to show the desktop nav. */
  var dds = $$('.nav__dd');
  function closeDds(except){
    dds.forEach(function(d){
      if (d === except) return;
      d.classList.remove('is-open');
      var b = $('.nav__dd-btn', d); if (b) b.setAttribute('aria-expanded','false');
    });
  }
  dds.forEach(function(dd){
    var b = $('.nav__dd-btn', dd);
    if (!b) return;
    b.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var open = !dd.classList.contains('is-open');
      closeDds(dd);
      dd.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function(e){ if (!e.target.closest('.nav__dd')) closeDds(); });
  addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDds(); });

  /* ---- mobile nav panel ----
     HTML has .nav__burger but no handler historically; this builds a slide-down
     panel from the same .nav__links (+ Schedule CTA) so every page stays in sync. */
  var burger = $('.nav__burger');
  if (burger && nav) {
    var panel = document.createElement('div');
    panel.className = 'nav__panel';
    panel.id = 'nav-panel';
    panel.setAttribute('hidden', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Site menu');

    var panelInner = document.createElement('div');
    panelInner.className = 'nav__panel-inner';
    var linkSrc = $('.nav__links', nav);
    if (linkSrc) {
      /* Top-level links clone as they are. A dropdown (.nav__dd) becomes its
         parent link followed by EVERY one of its sub-links, indented and in
         the same order as the desktop dropdown (Who We Are > Meet the Team,
         Payment Options), so phone and desktop menus match. The parent only
         gets a text-colour cue when one of its children is the current page;
         the child carries the full highlight. */
      [].slice.call(linkSrc.children).forEach(function(el){
        if (el.tagName === 'A') {
          panelInner.appendChild(el.cloneNode(true));
        } else if (el.classList.contains('nav__dd')) {
          var top = $('.nav__dd-top', el);
          if (top) {
            var tc = top.cloneNode(true);
            tc.className = 'nav__panel-parent';
            if (top.classList.contains('on')) tc.classList.add('on');
            tc.removeAttribute('aria-current');
            panelInner.appendChild(tc);
          }
          $$('.nav__dd-menu a', el).forEach(function(a){
            var sc = a.cloneNode(true);
            sc.classList.add('nav__panel-sub');
            panelInner.appendChild(sc);
          });
        }
      });
    }
    var cta = $('.nav__cta .btn', nav);
    if (cta) {
      var ctaClone = cta.cloneNode(true);
      ctaClone.classList.add('nav__panel-cta');
      panelInner.appendChild(ctaClone);
    }
    panel.appendChild(panelInner);
    document.body.appendChild(panel);

    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'nav-panel');

    var burgerOpenSvg = burger.innerHTML;
    var burgerCloseSvg = '<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    function setOpen(open){
      burger.innerHTML = open ? burgerCloseSvg : burgerOpenSvg;
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
      if (open) {
        document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
        panel.removeAttribute('hidden');
        panel.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
      } else {
        panel.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        // hide after transition
        window.setTimeout(function(){
          if (!panel.classList.contains('is-open')) panel.setAttribute('hidden', '');
        }, 280);
      }
    }
    function isOpen(){ return panel.classList.contains('is-open'); }

    burger.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      setOpen(!isOpen());
    });
    panel.addEventListener('click', function(e){
      if (e.target === panel) setOpen(false);
    });
    $$('a', panel).forEach(function(a){
      a.addEventListener('click', function(){ setOpen(false); });
    });
    addEventListener('keydown', function(e){
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });
  }

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
