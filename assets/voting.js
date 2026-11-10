// ==========================================================================
// The Impostor Game - Theme-Matched Minimalist Voting & Setup System
// Features:
// 1. Exact matching UI for Player Name inputs (Mu: 12px gap, 2px #9ca3af border, 4px radius, 20px font)
// 2. Voting Mode selection (Hidden Vote vs Open Tell) on setup
// 3. Mark as tick (✓) as soon as word is viewed
// 4. Do NOT re-show word: Once marked as tick, word cannot be viewed again (locked against peeking)
// 5. Impostor Role Support: Mr. White / The Impostor receives NO word ("You are - The Impostor!")
// 6. Do NOT start before viewing all words: Start button stays strictly disabled until every player views their word
// 7. Zero timers — seamless, direct voting flow
// 8. Exact theme palette: #1f2937, white, #9ca3af, role colors #16a34a / #dc2626
// ==========================================================================

let memoryMode = 'hidden';
let memoryReview = true; // Default: true (checked - allows review with popup; uncheck to lock completely)

export function getSavedVotingMode() {
  try {
    if (typeof window !== 'undefined' && window.__impostorVotingMode) {
      return window.__impostorVotingMode;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('impostor_voting_mode');
      if (stored) return stored;
    }
  } catch (e) {}
  return memoryMode;
}

export function saveVotingMode(mode) {
  memoryMode = mode;
  try {
    if (typeof window !== 'undefined') {
      window.__impostorVotingMode = mode;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('impostor_voting_mode', mode);
    }
  } catch (e) {}
}

export function getSavedWordReview() {
  try {
    if (typeof window !== 'undefined' && window.__impostorWordReview !== undefined) {
      return window.__impostorWordReview;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('impostor_word_review');
      if (stored !== null) return stored === 'true';
    }
  } catch (e) {}
  return memoryReview;
}

export function saveWordReview(allowed) {
  memoryReview = allowed;
  try {
    if (typeof window !== 'undefined') {
      window.__impostorWordReview = allowed;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('impostor_word_review', allowed ? 'true' : 'false');
    }
  } catch (e) {}
}

// Hyperscript helper for Vue 3
function makeH(ho) {
  return function h(tag, attrs, children) {
    if (Array.isArray(attrs) || typeof attrs === 'string' || attrs?.__v_isVNode) {
      children = attrs;
      attrs = {};
    }
    const safeAttrs = attrs || {};
    const safeChildren = Array.isArray(children)
      ? children.filter(c => c !== null && c !== undefined && c !== false)
      : children != null && children !== false
      ? [children]
      : [];
    return ho.hyperscript(tag, safeAttrs, safeChildren);
  };
}

// ==========================================================================
// 1. SETUP PLAYER NAMES COMPONENT (Player Adding Screen)
// ==========================================================================
export function createSetupPlayerNamesComponent(ho) {
  const h = makeH(ho);

  return {
    name: 'SetupPlayerNames',
    props: ['gameConfig'],
    data() {
      const count = (this.gameConfig && this.gameConfig.totalPlayers) || 4;
      const initialPlayers = [];
      for (let i = 0; i < count; i++) {
        initialPlayers.push({ name: `Player ${i + 1}` });
      }

      return {
        players: initialPlayers,
        votingMode: getSavedVotingMode(),
        allowWordReview: getSavedWordReview()
      };
    },

    watch: {
      'gameConfig.totalPlayers'(newCount) {
        const n = newCount || 4;
        const current = [...this.players];
        if (current.length < n) {
          for (let i = current.length; i < n; i++) {
            current.push({ name: `Player ${i + 1}` });
          }
        } else if (current.length > n) {
          current.splice(n);
        }
        this.players = current;
      }
    },

    methods: {
      updateName(idx, val) {
        this.players[idx].name = val;
      },

      setVotingMode(mode) {
        this.votingMode = mode;
        saveVotingMode(mode);
      },

      toggleWordReview() {
        this.allowWordReview = !this.allowWordReview;
        saveWordReview(this.allowWordReview);
      },

      onStart() {
        saveVotingMode(this.votingMode);
        saveWordReview(this.allowWordReview);

        const el = this.$el || document.getElementById('app') || document.documentElement;
        el.dispatchEvent(
          new CustomEvent('__93.custom', {
            detail: {
              event: {
                id: 'startGame',
                data: {
                  players: this.players
                }
              }
            },
            bubbles: true
          })
        );
      }
    },

    render() {
      const self = this;

      return h('div', { class: 'voting-container' }, [
        // Content Area matching original padding (32px)
        h('div', { class: 'setup-scroll-area' }, [
          // Screen Title
          h('div', { class: 'setup-title' }, 'Players'),

          // Player Name Inputs (100% exact match to original Mu: 12px gap, 2px #9ca3af border, 4px radius, 20px font)
          h(
            'div',
            { class: 'player-inputs-list' },
            self.players.map((p, idx) => {
              return h('div', { key: idx, class: 'player-input-wrapper' }, [
                h('input', {
                  type: 'text',
                  value: p.name,
                  class: 'player-name-input',
                  onInput: e => self.updateName(idx, e.target.value)
                })
              ]);
            })
          ),

          // Voting Mode Section (Matching app theme toggleButtons ju)
          h('div', { class: 'voting-mode-section' }, [
            h('div', { class: 'voting-section-title' }, 'Voting Mode'),
            h(
              'div',
              { class: 'voting-section-subtitle' },
              'Choose how players vote during discussion:'
            ),

            // Segmented Toggle Button
            h('div', { class: 'voting-segmented-control' }, [
              h(
                'button',
                {
                  class: `voting-segmented-btn ${self.votingMode === 'hidden' ? 'active' : ''}`,
                  onClick: () => self.setVotingMode('hidden')
                },
                'Hidden Vote (Pass & Play)'
              ),
              h(
                'button',
                {
                  class: `voting-segmented-btn ${self.votingMode === 'open' ? 'active' : ''}`,
                  onClick: () => self.setVotingMode('open')
                },
                'Open Tell (Group Vote)'
              )
            ])
          ]),

          // Word Re-view Checkbox (When unchecked: words cannot be re-shown once viewed)
          h(
            'div',
            {
              class: 'word-review-row',
              onClick: () => self.toggleWordReview()
            },
            [
              h(
                'div',
                {
                  class: `word-review-checkbox ${self.allowWordReview ? 'checked' : ''}`
                },
                self.allowWordReview ? '✓' : ''
              ),
              h('div', [
                h(
                  'div',
                  { class: 'word-review-label-title' },
                  'Allow re-viewing secret word'
                ),
                h(
                  'div',
                  { class: 'word-review-label-desc' },
                  'When unchecked, words are locked and cannot be re-shown once marked with a tick'
                )
              ])
            ]
          )
        ]),

        // Bottom Start Button (Matching original Gu: 32px padding, 80px height, 8px radius, #1f2937)
        h('div', { class: 'setup-start-wrapper' }, [
          h(
            'button',
            {
              class: 'setup-start-btn',
              onClick: () => self.onStart()
            },
            'Start'
          )
        ])
      ]);
    }
  };
}

