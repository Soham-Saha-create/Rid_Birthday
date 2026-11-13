# Rid's birthday site

A multi-page site: candle entrance, a map of stars, and seven rooms. Plain HTML, CSS and JavaScript. No build step, no installs.

## Try it

Double-click `index.html`. The fonts need internet; everything else works offline.

Progress (which stars are lit) is saved in the browser. To test without being locked out of rooms, add this to the end of any page address:

- `?dev=1` turns on dev mode. Every room opens, and a bar at the bottom says whether any `TODO` is left in the text.
- `?dev=0` turns it off.
- `?reset=1` clears saved progress so you can walk through it fresh.

## What to edit

**Only `js/content.js`.** All the words live there: candle lines, map labels, songs, quiz questions, the seven letters, photo captions, your words page, the final message, the secret message. Anything marked `TODO` is a placeholder.

Other files, if you ever want them:

- `css/style.css`: colours and fonts are at the very top
- `js/rooms.js`: how each room behaves
- `js/entrance.js`: the candle
- `js/hub.js`: the map

## Photos

Put them in the `photos` folder named `001.jpg`, `002.jpg` and so on, up to the `count` in `content.js` (100 by default). Captions go in `content.js` by number.

Resize them first. Around 1200 pixels on the long side and under 300 KB each keeps the page quick on a phone. 100 full-size camera photos will make it crawl.

## The flow

1. `index.html`: candle. Hold to blow, the flame grows, the last breath puts it out.
2. `hub.html`: the map. Each star opens after the one before it is done.
3. `music.html`: open every song.
4. `quest.html`: answer the trivia, each right answer opens a hidden message.
5. `letters.html`: open all seven letters.
6. `gallery.html`: scroll to the last photo.
7. `words.html`: scroll to the end.
8. `final.html`: the last star. A faint star in the top corner opens `secret.html`.

To keep the last star shut until her birthday, set `unlockAt` in the `final` section of `content.js`, for example `"2026-12-16T00:00:00+05:30"`. She will see a countdown until then.

## Putting it online (GitHub Pages)

1. Make a new repository and upload everything in this folder.
2. In the repository settings, turn on Pages and serve from the main branch.
3. Send her the link when you are ready.

Every page has a "do not index" tag so search engines skip it, but anyone with the link can open it. Only upload photos she is happy to have there.

## Before you send it

- Open the site with `?dev=1` and check the bar says there is no `TODO` left.
- Do one full run on your phone, starting with `?reset=1`.
- Test the hidden star on the last page.
