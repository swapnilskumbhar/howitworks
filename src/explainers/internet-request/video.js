// steps: 0 whole journey · 1 tap URL · 2 DNS · 3 up to tower · 4 into the core
//        5 routed worldwide · 6 handshake · 7 data centre answers · 8 reply back
//        9 browser paints · 10 half a second
export default {
  hook: 'You tap a link. Here’s the\nhalf-second that follows.',

  short: {
    dolly: 2.6,
    shots: [
      { step: 0, seconds: 4, dolly: 2.8, caption: 'Phone to data centre and back',
        narration: 'You tap a link. In half a second, a signal circles the planet and back. Here’s how.' },
      { step: 2, seconds: 5, caption: 'DNS: look up the site’s address',
        narration: 'First your phone asks a directory for the site’s real address — a number, not a name.' },
      { step: 3, seconds: 5, caption: 'Up to the cell tower as radio',
        narration: 'Your request leaves as a radio wave, up to the nearest cell tower.' },
      { step: 5, seconds: 6, caption: 'Routed across the world in hops',
        narration: 'From there it hops router to router, often through undersea cables, toward a distant data centre.' },
      { step: 7, seconds: 5, caption: 'The data centre answers',
        narration: 'A server there receives your request and fires the page back the way it came.' },
      { step: 9, seconds: 5, caption: 'Your browser paints the page',
        narration: 'Your phone reassembles the pieces and paints the page. All in the blink of an eye.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'You tap a link and a page appears almost instantly. But in that half-second, an astonishing amount happens — a signal races across the world and back, through a dozen machines. Let’s slow it down.' },
      { step: 1, seconds: 8, narration: 'It starts the moment you tap. Your phone reads the web address you asked for, but a name like this means nothing to the network. It first has to be turned into a numerical address.' },
      { step: 2, seconds: 9, narration: 'So your phone asks the internet’s directory service, called DNS. It’s like a phone book: you give it the site’s name, and it hands back the numeric address of the computer that actually holds the page.' },
      { step: 3, seconds: 8, narration: 'Now the request leaves your phone. It’s encoded onto a radio wave and beamed up to the nearest cell tower, the first real hop on its long journey.' },
      { step: 4, seconds: 8, narration: 'The tower passes it into the carrier’s core network, a web of high-capacity links, and from there onto the public internet — the global mesh that connects nearly every computer on Earth.' },
      { step: 5, seconds: 9, narration: 'Now it’s routed. No single wire runs to the destination; instead your request hops from router to router, each one reading the address and passing it along, often diving through fiber-optic cables under the ocean.' },
      { step: 6, seconds: 9, narration: 'When it reaches the server, the two sides shake hands and agree on encryption. From here on, everything is scrambled, so anyone snooping in between sees only gibberish. This is the padlock in your address bar.' },
      { step: 7, seconds: 8, narration: 'Finally the destination data centre gets your request. A server looks up what you asked for, assembles the page, and hands it back — ready to make the entire trip in reverse.' },
      { step: 8, seconds: 8, narration: 'The reply races back the same way: through the ocean cables, across the routers, into the core network, and down from the cell tower as radio, straight to your phone.' },
      { step: 9, seconds: 8, narration: 'Your phone catches the stream of data, reassembles the pieces in the right order, and the browser paints it into text, images, and buttons — the page you were waiting for.' },
      { step: 10, seconds: 8, narration: 'Look up, DNS, tower, core, routers, oceans, handshake, server, and all the way back — dozens of steps and thousands of miles, finished before you even lifted your finger.' },
    ],
  },
};