// ==========================================================================
// 2. CHECK WORDS COMPONENT (Review Screen matching Lu & user screenshot)
// ==========================================================================
export function createCheckWordsComponent(ho) {
  const h = makeH(ho);

  return {
    name: 'GameCheckWords',
    props: ['activePlayers', 'roles', 'words', 'wordsSetterName'],
    data() {
      const players = this.activePlayers || [];
      return {
        hasSeen: players.map(() => false),
        modalPlayer: null,
        confirmReviewPlayer: null,
        allowWordReview: getSavedWordReview()
      };
    },

    watch: {
      activePlayers: {
        immediate: true,
        handler(newPlayers) {
          const len = (newPlayers && newPlayers.length) || 0;
          if (this.hasSeen.length !== len) {
            this.hasSeen = new Array(len).fill(false);
          }
        }
      }
    },

    computed: {
      allSeen() {
        return this.hasSeen.length > 0 && this.hasSeen.every(Boolean);
      }
    },

    mounted() {
      this.allowWordReview = getSavedWordReview();
      // NOTE: We NEVER skip this screen automatically!
      // Players must always view their words before starting discussion.
    },

    methods: {
      onPlayerClick(idx) {
        if (this.hasSeen[idx]) {
          // If tick is unchecked on setup screen: don't show popup, don't allow review!
          if (!this.allowWordReview) {
            return;
          }

          // If allowed: Show confirmation popup BEFORE viewing word again!
          const players = this.activePlayers || [];
          const p = players[idx] || { name: `Player ${idx + 1}` };
          this.confirmReviewPlayer = {
            idx,
            name: p.name
          };
        } else {
          // First time viewing: Open word directly
          this.showWordForPlayer(idx);
        }
      },

      confirmReview() {
        if (!this.confirmReviewPlayer) return;
        const idx = this.confirmReviewPlayer.idx;
        this.confirmReviewPlayer = null;
        this.showWordForPlayer(idx);
      },

      cancelReview() {
        this.confirmReviewPlayer = null;
      },

      showWordForPlayer(idx) {
        const players = this.activePlayers || [];
        const p = players[idx] || { name: `Player ${idx + 1}` };
        const role = (this.roles && this.roles[idx]) || null;
        let word = null;
        let isImpostor = false;

        // Impostor (mrWhite) -> The Impostor gets NO word!
        if (role === 'mrWhite') {
          isImpostor = true;
          word = null;
        } else if (role === 'undercover') {
          word = this.words?.undercover || '';
        } else {
          word = this.words?.civilian || '';
        }

        // Mark as seen immediately so it ticks upon viewing
        const updated = [...this.hasSeen];
        updated[idx] = true;
        this.hasSeen = updated;

        this.modalPlayer = {
          name: p.name,
          word,
          isImpostor,
          idx
        };
      },

      closeModal() {
        this.modalPlayer = null;
      },

      goToDiscussion() {
        // Strict check — do not start before view all words
        if (!this.allSeen) return;

        const el = this.$el || document.getElementById('app') || document.documentElement;
        el.dispatchEvent(
          new CustomEvent('__93.custom', {
            detail: {
              event: {
                id: 'startDiscussion'
              }
            },
            bubbles: true
          })
        );
      }
    },

    render() {
      const self = this;
      const players = self.activePlayers || [];
      const canStart = self.allSeen;

      return h('div', { class: 'checkwords-container' }, [
        // Content Area
        h('div', { class: 'checkwords-content' }, [
          // Prompt matching original: "Each player should tap on their name to see their secret word!"
          h(
            'div',
            { class: 'checkwords-prompt' },
            'Each player should tap on their name to see their secret word!'
          ),

          // Words setter badge if applicable
          self.wordsSetterName
            ? h(
                'div',
                { class: 'checkwords-setter-badge' },
                `Words set by ${self.wordsSetterName}`
              )
            : null,

          // Players List (matching user screenshot)
          h(
            'div',
            { class: 'checkwords-list' },
            players.map((p, idx) => {
              const seen = self.hasSeen[idx];

              return h(
                'button',
                {
                  key: idx,
                  class: `checkwords-player-btn ${seen ? 'seen' : ''} ${seen && !self.allowWordReview ? 'locked' : ''}`,
                  onClick: () => self.onPlayerClick(idx)
                },
                [
                  h('div', { class: 'checkwords-player-row' }, [
                    h(
                      'span',
                      {
                        class: `checkwords-player-name ${seen ? 'seen' : ''}`
                      },
                      p.name
                    ),
                    // Checkmark tick: Circled checkmark SVG matching original Lu
                    seen
                      ? h(
                          'svg',
                          {
                            class: 'checkwords-check-svg',
                            viewBox: '0 0 20 20',
                            fill: 'currentColor'
                          },
                          [
                            h('path', {
                              'fill-rule': 'evenodd',
                              'clip-rule': 'evenodd',
                              d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            })
                          ]
                        )
                      : null
                  ]),
                  h('div', { class: 'checkwords-divider' })
                ]
              );
            })
          )
        ]),

        // Bottom Button: Strictly disabled until all words are viewed
        h('div', { class: 'checkwords-bottom-bar' }, [
          h(
            'button',
            {
              class: `checkwords-action-btn ${canStart ? 'enabled' : 'disabled'}`,
              disabled: !canStart,
              onClick: () => {
                if (canStart) self.goToDiscussion();
              }
            },
            canStart ? 'Go to discussion' : 'View all words to start'
          )
        ]),

        // 1. Confirmation Popup BEFORE viewing word again (Matching original Lu)
        self.confirmReviewPlayer
          ? h('div', { class: 'checkwords-modal-overlay' }, [
              h('div', { class: 'checkwords-confirm-card' }, [
                h(
                  'div',
                  { class: 'checkwords-confirm-title' },
                  `${self.confirmReviewPlayer.name} has already seen their word. Want to see again?`
                ),
                h('div', { class: 'checkwords-confirm-actions' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'checkwords-confirm-btn-no',
                      onClick: () => self.cancelReview()
                    },
                    'No'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'checkwords-confirm-btn-yes',
                      onClick: () => self.confirmReview()
                    },
                    'Yes'
                  )
                ])
              ])
            ])
          : null,

        // 2. Secret Word Modal Dialog (Matching Uu in original app)
        self.modalPlayer
          ? h('div', { class: 'checkwords-modal-overlay' }, [
              h('div', { class: 'checkwords-modal-card' }, [
                h('div', { class: 'checkwords-modal-player' }, self.modalPlayer.name),
                h(
                  'div',
                  { class: 'checkwords-modal-sub' },
                  self.modalPlayer.isImpostor ? 'You are -' : 'Your word is -'
                ),
                h(
                  'div',
                  {
                    class: `checkwords-modal-word ${self.modalPlayer.isImpostor ? 'impostor' : ''}`
                  },
                  self.modalPlayer.isImpostor ? 'The Impostor!' : self.modalPlayer.word
                ),
                h('div', { class: 'checkwords-modal-btn-wrap' }, [
                  h(
                    'button',
                    {
                      class: 'checkwords-modal-ok-btn',
                      onClick: () => self.closeModal()
                    },
                    'OK'
                  )
                ])
              ])
            ])
          : null
      ]);
    }
  };
}

