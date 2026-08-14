<x-app-layout>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <!-- CodeMirror — the real multi-file editor you fix the bugs in, same
         library/version/theme as the group Code tab's editor. -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css"/>
    <link rel="stylesheet" href="../assets/css/bug_hunter.css"/>

    <div class="bh-shell">
        <a href="{{ url('/puzzle') }}" class="bh-back-link"><i class="fa-solid fa-arrow-left"></i> Puzzles</a>

        <!-- Pre-Start copy — fades out once the monitor starts growing -->
        <div class="bh-intro-copy" id="bh-intro-copy">
            <h1>Bug Hunter</h1>
            <p>A real bugged project just landed on your PC. Fix the code — bugs die the instant your fix lands, no button to press. Let too many pile up and each attack hits harder.</p>
            <button type="button" class="bh-btn bh-btn-primary" id="bh-start-btn">Start</button>
        </div>

        <!-- Live HUD — hidden until the game phase actually starts -->
        <div class="bh-hud" id="bh-hud">
            <div class="bh-hud-item"><i class="fa-solid fa-heart"></i> <div class="bh-health-bar"><div class="bh-health-fill" id="bh-health-fill"></div></div></div>
            <div class="bh-hud-item bh-bugs-left"><i class="fa-solid fa-bug"></i> <span id="bh-bugs-left">0</span> bugs left</div>
            <div class="bh-hud-item bh-score">Score: <span id="bh-score">0</span></div>
            <div class="bh-hud-item bh-next-attack"><i class="fa-solid fa-triangle-exclamation"></i> Next attack in <span id="bh-next-attack">--:--</span></div>
        </div>

        <!-- The monitor — one persistent element. Small during the intro,
             grows once on Start, and stays that size through setup, the
             game itself, and the win/game-over screens (all rendered as
             swapped "phases" inside its screen). Gets a .golden treatment
             once every language x difficulty combo has ever been cleared. -->
        <div class="bh-monitor-wrap">
            <div class="bh-monitor" id="bh-monitor">
                <div class="bh-monitor-screen" id="bh-monitor-screen">

                    <div class="bh-phase bh-phase-intro active" id="bh-phase-intro">
                        <i class="fa-solid fa-bug bh-monitor-bug bug-a"></i>
                        <i class="fa-solid fa-bug bh-monitor-bug bug-b"></i>
                        <i class="fa-solid fa-bug bh-monitor-bug bug-c"></i>
                        <div class="bh-alert">ALERT: BUGS APPROACHING</div>
                    </div>

                    <div class="bh-phase bh-phase-setup" id="bh-phase-setup">
                        <h2>Choose your battlefield</h2>
                        <div class="bh-setup-row">
                            <label class="bh-setup-label">Language</label>
                            <div class="bh-choice-group" id="bh-language-group">
                                <button type="button" class="bh-choice active" data-value="javascript">JavaScript</button>
                                <button type="button" class="bh-choice" data-value="node">Node.js</button>
                                <button type="button" class="bh-choice" data-value="python">Python</button>
                                <button type="button" class="bh-choice" data-value="php">PHP</button>
                                <button type="button" class="bh-choice" data-value="cpp">C++</button>
                                <button type="button" class="bh-choice" data-value="csharp">C#</button>
                                <button type="button" class="bh-choice" data-value="java">Java</button>
                            </div>
                        </div>
                        <div class="bh-setup-row">
                            <label class="bh-setup-label">Difficulty</label>
                            <div class="bh-choice-group" id="bh-difficulty-group">
                                <button type="button" class="bh-choice active" data-value="easy">Easy <span>· 2 bugs, slow attacks</span></button>
                                <button type="button" class="bh-choice" data-value="medium">Medium <span>· 2 tougher bugs</span></button>
                                <button type="button" class="bh-choice" data-value="hard">Hard <span>· 2 nasty bugs, fast</span></button>
                            </div>
                            <div class="bh-progress-line" id="bh-progress-line">0/21 combos cleared</div>
                        </div>
                        <button type="button" class="bh-btn bh-btn-primary" id="bh-begin-btn">Begin</button>

                        <div class="bh-extra-actions">
                            <button type="button" class="bh-link-btn" id="bh-upload-btn"><i class="fa-solid fa-upload"></i> Upload your own challenge</button>
                            <form class="bh-id-form" id="bh-id-form">
                                <input type="text" class="bh-id-input" id="bh-id-input" placeholder="Got a puzzle ID? Play it" maxlength="24">
                                <button type="submit" class="bh-id-submit">Play</button>
                            </form>
                        </div>
                    </div>

                    <div class="bh-phase bh-phase-game" id="bh-phase-game">
                        <div class="bh-wander-layer" id="bh-wander-layer"></div>
                        <div class="bh-editor-panel">
                            <div class="bh-file-tabs" id="bh-file-tabs"></div>
                            <div class="bh-editor-cm" id="bh-editor-cm"></div>
                        </div>
                    </div>

                    <div class="bh-phase bh-phase-win" id="bh-phase-win">
                        <i class="fa-solid fa-trophy bh-win-icon"></i>
                        <h2>All bugs squashed</h2>
                        <p class="bh-final-score">Final score: <span id="bh-win-score">0</span></p>
                        <p class="bh-final-health">PC health left: <span id="bh-win-health">0</span>%</p>
                        <p class="bh-win-golden-note d-none" id="bh-win-golden-note"><i class="fa-solid fa-trophy"></i> Every language and difficulty, cleared. You earned the <strong>Bug Finisher</strong> badge.</p>
                        <div class="bh-gameover-actions">
                            <button type="button" class="bh-btn bh-btn-primary" id="bh-win-retry-btn">Play again</button>
                            <button type="button" class="bh-btn bh-btn-secondary" id="bh-win-change-btn">Change settings</button>
                        </div>
                    </div>

                    <div class="bh-phase bh-phase-gameover" id="bh-phase-gameover">
                        <i class="fa-solid fa-skull bh-gameover-icon"></i>
                        <h2>Your PC didn't make it</h2>
                        <p class="bh-final-score">Final score: <span id="bh-final-score">0</span></p>
                        <p class="bh-final-fixed"><span id="bh-final-fixed">0</span> bugs fixed before it went down</p>
                        <div class="bh-gameover-actions">
                            <button type="button" class="bh-btn bh-btn-primary" id="bh-retry-btn">Play again</button>
                            <button type="button" class="bh-btn bh-btn-secondary" id="bh-change-btn">Change settings</button>
                        </div>
                    </div>

                </div>
                <div class="bh-monitor-stand"></div>
            </div>
        </div>

        <!-- No submit button — bugs die the instant a fix is detected (see
             bhScheduleLiveCheck in bug_hunter.js). This is just a live
             status readout. -->
        <div class="bh-game-footer" id="bh-game-footer">
            <span class="bh-live-feedback" id="bh-live-feedback"></span>
        </div>
    </div>

    <div class="bh-modal-overlay" id="bh-upload-modal">
        <div class="bh-modal">
            <button type="button" class="bh-modal-close" id="bh-upload-modal-close" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <i class="fa-solid fa-upload bh-modal-icon"></i>
            <h3>Upload your own challenge</h3>
            <p>Paste your bugged version and a fixed version of the same code — or upload files instead. This goes live immediately with an ID (that needs the puzzle-ID sharing system, still coming, but the upload itself works now).</p>
            <form id="bh-upload-form" class="bh-upload-form">
                <label class="bh-upload-label">Title
                    <input type="text" id="bh-upload-title" class="bh-upload-input" maxlength="100" placeholder="e.g. Off-by-one nightmare" required>
                </label>
                <label class="bh-upload-label">Language
                    <select id="bh-upload-language" class="bh-upload-input">
                        <option value="javascript">JavaScript</option>
                        <option value="node">Node.js</option>
                        <option value="python">Python</option>
                        <option value="php">PHP</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="java">Java</option>
                        <option value="other">Other</option>
                    </select>
                </label>
                <label class="bh-upload-label bh-upload-course-row d-none" id="bh-upload-course-row">Restrict to a course you teach (optional)
                    <select id="bh-upload-course" class="bh-upload-input">
                        <option value="">Public — anyone with the ID</option>
                    </select>
                </label>
                <label class="bh-upload-label">Bugged code
                    <input type="file" id="bh-upload-bugged-file" class="bh-upload-file">
                    <textarea id="bh-upload-bugged" class="bh-upload-textarea" placeholder="Paste the broken version here, or choose a file above" required></textarea>
                </label>
                <label class="bh-upload-label">Fixed code
                    <input type="file" id="bh-upload-fixed-file" class="bh-upload-file">
                    <textarea id="bh-upload-fixed" class="bh-upload-textarea" placeholder="Paste the working version here, or choose a file above" required></textarea>
                </label>
                <p class="bh-upload-warning"><i class="fa-solid fa-triangle-exclamation"></i> Your fixed code has to actually be a working solution for the bugged code you submit. This publishes immediately — there's no review queue. Enough reports and it gets auto-removed, and repeat offenders lose access to this feature.</p>
                <div class="bh-upload-actions">
                    <span class="bh-upload-status" id="bh-upload-status"></span>
                    <button type="submit" class="bh-btn bh-btn-primary">Publish</button>
                </div>
            </form>

            <div class="bh-browse-section">
                <h4>Community challenges</h4>
                <div class="bh-browse-list" id="bh-browse-list"><p class="bh-browse-empty">Loading…</p></div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/clike/clike.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/htmlmixed/htmlmixed.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/php/php.min.js"></script>
    <script src="../assets/js/bug_hunter.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
