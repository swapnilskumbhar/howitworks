import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildInternet } from './model.js';

// Every step loops while active: `phase` sweeps 0->1 once per lap and every
// packet stream's speed multiplier is a whole number, so a dot always returns
// to an identical position at the wrap — seamless no matter how fast a segment
// looks. Radio-wave rings and the out-and-back handshake / DNS chains reset
// each lap too. Some steps drive an extra scalar (screen paint, padlock close).
function run({ duration, extra }) {
  return ({ tl, handles }) => {
    const s = { t: 0 };
    tl.add(s, {
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () => {
        handles.set({ phase: s.t });
        if (extra) extra(s.t, handles);
      },
    });
  };
}

// screen paint pulse — page fills in then clears over one lap (seamless)
const paintPulse = (t, h) => h.set({ screen: 1 - Math.abs(1 - 2 * t) });

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildInternet({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: '1 · The whole journey',
      body: 'Tapping a web address looks instant, but your request makes a long physical trip. It leaves your phone as a radio wave to the nearest cell tower, is carried by fibre to your operator\'s core network and out onto the public internet, then hops router to router across the world — often under the ocean through submarine cables — to a data centre, which sends the page all the way back. The whole round trip usually takes only a few hundred milliseconds. A note on scale: this scene is a schematic, not to scale. In reality your phone is about 15 cm tall, a cell tower 15–60 m, and a data centre the size of several football fields — and the horizontal distances are enormous: the tower is up to a few kilometres away, and the data centre answering you may be hundreds or thousands of kilometres off, often across an ocean via cables that run 6,000–13,000 km end to end. We\'ve compressed those distances and enlarged the phone so every stage stays readable.',
      hint: 'Drag to orbit. Blue is your request; warm is the reply.',
      camera: { position: [-1.0, 5.2, 17.5], target: [-1.0, 1.2, 0] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 1, respAmt: 1, dnsAmt: 0, hsAmt: 0, waves: 1, reveal: 0, screen: 0.5, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('overview', true);
      },
      timeline: run({ duration: 9000 }),
    },
    {
      id: 'tap',
      heading: '2 · You tap the URL',
      body: 'It starts on the glass in your hand. You type or tap a web address — say example.com — into the browser\'s address bar and hit go. To your phone that name means nothing yet: computers find each other by numeric IP address, not by name. So before anything can be sent, the browser has to discover which machine on the internet "example.com" actually refers to.',
      camera: { position: [-8.0, 1.4, 2.4], target: [-8.2, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0, respAmt: 0, dnsAmt: 0, hsAmt: 0, waves: 0, reveal: 0, screen: 0, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('tap', true);
      },
      timeline: run({ duration: 5000 }),
    },
    {
      id: 'dns',
      heading: '3 · Finding the address (DNS)',
      body: 'The phone asks a DNS resolver — usually your ISP\'s, inside the mobile core — to turn the name into an IP address. If nobody has looked it up recently, the resolver walks the naming hierarchy: a root server points it to the server for ".com", which points it to the domain\'s own authoritative nameserver, which finally returns the numeric address. The answer is cached at every level so the next lookup is near-instant.',
      hint: 'Mint packets climb the hierarchy and bring the IP back.',
      camera: { position: [-1.4, 3.4, 5.6], target: [-1.0, 2.4, -0.4] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0, respAmt: 0, dnsAmt: 1, hsAmt: 0, waves: 0, reveal: 0, screen: 0, innerAmt: 0, lock: 0, dnsShow: 1 });
        handles.setLabels('dns', true);
      },
      timeline: run({ duration: 5200 }),
    },
    {
      id: 'uplink',
      heading: '4 · Onto the air, up to the tower',
      body: 'Now the phone can send. Its modem wraps the request into IP packets, encrypts them, and error-codes them; the RF chip and antenna modulate those bits onto a radio carrier and radiate them outward. The wave races to the nearest cell tower — the base station, an eNodeB on 4G or a gNB on 5G — exactly the same air interface a phone call uses, but now it\'s carrying data, not voice.',
      camera: { position: [-6.4, 2.1, 3.4], target: [-5.6, 1.6, 0] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 1, respAmt: 0, dnsAmt: 0, hsAmt: 0, waves: 1, reveal: 0, screen: 0, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('uplink', true);
      },
      timeline: run({ duration: 4600 }),
    },
    {
      id: 'core',
      heading: '5 · Through the core, onto the internet',
      body: 'From the tower, buried fibre backhaul carries your packets to the operator\'s mobile core network — the packet core (EPC on 4G, 5GC on 5G). Its internet gateway is the actual door onto the public internet: it checks your session, then hands the packets off to the global network of interconnected routers. Your request is no longer "on the phone network" — it\'s out on the open internet.',
      camera: { position: [-2.9, 1.9, 3.6], target: [-2.9, 0.9, 0.1] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 1, respAmt: 0.3, dnsAmt: 0, hsAmt: 0, waves: 0.3, reveal: 0, screen: 0.1, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('core', true);
      },
      timeline: run({ duration: 4600 }),
    },
    {
      id: 'routing',
      heading: '6 · Routed across the world',
      body: 'No single wire connects you to the site. Instead the packet hops from router to router: each one reads the destination IP, consults tables that BGP (the Border Gateway Protocol) keeps updated between networks, and forwards it one hop closer. Long-haul legs travel as pulses of light through fibre-optic cable at about two-thirds the speed of light — roughly 200,000 km per second — including submarine cables on the ocean floor, which carry almost all traffic between continents. The scale here is vast: this little ocean stands in for real crossings like the ~6,600 km transatlantic and ~11,000 km transpacific cables, and a single request can travel well over 10,000 km each way — yet even a round trip to the far side of the planet adds only about 200 milliseconds.',
      hint: 'Watch the light dive under the sea and climb the far shore.',
      camera: { position: [1.3, 2.4, 6.2], target: [1.3, 0.2, 0.3] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 1, respAmt: 0.3, dnsAmt: 0, hsAmt: 0, waves: 0, reveal: 0, screen: 0.1, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('routing', true);
      },
      timeline: run({ duration: 5200 }),
    },
    {
      id: 'handshake',
      heading: '7 · Handshake and encryption',
      body: 'Before any web data flows, the two ends agree how to talk. A TCP three-way handshake — SYN, then SYN-ACK back, then ACK — opens a reliable connection, and a TLS handshake then negotiates secret keys so everything is encrypted: that\'s the padlock in the address bar. Crucially, the far end is usually not the origin server but a nearby CDN edge node — a cached copy of the site kept close to you to shorten every round trip.',
      hint: 'Packets shuttle out and back — each lap is one round trip.',
      camera: { position: [5.6, 2.6, 4.0], target: [5.6, 1.7, 0.1] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0.2, respAmt: 0.2, dnsAmt: 0, hsAmt: 1, waves: 0, reveal: 0, screen: 0.1, innerAmt: 0, lock: 1, dnsShow: 0 });
        handles.setLabels('handshake', true);
      },
      timeline: run({ duration: 5000 }),
    },
    {
      id: 'server',
      heading: '8 · The data centre answers',
      body: 'Inside the data centre, a web server receives your HTTP request. If the edge already has the page cached it replies immediately; otherwise an application runs your request — often querying a database — and assembles the response: the HTML skeleton of the page plus its CSS styles, JavaScript, images and fonts. All of that is packaged back up into packets, addressed to your phone, and pushed back out onto the network.',
      camera: { position: [5.8, 2.2, 4.2], target: [5.8, 1.4, 0.2] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0.2, respAmt: 1, dnsAmt: 0, hsAmt: 0, waves: 0, reveal: 0, screen: 0.1, innerAmt: 0, lock: 0.6, dnsShow: 0 });
        handles.setLabels('server', true);
      },
      timeline: run({ duration: 4800 }),
    },
    {
      id: 'back',
      heading: '9 · The reply races back',
      body: 'The response now retraces the entire journey in reverse: out of the data centre, back through the routers and undersea fibre, into your operator\'s core, out to the serving cell tower, and down as a radio wave to your phone. It doesn\'t arrive all at once — the page streams in as a series of packets, and the browser starts working with them the moment the first ones land.',
      camera: { position: [-2.0, 4.4, 13.0], target: [-2.0, 1.0, 0.2] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0.25, respAmt: 1, dnsAmt: 0, hsAmt: 0, waves: 1, reveal: 0, screen: 0.35, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('back', true);
      },
      timeline: run({ duration: 5200 }),
    },
    {
      id: 'render',
      heading: '10 · The browser paints the page',
      body: 'The last stage happens on the phone itself. The browser parses the HTML into a DOM tree, applies the CSS to work out how everything should look, runs the JavaScript, and lays the whole thing out — then paints the coloured pixels onto the screen. Text, images and buttons appear, and the page you asked for is finally there. From tap to render, it all happened in a fraction of a second.',
      hint: 'The page assembles on the glass, block by block.',
      camera: { position: [-8.0, 1.5, 2.2], target: [-8.2, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 0, respAmt: 0.2, dnsAmt: 0, hsAmt: 0, waves: 0, reveal: 0, screen: 0, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels('render', true);
      },
      timeline: run({ duration: 5200, extra: paintPulse }),
    },
    {
      id: 'run',
      heading: '11 · All in half a second',
      body: 'Address lookup, radio uplink, core network, dozens of router hops, an ocean crossing, a secure handshake, a data centre building the page, and the whole thing streaming back to be painted on your screen — every stage happened in the time it took your finger to leave the glass. Billions of these round trips are crossing the planet at this very moment, over the same shared web of towers, fibre and routers.',
      hint: 'Drag to orbit while a request runs end to end.',
      camera: { position: [-1.0, 5.0, 17.0], target: [-1.0, 1.2, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.set({ reqAmt: 1, respAmt: 1, dnsAmt: 0, hsAmt: 0, waves: 1, reveal: 0, screen: 1, innerAmt: 0, lock: 0, dnsShow: 0 });
        handles.setLabels(null, false);
      },
      timeline: run({ duration: 4200 }),
    },
  ],
});