// ==========================================================================
// 3. VOTING SYSTEM COMPONENT (No Timers, Minimalist, Theme Matched)
// ==========================================================================
export function createVotingComponent(ho) {
  const h = makeH(ho);

  return {
    name: 'VotingSystem',
    props: ['activePlayers', 'roles', 'words', 'wordsSetterName'],
    data() {
      const initialEliminated = (this.activePlayers || []).map(() => false);
      const configuredMode = getSavedVotingMode();

      return {
        round: 1,
        stage: 'clues', // 'clues' | 'secret_handover' | 'secret_ballot' | 'secret_voted' | 'tally_voting' | 'reveal' | 'ceremony'
        votingMode: configuredMode,

        eliminated: initialEliminated,
        speakingOrder: [],
        spokeStatus: {},

        // Secret Voting State
        currentVoterIdxInAlive: 0,
        selectedSuspect: null,
        secretVotes: {},

        // Open Tally State
        tallyVotes: {},

        // Results
        resultsLeader: null,
        resultsTallies: [],
        tiedSuspects: [],

        // Elimination State
        eliminatedPlayerInfo: null,
        gameEndedWinner: null
      };
    },

    computed: {
      aliveIndices() {
        const list = [];
        (this.activePlayers || []).forEach((p, idx) => {
          if (!this.eliminated[idx]) list.push(idx);
        });
        return list;
      },

      aliveCivilianCount() {
        let count = 0;
        this.aliveIndices.forEach(idx => {
          if (this.roles && this.roles[idx] === 'civilian') count++;
        });
        return count;
      },

      aliveImpostorCount() {
        let count = 0;
        this.aliveIndices.forEach(idx => {
          if (this.roles && this.roles[idx] !== 'civilian') count++;
        });
        return count;
      },

      currentVoterIndex() {
        if (this.currentVoterIdxInAlive >= this.aliveIndices.length) return null;
        return this.aliveIndices[this.currentVoterIdxInAlive];
      },

      currentVoterPlayer() {
        const idx = this.currentVoterIndex;
        if (idx == null) return null;
        return this.activePlayers[idx];
      }
    },

    mounted() {
      this.shuffleSpeakingOrder();
      this.votingMode = getSavedVotingMode();
    },

    methods: {
      shuffleSpeakingOrder() {
        const alive = [...this.aliveIndices];
        for (let i = alive.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [alive[i], alive[j]] = [alive[j], alive[i]];
        }
        this.speakingOrder = alive;
        this.spokeStatus = {};
      },

      toggleSpoke(idx) {
        this.spokeStatus = { ...this.spokeStatus, [idx]: !this.spokeStatus[idx] };
      },

      toggleVotingMode() {
        const next = this.votingMode === 'hidden' ? 'open' : 'hidden';
        this.votingMode = next;
        saveVotingMode(next);
      },

      // Start Voting Directly (NO TIMER)
      startVoting() {
        if (this.votingMode === 'hidden') {
          this.currentVoterIdxInAlive = 0;
          this.selectedSuspect = null;
          this.secretVotes = {};
          this.stage = 'secret_handover';
        } else {
          this.initTallyVotes();
          this.stage = 'tally_voting';
        }
      },

      // Secret Ballot Flow
      beginVoterTurn() {
        this.selectedSuspect = null;
        this.stage = 'secret_ballot';
      },

      selectSecretSuspect(suspectIdxOrSkip) {
        this.selectedSuspect = suspectIdxOrSkip;
      },

      submitSecretVote() {
        if (this.selectedSuspect === null) return;
        const voterIdx = this.currentVoterIndex;
        this.secretVotes = { ...this.secretVotes, [voterIdx]: this.selectedSuspect };
        this.stage = 'secret_voted';
      },

      nextVoter() {
        this.currentVoterIdxInAlive++;
        if (this.currentVoterIdxInAlive >= this.aliveIndices.length) {
          this.computeSecretResults();
          this.stage = 'reveal';
        } else {
          this.selectedSuspect = null;
          this.stage = 'secret_handover';
        }
      },

      // Open Tally Flow
      initTallyVotes() {
        const map = { skip: 0 };
        this.aliveIndices.forEach(idx => {
          map[idx] = 0;
        });
        this.tallyVotes = map;
      },

      adjustTally(suspectIdxOrSkip, delta) {
        const cur = this.tallyVotes[suspectIdxOrSkip] || 0;
        const next = Math.max(0, cur + delta);
        this.tallyVotes = { ...this.tallyVotes, [suspectIdxOrSkip]: next };
      },

      submitOpenTally() {
        const counts = {};
        this.aliveIndices.forEach(idx => {
          counts[idx] = this.tallyVotes[idx] || 0;
        });
        counts.skip = this.tallyVotes.skip || 0;

        const tallies = Object.entries(counts).map(([k, count]) => {
          return {
            target: k === 'skip' ? 'skip' : parseInt(k, 10),
            name: k === 'skip' ? 'Skip Vote' : this.activePlayers[k].name,
            count
          };
        });

        tallies.sort((a, b) => b.count - a.count);
        this.resultsTallies = tallies;

        const topCount = tallies[0]?.count || 0;
        if (topCount === 0) {
          this.resultsLeader = null;
          this.tiedSuspects = [];
        } else {
          const topCandidates = tallies.filter(t => t.count === topCount);
          if (topCandidates.length === 1) {
            this.resultsLeader = topCandidates[0].target;
            this.tiedSuspects = [];
          } else {
            this.resultsLeader = null;
            this.tiedSuspects = topCandidates.map(c => c.target);
          }
        }

        this.stage = 'reveal';
      },

      computeSecretResults() {
        const counts = {};
        this.aliveIndices.forEach(idx => {
          counts[idx] = 0;
        });
        counts.skip = 0;

        Object.values(this.secretVotes).forEach(target => {
          if (counts[target] !== undefined) counts[target]++;
        });

        const tallies = Object.entries(counts).map(([k, count]) => {
          return {
            target: k === 'skip' ? 'skip' : parseInt(k, 10),
            name: k === 'skip' ? 'Skip Vote' : this.activePlayers[k].name,
            count
          };
        });

        tallies.sort((a, b) => b.count - a.count);
        this.resultsTallies = tallies;

        const topCount = tallies[0]?.count || 0;
        if (topCount === 0) {
          this.resultsLeader = null;
          this.tiedSuspects = [];
        } else {
          const topCandidates = tallies.filter(t => t.count === topCount);
          if (topCandidates.length === 1) {
            this.resultsLeader = topCandidates[0].target;
            this.tiedSuspects = [];
          } else {
            this.resultsLeader = null;
            this.tiedSuspects = topCandidates.map(c => c.target);
          }
        }
      },

      eliminateSuspect(suspectIdxOrSkip) {
        if (suspectIdxOrSkip === 'skip' || suspectIdxOrSkip === null) {
          this.eliminatedPlayerInfo = null;
          this.checkGameStatus();
          return;
        }

        const idx = suspectIdxOrSkip;
        const newElim = [...this.eliminated];
        newElim[idx] = true;
        this.eliminated = newElim;

        const p = this.activePlayers[idx];
        const role = this.roles ? this.roles[idx] : 'civilian';
        const isCivilian = role === 'civilian';
        const isImpostor = role === 'mrWhite';
        const isUndercover = role === 'undercover';

        this.eliminatedPlayerInfo = {
          name: p.name,
          role,
          isCivilian,
          isImpostor,
          isUndercover
        };

        this.checkGameStatus();
      },

      checkGameStatus() {
        let aliveCivilians = 0;
        let aliveImpostors = 0;

        this.activePlayers.forEach((p, idx) => {
          if (!this.eliminated[idx]) {
            const role = this.roles ? this.roles[idx] : 'civilian';
            if (role === 'civilian') {
              aliveCivilians++;
            } else {
              aliveImpostors++;
            }
          }
        });

        if (aliveImpostors === 0) {
          this.gameEndedWinner = 'civilians';
          this.stage = 'ceremony';
          this.notifyEndGame('civilians');
        } else if (aliveImpostors >= aliveCivilians) {
          this.gameEndedWinner = 'undercovers';
          this.stage = 'ceremony';
          this.notifyEndGame('undercovers');
        } else {
          this.gameEndedWinner = null;
          this.stage = 'ceremony';
        }
      },

      proceedToNextRound() {
        this.round++;
        this.selectedSuspect = null;
        this.secretVotes = {};
        this.tallyVotes = {};
        this.resultsLeader = null;
        this.resultsTallies = [];
        this.tiedSuspects = [];
        this.eliminatedPlayerInfo = null;
        this.shuffleSpeakingOrder();
        this.stage = 'clues';
      },

      restartGame() {
        const el = this.$el || document.getElementById('app') || document.documentElement;
        el.dispatchEvent(
          new CustomEvent('__93.custom', {
            detail: {
              event: {
                id: 'restartGame'
              }
            },
            bubbles: true
          })
        );
      },

      notifyEndGame(winner) {
        const el = this.$el || document.getElementById('app') || document.documentElement;
        el.dispatchEvent(
          new CustomEvent('__93.custom', {
            detail: {
              event: {
                id: 'endGame',
                data: { winner }
              }
            },
            bubbles: true
          })
        );
      }
    },

    render() {
      const self = this;

      // ====================================================================
      // Subview 1: CLUES & DISCUSSION PHASE
      // ====================================================================
      if (self.stage === 'clues') {
        return h('div', { class: 'voting-container' }, [
          // Header
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, `Round ${self.round}`),
            h(
              'div',
              {
                class: 'voting-mode-badge',
                onClick: () => self.toggleVotingMode(),
                style: 'cursor: pointer;'
              },
              self.votingMode === 'hidden' ? 'Hidden Vote' : 'Open Tell'
            )
          ]),

          // Main Area
          h('div', { class: 'voting-main-area' }, [
            h('div', { class: 'discussion-prompt-box' }, [
              h('div', { class: 'discussion-prompt-title' }, 'Discussion Phase'),
              h(
                'div',
                { class: 'discussion-prompt-desc' },
                'Each player gives a clue about their secret word in order. Tap a player once they have spoken.'
              )
            ]),

            // Speaker List in randomized order
            h(
              'div',
              { class: 'player-list-section' },
              self.speakingOrder.map((playerIdx, orderNum) => {
                const p = self.activePlayers[playerIdx];
                const spoke = !!self.spokeStatus[playerIdx];
                return h(
                  'div',
                  {
                    key: playerIdx,
                    class: `player-card ${spoke ? 'eliminated' : ''}`,
                    onClick: () => self.toggleSpoke(playerIdx),
                    style: 'cursor: pointer;'
                  },
                  [
                    h('div', [
                      h('span', { style: 'font-weight: 700; color: #9ca3af; margin-right: 8px;' }, `#${orderNum + 1}`),
                      h('span', { class: 'player-card-name' }, p.name)
                    ]),
                    h('span', { style: `font-size: 14px; font-weight: 600; color: ${spoke ? '#16a34a' : '#9ca3af'};` }, spoke ? '✓ Spoke' : 'Tap when done')
                  ]
                );
              })
            )
          ]),

          // Bottom Action: Direct Start Voting Button (NO TIMER)
          h('div', { class: 'voting-bottom-actions' }, [
            h(
              'button',
              {
                class: 'btn-primary-action',
                onClick: () => self.startVoting()
              },
              self.votingMode === 'hidden' ? 'Start Secret Ballot' : 'Start Group Voting'
            )
          ])
        ]);
      }

      // ====================================================================
      // Subview 2: SECRET HANDOVER SCREEN
      // ====================================================================
      if (self.stage === 'secret_handover') {
        const voter = self.currentVoterPlayer;
        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, 'Private Ballot'),
            h('div', { class: 'voting-mode-badge' }, `${self.currentVoterIdxInAlive + 1} / ${self.aliveIndices.length}`)
          ]),

          h('div', { class: 'voting-main-area', style: 'justify-content: center;' }, [
            h('div', { class: 'handover-card' }, [
              h('div', { style: 'font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 6px;' }, 'PASS DEVICE TO'),
              h('div', { class: 'handover-player-title' }, voter ? voter.name : ''),
              h(
                'div',
                { class: 'handover-instruction' },
                'Only you should view the screen. Cast your secret vote privately.'
              ),
              h(
                'button',
                {
                  class: 'btn-primary-action',
                  style: 'max-width: 260px; height: 56px;',
                  onClick: () => self.beginVoterTurn()
                },
                `I am ${voter ? voter.name : 'Ready'}`
              )
            ])
          ])
        ]);
      }

      // ====================================================================
      // Subview 3: SECRET BALLOT SCREEN
      // ====================================================================
      if (self.stage === 'secret_ballot') {
        const voter = self.currentVoterPlayer;
        const voterIdx = self.currentVoterIndex;

        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, voter ? voter.name : 'Secret Vote'),
            h('div', { class: 'voting-mode-badge' }, 'Confidential')
          ]),

          h('div', { class: 'voting-main-area' }, [
            h('div', { class: 'discussion-prompt-box' }, [
              h('div', { class: 'discussion-prompt-title' }, 'Who do you suspect?'),
              h('div', { class: 'discussion-prompt-desc' }, 'Select one player to vote out, or choose Skip.')
            ]),

            // Suspect List
            h(
              'div',
              { class: 'player-list-section' },
              self.aliveIndices.map(suspectIdx => {
                if (suspectIdx === voterIdx) return null;
                const p = self.activePlayers[suspectIdx];
                const isSelected = self.selectedSuspect === suspectIdx;
                return h(
                  'div',
                  {
                    key: suspectIdx,
                    class: `ballot-option-card ${isSelected ? 'selected' : ''}`,
                    onClick: () => self.selectSecretSuspect(suspectIdx)
                  },
                  [
                    h('span', { class: 'player-card-name' }, p.name),
                    h('div', { class: `ballot-radio ${isSelected ? 'selected' : ''}` })
                  ]
                );
              })
            ),

            // Skip Option
            h(
              'div',
              {
                class: `ballot-option-card ${self.selectedSuspect === 'skip' ? 'selected' : ''}`,
                onClick: () => self.selectSecretSuspect('skip')
              },
              [
                h('span', { class: 'player-card-name', style: 'color: #6b7280;' }, 'Skip Vote (No one)'),
                h('div', { class: `ballot-radio ${self.selectedSuspect === 'skip' ? 'selected' : ''}` })
              ]
            )
          ]),

          // Submit Ballot
          h('div', { class: 'voting-bottom-actions' }, [
            h(
              'button',
              {
                class: 'btn-primary-action',
                style: self.selectedSuspect === null ? 'background-color: #9ca3af; cursor: not-allowed;' : '',
                disabled: self.selectedSuspect === null,
                onClick: () => self.submitSecretVote()
              },
              'Confirm Secret Vote'
            )
          ])
        ]);
      }

      // ====================================================================
      // Subview 4: SECRET VOTED CONFIRMATION SCREEN
      // ====================================================================
      if (self.stage === 'secret_voted') {
        const hasMore = self.currentVoterIdxInAlive + 1 < self.aliveIndices.length;
        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, 'Vote Recorded'),
            h('div', { class: 'voting-mode-badge' }, '✓ Saved')
          ]),

          h('div', { class: 'voting-main-area', style: 'justify-content: center;' }, [
            h('div', { class: 'handover-card' }, [
              h('div', { style: 'font-size: 36px; margin-bottom: 12px; color: #16a34a;' }, '✓'),
              h('div', { class: 'handover-player-title' }, 'Vote Recorded'),
              h(
                'div',
                { class: 'handover-instruction' },
                hasMore
                  ? 'Please pass the device to the next player.'
                  : 'All secret votes are in! Hand device back to the group.'
              ),
              h(
                'button',
                {
                  class: 'btn-primary-action',
                  style: 'max-width: 260px; height: 56px;',
                  onClick: () => self.nextVoter()
                },
                hasMore ? 'Next Voter' : 'Reveal Results'
              )
            ])
          ])
        ]);
      }

      // ====================================================================
      // Subview 5: OPEN TELL TALLY SCREEN
      // ====================================================================
      if (self.stage === 'tally_voting') {
        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, 'Group Vote (Open Tell)'),
            h('div', { class: 'voting-mode-badge' }, 'Count Hands')
          ]),

          h('div', { class: 'voting-main-area' }, [
            h('div', { class: 'discussion-prompt-box' }, [
              h('div', { class: 'discussion-prompt-title' }, 'Count Raised Hands'),
              h('div', { class: 'discussion-prompt-desc' }, 'Discuss openly and record how many players voted for each suspect.')
            ]),

            // Tally list for alive players
            h(
              'div',
              { class: 'player-list-section' },
              self.aliveIndices.map(suspectIdx => {
                const p = self.activePlayers[suspectIdx];
                const count = self.tallyVotes[suspectIdx] || 0;
                return h(
                  'div',
                  { key: suspectIdx, class: 'player-card' },
                  [
                    h('span', { class: 'player-card-name' }, p.name),
                    h('div', { class: 'tally-row' }, [
                      h(
                        'button',
                        {
                          class: 'tally-btn',
                          onClick: () => self.adjustTally(suspectIdx, -1)
                        },
                        '−'
                      ),
                      h('span', { class: 'tally-count' }, count),
                      h(
                        'button',
                        {
                          class: 'tally-btn',
                          onClick: () => self.adjustTally(suspectIdx, 1)
                        },
                        '+'
                      )
                    ])
                  ]
                );
              })
            ),

            // Skip Option
            h('div', { class: 'player-card' }, [
              h('span', { class: 'player-card-name', style: 'color: #6b7280;' }, 'Skip Vote'),
              h('div', { class: 'tally-row' }, [
                h(
                  'button',
                  {
                    class: 'tally-btn',
                    onClick: () => self.adjustTally('skip', -1)
                  },
                  '−'
                ),
                h('span', { class: 'tally-count' }, self.tallyVotes.skip || 0),
                h(
                  'button',
                  {
                    class: 'tally-btn',
                    onClick: () => self.adjustTally('skip', 1)
                  },
                  '+'
                )
              ])
            ])
          ]),

          h('div', { class: 'voting-bottom-actions' }, [
            h(
              'button',
              {
                class: 'btn-primary-action',
                onClick: () => self.submitOpenTally()
              },
              'Confirm Tally & Reveal'
            )
          ])
        ]);
      }

      // ====================================================================
      // Subview 6: VOTE RESULTS & ELIMINATION
      // ====================================================================
      if (self.stage === 'reveal') {
        const leader = self.resultsLeader;
        const leaderName = leader !== null && leader !== 'skip' ? self.activePlayers[leader]?.name : null;

        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, 'Voting Results'),
            h('div', { class: 'voting-mode-badge' }, 'Round Complete')
          ]),

          h('div', { class: 'voting-main-area' }, [
            // Results Table
            h(
              'div',
              { class: 'player-list-section' },
              self.resultsTallies.map(t => {
                const isLeader = leader !== null && t.target === leader;
                return h(
                  'div',
                  {
                    key: t.target,
                    class: `player-card ${isLeader ? 'selected' : ''}`,
                    style: isLeader ? 'border-color: #1f2937; background-color: #f9fafb;' : ''
                  },
                  [
                    h('span', { class: 'player-card-name' }, t.name),
                    h('span', { style: 'font-size: 16px; font-weight: 700; color: #1f2937;' }, `${t.count} vote${t.count === 1 ? '' : 's'}`)
                  ]
                );
              })
            ),

            // Summary Text
            h('div', { style: 'text-align: center; margin-top: 16px; padding: 12px;' }, [
              leader === 'skip'
                ? h('div', { style: 'font-size: 18px; font-weight: 700; color: #4b5563;' }, 'No player was eliminated this round (Skip won).')
                : self.tiedSuspects.length > 0
                ? h('div', { style: 'font-size: 16px; font-weight: 600; color: #4b5563;' }, 'Tie detected! Select which player to eliminate or skip:')
                : leader !== null
                ? h('div', { style: 'font-size: 18px; font-weight: 700; color: #1f2937;' }, `${leaderName} received the most votes.`)
                : h('div', { style: 'font-size: 16px; color: #6b7280;' }, 'No votes were cast.')
            ]),

            // If tied, display buttons for tied candidates
            self.tiedSuspects.length > 0
              ? h(
                  'div',
                  { style: 'display: flex; flex-direction: column; gap: 8px; margin-top: 12px;' },
                  self.tiedSuspects.map(sIdx => {
                    const p = self.activePlayers[sIdx];
                    return h(
                      'button',
                      {
                        key: sIdx,
                        class: 'btn-primary-action',
                        style: 'height: 52px; font-size: 16px;',
                        onClick: () => self.eliminateSuspect(sIdx)
                      },
                      `Eliminate ${p ? p.name : ''}`
                    );
                  })
                )
              : null
          ]),

          // Bottom Action
          h('div', { class: 'voting-bottom-actions' }, [
            leader !== null && leader !== 'skip'
              ? h(
                  'button',
                  {
                    class: 'btn-primary-action',
                    onClick: () => self.eliminateSuspect(leader)
                  },
                  `Eliminate ${leaderName}`
                )
              : self.tiedSuspects.length > 0
              ? h(
                  'button',
                  {
                    class: 'btn-primary-action',
                    style: 'background-color: #4b5563;',
                    onClick: () => self.eliminateSuspect('skip')
                  },
                  'Skip Elimination (Tie)'
                )
              : h(
                  'button',
                  {
                    class: 'btn-primary-action',
                    onClick: () => self.eliminateSuspect('skip')
                  },
                  'Continue Without Elimination'
                )
          ])
        ]);
      }

      // ====================================================================
      // Subview 7: CEREMONY / GAME END
      // ====================================================================
      if (self.stage === 'ceremony') {
        const info = self.eliminatedPlayerInfo;
        const winner = self.gameEndedWinner;

        return h('div', { class: 'voting-container' }, [
          h('div', { class: 'voting-header' }, [
            h('div', { class: 'voting-header-title' }, winner ? 'Game Over' : 'Elimination'),
            h('div', { class: 'voting-mode-badge' }, winner ? 'Winner Revealed' : 'Next Up')
          ]),

          h('div', { class: 'voting-main-area', style: 'justify-content: center;' }, [
            info
              ? h('div', { class: 'ceremony-card' }, [
                  h('div', { style: 'font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 4px;' }, 'ELIMINATED PLAYER'),
                  h('div', { style: 'font-size: 26px; font-weight: 700; color: #1f2937; margin-bottom: 12px;' }, info.name),
                  h(
                    'div',
                    { class: info.isCivilian ? 'role-tag-civilian' : 'role-tag-impostor' },
                    info.isCivilian
                      ? 'CIVILIAN'
                      : info.isImpostor
                      ? 'THE IMPOSTOR'
                      : 'UNDERCOVER'
                  )
                ])
              : h('div', { class: 'ceremony-card' }, [
                  h('div', { style: 'font-size: 20px; font-weight: 700; color: #1f2937;' }, 'No One Eliminated')
                ]),

            // Winner Announcement if Game Over
            winner
              ? h('div', { class: 'ceremony-card', style: 'border-color: #1f2937; background: #ffffff;' }, [
                  h(
                    'div',
                    {
                      style: `font-size: 28px; font-weight: 800; color: ${winner === 'civilians' ? '#16a34a' : '#dc2626'}; margin-bottom: 6px;`
                    },
                    winner === 'civilians' ? 'Civilians Win!' : 'Impostors Win!'
                  ),
                  h(
                    'div',
                    { style: 'font-size: 14px; color: #4b5563;' },
                    winner === 'civilians'
                      ? 'All Impostors and Undercovers have been eliminated!'
                      : 'The Impostors have taken over!'
                  )
                ])
              : null
          ]),

          // Bottom Action
          h('div', { class: 'voting-bottom-actions' }, [
            winner
              ? h(
                  'button',
                  {
                    class: 'btn-primary-action',
                    onClick: () => self.restartGame()
                  },
                  'Play Again'
                )
              : h(
                  'button',
                  {
                    class: 'btn-primary-action',
                    onClick: () => self.proceedToNextRound()
                  },
                  `Start Round ${self.round + 1}`
                )
          ])
        ]);
      }

      return h('div', { class: 'voting-container' }, 'Loading...');
    }
  };
}

