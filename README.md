# Bibliosage

The Bibliosage landing page, built with Next.js.

## How to see the page

1. Open PowerShell.
2. Type `cd C:\bibliosage` and press Enter.
3. Type `npm run dev` and press Enter.
4. Open Chrome and go to **http://localhost:3000**

To stop the server, click the PowerShell window and press `Ctrl + C`.

## Where things live

| File | What it is |
| --- | --- |
| `app/layout.js` | The page frame: fonts, navigation bar, footer |
| `app/page.js` | All the page copy, section by section |
| `app/page.module.css` | The look of every section |
| `app/globals.css` | Colours, type sizes, buttons, paper grain, scroll-fade |
| `app/signup/page.js` | Placeholder page that the buttons link to |
| `components/Navbar.js` | Top bar and mobile menu |
| `components/Footer.js` | Bottom of the page |
| `components/ScrollObserver.js` | Fades sections in as you scroll |
| `components/Illustrations.js` | Every hand-drawn SVG: the sprout mascot, icons, leaves, sparkles |
| `components/HeroSearch.js` | The search-style box in the hero, with a placeholder that types and cycles |
| `components/SessionWalkthrough.js` | The looping walkthrough in "See how a session feels." |
| `components/CardDeck.js` | The four cards of The Bibliosage Loop: one card shows at a time, the rest sit behind it, and it slides on its own or when someone taps a dot, clicks it or swipes it |
| `components/LoopShowcase.js` | The Bibliosage Loop's background photographs, which crossfade to match the card on top |
| `components/BringCards.js` | The "Bring anything" cards: one card at a time, turning like a page, with dots, taps and swipes |
| `components/LoopScenes.js` | The four little animated scenes inside the Bibliosage Loop cards |
| `components/Faq.js` | The questions list that opens and closes smoothly |
| `components/useReducedMotion.js` | Remembers if the visitor asked for less movement |

## The sprout mascot

`Sprout` takes a `leaves` prop:

- `<Sprout leaves={1} />` — a young sprout
- `<Sprout leaves={2} />` — grown a new leaf
- `<Sprout leaves={3} />` — fully grown

It appears beside the session walkthrough, in the closing line of "Sound
familiar?" and in the final call to action.

## Notes

- Do not put this project inside OneDrive. OneDrive locks the thousands of
  small files in `node_modules` and `npm install` fails there.
- Buttons ("Start Learning", "Sign up", "Log in") all point to `/signup`
  for now. Sign-up, login, database and payments are not built yet.
- The session walkthrough is a picture of a session, not a working tutor.
  `components/SessionWalkthrough.js` is the only file that changes when the
  real session screen is built.
- The cards are driven by the data arrays `LOOP` and `BRING` in `app/page.js`.
  A card's `icon` and `scene` are plain words there (`"learn"`, `"prove"`)
  because a component cannot be handed from a server page to a client one;
  they are looked up inside the card components.
- Every section fills the screen (`min-height: 100svh`) with its content
  centred. `svh` rather than a fixed height, so the mobile browser bar cannot
  cut a section short. `--nav-h` in `globals.css` is the navigation bar's
  height: the hero leaves room for it and `scroll-padding-top` makes anchor
  links stop just below it.
- The four background photographs in The Bibliosage Loop are free-to-use
  Unsplash photos. Who took each one is written down in `CREDITS.md` — keep
  that list up to date if you swap them.
- If the visitor has reduced motion on, nothing moves: the cards are laid out
  as plain grids, the dots are hidden, and the first background photo simply
  stays showing.
- Anything written in a `*.module.css` file gets an invented name, so it can
  never match a plain class from `globals.css` (like `.btn` or `.is-in`).
  Reach for those with `:global(.btn)`, or keep the rule in `globals.css` and
  hook it to a `data-` attribute.