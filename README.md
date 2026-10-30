# The Impostor - Word Deduction Game

A minimal, fast-paced pass-and-play social deduction party game. Built with Vue 3 and Tailwind CSS, fully certified for **YouTube Playables** and the open web.

## 🎮 How to Play

1. **Pass & Play:** Gather 3 or more players around a single device.
2. **Roles & Words:**
   - **Civilians:** Receive the secret word (e.g. *Cathedral*).
   - **Undercovers:** Receive a slightly different but related word (e.g. *Church*).
   - **The Impostor:** Receives **no word** and must bluff to blend in!
3. **Give Clues:** Go in a circle saying one-word clues about your secret word.
4. **Discuss & Vote:** Eliminate who sounds most suspicious!
5. **Win Conditions:**
   - **Civilians Win:** If all Impostors & Undercovers are eliminated.
   - **The Impostor Wins:** If they blend in until only 2 players remain or correctly guess the secret word!

## 🚀 Features

- **YouTube Playables SDK Integration:** Built-in hooks for irstFrameReady(), gameReady(), saveData(), loadData(), onPause(), onResume(), and sendScore().
- **100% Self-Contained:** Zero external CDN calls or tracker scripts. All vector fonts and assets are bundled locally.
- **370+ Curated Word Pairs:** Extensive offline database with 500+ unique secret words.
- **Custom Words Manager:** Offline storage to add your own word packs.
- **Responsive & Mobile-First:** Runs fullscreen on mobile and cleanly centered on desktop.

## 🌐 Live Web Game

Play online at: [https://jaixmario.github.io/the-impostor-game/](https://jaixmario.github.io/the-impostor-game/)