// ==========================================================================
// 4. TOP PANEL COMPONENT (Matching Iu + Fullscreen Toggle Button)
// Exact circular theme: h-16 w-16 rounded-full border border-gray-500
// Buttons: [Refresh] [Fullscreen Toggle] [Options (more_vert)]
// ==========================================================================
export function createTopPanelComponent(ho) {
  const h = makeH(ho);

  return {
    name: 'TopPanel',
    props: ['phase'],
    data() {
      return {
        isFullscreen: false,
        showRestartConfirm: false
      };
    },

    mounted() {
      const checkFs = () => {
        this.isFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
      };
      this._checkFs = checkFs;
      document.addEventListener('fullscreenchange', checkFs);
      document.addEventListener('webkitfullscreenchange', checkFs);
      document.addEventListener('mozfullscreenchange', checkFs);
      document.addEventListener('MSFullscreenChange', checkFs);
      checkFs();
    },

    beforeUnmount() {
      if (this._checkFs) {
        document.removeEventListener('fullscreenchange', this._checkFs);
        document.removeEventListener('webkitfullscreenchange', this._checkFs);
        document.removeEventListener('mozfullscreenchange', this._checkFs);
        document.removeEventListener('MSFullscreenChange', this._checkFs);
      }
    },

    methods: {
      toggleFullscreen() {
        const isFull = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
        if (!isFull) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      },

      onRestart() {
        this.showRestartConfirm = true;
      },

      confirmRestart() {
        this.showRestartConfirm = false;
        this.dispatchGameEvent('restartGame');
      },

      cancelRestart() {
        this.showRestartConfirm = false;
      },

      onOptions() {
        this.dispatchGameEvent('showOptionsDialog');
      },

      dispatchGameEvent(id, data = {}) {
        const el = this.$el || document.getElementById('app') || document.documentElement;
        el.dispatchEvent(
          new CustomEvent('__93.custom', {
            detail: {
              event: {
                id,
                data
              }
            },
            bubbles: true
          })
        );
      }
    },

    render() {
      const self = this;

      return h(
        'div',
        {
          class:
            'w-full py-4 flex flex-row gap-x-4 border-b border-gray-300 bg-white text-lg items-center justify-center top-panel-container'
        },
        [
          // Button 1: Restart (refresh icon)
          h(
            'button',
            {
              type: 'button',
              class:
                'h-16 w-16 rounded-full flex items-center justify-center border border-gray-500 text-gray-700 bg-white active:bg-gray-200 cursor-pointer top-panel-btn',
              title: 'Restart game',
              onClick: () => self.onRestart()
            },
            [
              h(
                'span',
                {
                  class: 'material-symbols-outlined',
                  style: {
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    fontSize: '28px',
                    lineHeight: '1'
                  }
                },
                'refresh'
              )
            ]
          ),

          // Button 2: Fullscreen Toggle (Material Symbols fullscreen / fullscreen_exit)
          h(
            'button',
            {
              type: 'button',
              class:
                'h-16 w-16 rounded-full flex items-center justify-center border border-gray-500 text-gray-700 bg-white active:bg-gray-200 cursor-pointer top-panel-btn',
              title: self.isFullscreen ? 'Exit full screen' : 'Enter full screen',
              onClick: () => self.toggleFullscreen()
            },
            [
              self.isFullscreen
                ? h(
                    'svg',
                    {
                      viewBox: '0 0 24 24',
                      width: '28',
                      height: '28',
                      fill: 'currentColor',
                      style: { display: 'block' }
                    },
                    [
                      h('path', {
                        d: 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'
                      })
                    ]
                  )
                : h(
                    'svg',
                    {
                      viewBox: '0 0 24 24',
                      width: '28',
                      height: '28',
                      fill: 'currentColor',
                      style: { display: 'block' }
                    },
                    [
                      h('path', {
                        d: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'
                      })
                    ]
                  )
            ]
          ),

          // Button 3: Options (more_vert icon)
          h(
            'button',
            {
              type: 'button',
              class:
                'h-16 w-16 rounded-full flex items-center justify-center border border-gray-500 text-gray-700 bg-white active:bg-gray-200 cursor-pointer top-panel-btn',
              title: 'Options',
              onClick: () => self.onOptions()
            },
            [
              h(
                'span',
                {
                  class: 'material-symbols-outlined',
                  style: {
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    fontSize: '28px',
                    lineHeight: '1'
                  }
                },
                'more_vert'
              )
            ]
          ),

          // Optional Restart Confirmation Modal Dialog (100% theme matched)
          self.showRestartConfirm
            ? h('div', { class: 'top-panel-modal-overlay' }, [
                h('div', { class: 'top-panel-modal-card' }, [
                  h(
                    'div',
                    { class: 'top-panel-modal-title' },
                    'Are you sure you want to restart the game?'
                  ),
                  h('div', { class: 'top-panel-modal-actions' }, [
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'top-panel-modal-btn-cancel',
                        onClick: () => self.cancelRestart()
                      },
                      'No'
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        class: 'top-panel-modal-btn-confirm',
                        onClick: () => self.confirmRestart()
                      },
                      'Yes'
                    )
                  ])
                ])
              ])
            : null
        ]
      );
    }
  };
}
