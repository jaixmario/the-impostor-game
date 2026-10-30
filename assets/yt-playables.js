/**
 * YouTube Playables SDK Integration & Compliance Bridge
 * Specification: https://developers.google.com/youtube/gaming/playables/reference/sdk
 */
(function() {
  'use strict';

  const yt = globalThis.ytgame;
  const isPlayables = Boolean(yt && yt.IN_PLAYABLES_ENV);

  console.log('[YouTube Playables] Bridge active. IN_PLAYABLES_ENV:', isPlayables);

  const YTPlayables = {
    isPlayables: isPlayables,
    audioEnabled: true,
    isPaused: false,
    _firstFrameSent: false,
    _gameReadySent: false,

    /**
     * Notify YouTube that the first frame has rendered.
     * MUST be called before gameReady().
     */
    firstFrameReady() {
      if (this._firstFrameSent) return;
      this._firstFrameSent = true;
      if (isPlayables && yt.game && typeof yt.game.firstFrameReady === 'function') {
        try {
          yt.game.firstFrameReady();
          console.log('[YouTube Playables] firstFrameReady() triggered');
        } catch (err) {
          console.warn('[YouTube Playables] firstFrameReady error:', err);
        }
      }
    },

    /**
     * Notify YouTube that initial loading is complete and game is interactive.
     * YouTube will dismiss the loading spinner/overlay.
     */
    gameReady() {
      if (this._gameReadySent) return;
      this._gameReadySent = true;
      if (isPlayables && yt.game && typeof yt.game.gameReady === 'function') {
        try {
          yt.game.gameReady();
          console.log('[YouTube Playables] gameReady() triggered');
        } catch (err) {
          console.warn('[YouTube Playables] gameReady error:', err);
        }
      }
    },

    /**
     * Send score to YouTube on game completion.
     * @param {number} scoreValue - Integer score
     */
    sendScore(scoreValue) {
      const score = Math.max(0, Math.round(Number(scoreValue) || 100));
      if (isPlayables && yt.engagement && typeof yt.engagement.sendScore === 'function') {
        try {
          yt.engagement.sendScore({ value: score });
          console.log('[YouTube Playables] sendScore sent:', score);
        } catch (err) {
          console.warn('[YouTube Playables] sendScore error:', err);
        }
      }
    },

    /**
     * Load cloud-saved game data string.
     * @returns {Promise<string|null>}
     */
    async loadData() {
      if (isPlayables && yt.game && typeof yt.game.loadData === 'function') {
        try {
          const data = await yt.game.loadData();
          console.log('[YouTube Playables] Cloud data loaded');
          return data;
        } catch (err) {
          console.warn('[YouTube Playables] loadData error:', err);
        }
      }
      return localStorage.getItem('impostor_game_save');
    },

    /**
     * Save game progress or custom words to YouTube cloud storage.
     * @param {string|object} data - Data under 3MB
     */
    async saveData(data) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      if (isPlayables && yt.game && typeof yt.game.saveData === 'function') {
        try {
          await yt.game.saveData(dataString);
          console.log('[YouTube Playables] Cloud data saved');
          return;
        } catch (err) {
          console.warn('[YouTube Playables] saveData error:', err);
        }
      }
      try {
        localStorage.setItem('impostor_game_save', dataString);
      } catch (e) {}
    },

    /**
     * Initialize platform system listeners (Audio, Pause, Resume)
     */
    initSystem() {
      if (isPlayables && yt.system) {
        if (typeof yt.system.isAudioEnabled === 'function') {
          try {
            this.audioEnabled = yt.system.isAudioEnabled();
          } catch (e) {}
        }

        if (typeof yt.system.onAudioEnabledChange === 'function') {
          yt.system.onAudioEnabledChange((enabled) => {
            console.log('[YouTube Playables] Audio enabled:', enabled);
            this.audioEnabled = enabled;
            window.dispatchEvent(new CustomEvent('yt-audio-change', { detail: { enabled } }));
          });
        }

        if (typeof yt.system.onPause === 'function') {
          yt.system.onPause(() => {
            console.log('[YouTube Playables] onPause received');
            this.isPaused = true;
            window.dispatchEvent(new Event('yt-pause'));
          });
        }

        if (typeof yt.system.onResume === 'function') {
          yt.system.onResume(() => {
            console.log('[YouTube Playables] onResume received');
            this.isPaused = false;
            window.dispatchEvent(new Event('yt-resume'));
          });
        }
      }
    }
  };

  // Expose to window for game scripts
  window.YTPlayables = YTPlayables;

  // Initialize system handlers
  YTPlayables.initSystem();

  const onReady = () => {
    // 1. Send firstFrameReady on initial paint
    requestAnimationFrame(() => {
      YTPlayables.firstFrameReady();
    });

    // 2. Helper to hide prohibited in-game exit button on Setup screen
    const hideExitButton = () => {
      document.querySelectorAll('span.material-symbols-outlined').forEach(span => {
        if (span.textContent.trim() === 'close') {
          const btn = span.closest('button');
          if (btn) {
            btn.style.visibility = 'hidden';
            btn.style.pointerEvents = 'none';
          }
        }
      });
    };

    // 3. Send gameReady once interactive elements mount
    const pollInteractive = () => {
      const app = document.getElementById('app');
      if (app && app.children.length > 0) {
        YTPlayables.gameReady();
        hideExitButton();
      } else {
        setTimeout(pollInteractive, 50);
      }
    };
    pollInteractive();

    // 4. DOM observer for dynamic route changes & score submission
    let scoreSentForGame = false;
    const domObserver = new MutationObserver(() => {
      hideExitButton();

      const bodyText = document.body.innerText;
      if (bodyText.includes('won!') && !scoreSentForGame) {
        scoreSentForGame = true;
        YTPlayables.sendScore(100);
      } else if (!bodyText.includes('won!')) {
        scoreSentForGame = false;
      }
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
