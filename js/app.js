(() => {
  'use strict';
  const STEPS = [
    {t:'Visitors', s:'Customers open the shop', p:'People on phones and laptops open Ravi’s shopping website through the internet.', n:'Clients / internet traffic', w:'Three kinds of devices appear on the left: these are Ravi’s customers.'},
    {t:'DNS', s:'Name becomes an address', p:'Nobody remembers numbers, so Route 53 works like a phone book. It turns the shop’s name into the address of the receptionist.', n:'Amazon Route 53 (alias record → ALB DNS name)', w:'The magnifier asks “where is the shop?” and the pin brings back the answer.'},
    {t:'Application Load Balancer', s:'The receptionist arrives', p:'Every visitor now meets a friendly receptionist at the front door. The receptionist accepts the request and decides who helps next.', n:'Application Load Balancer (Layer 7, HTTP/HTTPS)', w:'Envelopes (web requests) travel along the blue dashed line into the teal box.'},
    {t:'Listener', s:'Ports and rules', p:'The receptionist listens at two doors: 80 for plain web and 443 for secure web. Simple rules say what to do with each visitor.', n:'ALB listener on port 80 (HTTP) and 443 (HTTPS) with listener rules', w:'Gold chips show the two ports. The rule card lists the instructions, checked in order.'},
    {t:'Target Group', s:'The team of servers', p:'The receptionist keeps a list of helpers. Here the team has two web servers, each working in its own building.', n:'Target group with EC2 instances registered as targets', w:'A purple box holds two EC2 servers, one in Availability Zone A and one in B.'},
    {t:'Traffic Distribution', s:'Sharing the visitors', p:'Visitors are shared out so no one server gets tired. Each server sends a package (the web page) back to the customer.', n:'Request routing (round robin) across healthy targets in multiple Availability Zones', w:'Carts go to each green server and packages return. Two buildings means the shop survives if one has trouble.'},
    {t:'Health Checks', s:'Spotting a sick server', p:'The receptionist keeps checking each server. When one stops answering, it turns red and no new customers are sent there.', n:'Target group health checks (healthy / unhealthy threshold)', w:'web-2 turns red with ❌. Its carts disappear and web-1 keeps serving. Try the failure button yourself.'},
    {t:'Scaling', s:'More visitors, more servers', p:'Shopping rush! A new server is started automatically. It only gets customers after it passes its health checks.', n:'EC2 Auto Scaling Group registering a new target', w:'web-3 appears with ⏳, then turns green with ✅ and joins the traffic.'},
    {t:'Complete Architecture', s:'The whole journey', p:'Visitor → Route 53 → receptionist → listener → target group → healthy servers. Security groups act as guards, HTTPS keeps data private, and CloudWatch watches everything.', n:'Route 53, ALB, listener, target group, security groups, TLS termination (ACM), CloudWatch', w:'The shield rides the encrypted road, the chart watches the ALB, and dashed boxes show security groups.'}
  ];
  const SRV = [{n:1,y:255,m:5},{n:2,y:410,m:5},{n:3,y:510,m:8}];
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = $('#dia');
  let step = 1, playing = !reduce, timer = null, failed = false, ec3ok = false, hc = false, t3 = null;

  // starry sky
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $('#stars').innerHTML = Array.from({length: 70}, () =>
    `<circle class="star" cx="${(rnd()*1100).toFixed(0)}" cy="${(rnd()*620).toFixed(0)}" r="${(rnd()*1.2+.5).toFixed(1)}" fill="#cfe0ff" opacity=".55" style="animation-delay:${(rnd()*3).toFixed(1)}s"/>`).join('');

  // servers, their wires and packets
  const defs = svg.querySelector('defs'); let d = '', w = '', b = '', k = '';
  SRV.forEach(({n, y, m}) => {
    const p = `M520,310 L690,310 C720,310 720,${y} 750,${y}`;
    d += `<path id="pe${n}" d="${p}"/>`;
    w += `<path class="wire t rev" data-s="${m}" data-n="${n}" d="${p}"/>`;
    b += `<g class="rev srv" data-s="${m}" data-n="${n}"><rect class="sbox" x="750" y="${y-35}" width="140" height="70" rx="12"/>
      <text x="764" y="${y-8}" class="sn">EC2 web-${n}</text><text x="764" y="${y+12}" class="ss" id="ss${n}">Healthy</text>
      <text x="866" y="${y}" class="ic2" id="si${n}">✅</text></g>`;
    const s0 = n - 1;
    k += `<g class="rev pk" data-s="${Math.max(6, m)}" data-n="${n}">
      <text class="ico" visibility="hidden">🛒<set attributeName="visibility" to="visible" begin="${s0}s"/><animateMotion dur="3s" begin="${s0}s" repeatCount="indefinite"><mpath href="#pe${n}"/></animateMotion></text>
      <text class="ico" visibility="hidden">📦<set attributeName="visibility" to="visible" begin="${s0+1.5}s"/><animateMotion dur="3s" begin="${s0+1.5}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#pe${n}"/></animateMotion></text></g>`;
  });
  defs.insertAdjacentHTML('beforeend', d);
  $('#wires').insertAdjacentHTML('afterbegin', w);
  $('#servers').innerHTML = b;
  $('#srvpk').innerHTML = k;

  // navigation
  $('#steps').innerHTML = STEPS.map((s, i) =>
    `<li><button class="step" data-i="${i+1}"><span class="n">${i+1}</span><span><b>${s.t}</b><small>${s.s}</small></span></button></li>`).join('');
  document.querySelectorAll('.step').forEach(btn => btn.addEventListener('click', () => go(+btn.dataset.i)));

  const st = n => (n === 2 && failed) ? 'bad' : (n === 3 && !(step > 8 || ec3ok)) ? 'chk' : 'ok';
  const ICON = {ok:'✅', bad:'❌', chk:'⏳'}, TXT = {ok:'Healthy', bad:'Unhealthy', chk:'Checking…'};

  function say(m) { $('#status').textContent = m; }
  function apply() {
    document.querySelectorAll('[data-s]').forEach(el => {
      let on = step >= +el.dataset.s;
      if (on && el.classList.contains('pk') && el.dataset.n) on = st(+el.dataset.n) === 'ok';
      const was = el.classList.contains('on');
      el.classList.toggle('on', on);
      if (on && !was && !el.classList.contains('pk')) {
        el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 1600);
      }
    });
    SRV.forEach(({n}) => {
      const s = st(n), g = svg.querySelector(`.srv[data-n="${n}"]`);
      g.classList.remove('ok', 'bad', 'chk'); g.classList.add(s);
      $('#ss' + n).textContent = TXT[s]; $('#si' + n).textContent = ICON[s];
      svg.querySelectorAll(`.wire[data-n="${n}"]`).forEach(x => x.classList.toggle('bad', s === 'bad'));
    });
    document.querySelectorAll('.step').forEach(btn => {
      const i = +btn.dataset.i;
      btn.classList.toggle('done', i < step);
      i === step ? btn.setAttribute('aria-current', 'step') : btn.removeAttribute('aria-current');
    });
    const f = $('#fail');
    f.disabled = step < 6 || hc;
    f.textContent = failed ? 'Run health check & restore' : 'Simulate EC2 failure';
    f.classList.toggle('warn', !failed); f.classList.toggle('ok', failed);
    f.title = step < 6 ? 'Available from step 6, when traffic is flowing' : '';
    $('#play').disabled = playing; $('#pause').disabled = !playing;
  }

  function go(n) {
    step = n;
    clearTimeout(t3); hc = false;
    failed = n === 7;
    ec3ok = n > 8;
    if (n === 8) t3 = setTimeout(() => { ec3ok = true; say('web-3 passed its health checks and joined the target group.'); apply(); }, 3000);
    const S = STEPS[n-1];
    $('#ct').textContent = `Step ${n}: ${S.t}`;
    $('#cp').textContent = S.p; $('#cn').textContent = S.n; $('#cw').textContent = S.w;
    say(n === 7 ? 'web-2 failed its health check. New requests go to web-1 only.' :
        n === 8 ? 'Starting web-3… waiting for health checks.' : '');
    apply();
    restartTimer();
  }
  function restartTimer() {
    clearInterval(timer);
    if (playing) timer = setInterval(() => {
      if (step < 9) go(step + 1); else { playing = false; clearInterval(timer); apply(); }
    }, 5000);
  }
  const setAnim = on => on ? svg.unpauseAnimations() : svg.pauseAnimations();

  $('#play').onclick = () => { playing = true; setAnim(true); if (step === 9) go(1); else restartTimer(); apply(); };
  $('#pause').onclick = () => { playing = false; clearInterval(timer); setAnim(false); apply(); };
  $('#reset').onclick = () => { playing = !reduce; setAnim(true); go(1); };
  $('#fail').onclick = () => {
    if (hc) return;
    if (!failed) {
      failed = true; say('web-2 stopped answering. The ALB marks it unhealthy and sends new requests to the healthy servers.');
      apply();
    } else {
      hc = true; apply(); say('Health check 1 of 2 …');
      setTimeout(() => say('Health check 2 of 2 …'), 1100);
      setTimeout(() => { failed = false; hc = false; say('Health check passed. web-2 is healthy and receives traffic again.'); apply(); }, 2200);
    }
  };
  $('#theme').onclick = () => {
    const r = document.documentElement, t = r.dataset.theme === 'dark' ? 'light' : 'dark';
    r.dataset.theme = t; try { localStorage.setItem('alb-theme', t); } catch (e) {}
  };
  try { const t = localStorage.getItem('alb-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

  if (reduce) setAnim(false);
  go(1);
})();
