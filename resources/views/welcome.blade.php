<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>CodeBox — Share, learn, and build with other developers.</title>
        <meta name="description" content="CodeBox is a community for developers to share code, ask questions, team up on projects, and learn through courses, puzzles, and badges.">
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <!-- Styles -->
        <link rel="stylesheet" href="assets/css/main.css"/>
        <link rel="stylesheet" href="assets/css/welcome.css"/>
    </head>
    <body class="cb-landing">

        <nav class="cb-nav">
            <div class="cb-container">
                <div class="cb-brand">
                    <div class="CodeBox d-flex justify-content-center">
                        <p>{<span>...</span>}</p>
                    </div>
                    <span class="cb-brand-name">CodeBox</span>
                </div>

                <div class="cb-nav-links" id="cbNavLinks">
                    <a href="#features">Features</a>
                    <a href="#learn">Learn</a>
                    <a href="#how-it-works">How it works</a>
                </div>

                <div class="cb-nav-actions">
                    @if (Route::has('login'))
                        @auth
                            <a href="{{ url('/dashboard') }}" class="cb-btn cb-btn-primary">Dashboard</a>
                        @else
                            <a href="{{ route('login') }}" class="cb-btn cb-btn-ghost">Log in</a>
                            @if (Route::has('register'))
                                <a href="{{ route('register') }}" class="cb-btn cb-btn-primary">Get started</a>
                            @endif
                        @endauth
                    @endif
                    <button type="button" class="cb-menu-toggle" id="cbMenuToggle" aria-label="Toggle navigation">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>
        </nav>

        <header class="cb-hero">
            <div class="cb-hero-glow"></div>
            <div class="cb-container">
                <div class="cb-reveal">
                    <span class="cb-eyebrow"><i class="fas fa-circle"></i> Built for developers</span>
                    <h1>Share your code.<br>Ask <span class="cb-accent-text">real</span> questions.<br>Build together.</h1>
                    <p>CodeBox is a place for developers to post what they're building, get feedback from people who actually understand it, team up on projects worth finishing — and learn along the way through courses, puzzles, and badges.</p>
                    <div class="cb-hero-actions">
                        @auth
                            <a href="{{ url('/dashboard') }}" class="cb-btn cb-btn-primary cb-btn-lg">Go to dashboard <i class="fas fa-arrow-right"></i></a>
                        @else
                            @if (Route::has('register'))
                                <a href="{{ route('register') }}" class="cb-btn cb-btn-primary cb-btn-lg">Create your account</a>
                            @endif
                            @if (Route::has('login'))
                                <a href="{{ route('login') }}" class="cb-btn cb-btn-ghost cb-btn-lg">Log in</a>
                            @endif
                        @endauth
                    </div>
                    <div class="cb-hero-meta">
                        <i class="fas fa-shield-alt"></i>
                        <span>Free to join &middot; No credit card required</span>
                    </div>
                </div>

                <div class="cb-code-card cb-reveal" data-reveal-delay="120">
                    <div class="cb-code-titlebar">
                        <div class="cb-code-dots"><span></span><span></span><span></span></div>
                        <span class="cb-code-filename">share.js</span>
                    </div>
                    <div class="cb-code-body">
                        <div class="cb-code-lines" aria-hidden="true">
                            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                        </div>
                        <div class="cb-code-content"><span class="cb-code-line"><span class="tok-comment">// share your work with CodeBox</span></span><span class="cb-code-line"><span class="tok-keyword">import</span> <span class="tok-var">CodeBox</span> <span class="tok-keyword">from</span> <span class="tok-string">'codebox'</span></span><span class="cb-code-line">&nbsp;</span><span class="cb-code-line"><span class="tok-keyword">async function</span> <span class="tok-func">shareProject</span>(idea) {</span><span class="cb-code-line">&nbsp;&nbsp;<span class="tok-keyword">const</span> post = <span class="tok-accent">await</span> <span class="tok-var">CodeBox</span>.<span class="tok-func">create</span>({</span><span class="cb-code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-prop">type</span>: <span class="tok-string">'showcase'</span>,</span><span class="cb-code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-prop">code</span>: idea.<span class="tok-prop">snippet</span>,</span><span class="cb-code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-prop">openToCollab</span>: <span class="tok-keyword">true</span>,</span><span class="cb-code-line">&nbsp;&nbsp;});</span></div>
                    </div>
                </div>
            </div>
        </header>

        <section class="cb-features py-5" id="features">
            <div class="cb-container cb-section">
                <div class="cb-section-head cb-reveal">
                    <span class="cb-eyebrow"><i class="fas fa-layer-group"></i> What you can do</span>
                    <h2>Everything a developer community should be</h2>
                    <p>No noise, no fluff — just code, questions, and the people who can help with both.</p>
                </div>
                <div class="cb-feature-grid">
                    <div class="cb-feature-card cb-reveal">
                        <div class="cb-feature-icon"><i class="fas fa-code"></i></div>
                        <h3>Showcase your code</h3>
                        <p>Post snippets and projects with full syntax highlighting, and let others see exactly what you built.</p>
                    </div>
                    <div class="cb-feature-card cb-reveal">
                        <div class="cb-feature-icon"><i class="fas fa-comments"></i></div>
                        <h3>Ask &amp; discuss</h3>
                        <p>Get stuck, post the question, get answers from people who've actually hit the same problem.</p>
                    </div>
                    <div class="cb-feature-card cb-reveal">
                        <div class="cb-feature-icon"><i class="fas fa-handshake"></i></div>
                        <h3>Team up on projects</h3>
                        <p>Open your project to invitations and bring in collaborators when you need extra hands.</p>
                    </div>
                    <div class="cb-feature-card cb-reveal">
                        <div class="cb-feature-icon"><i class="fas fa-user-friends"></i></div>
                        <h3>Grow your network</h3>
                        <p>Follow other developers, build your profile, and stay close to the people you build with.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="cb-learn py-5" id="learn">
            <div class="cb-container cb-section">
                <div class="cb-section-head cb-reveal">
                    <span class="cb-eyebrow"><i class="fas fa-graduation-cap"></i> Not just for sharing</span>
                    <h2>A place to learn, too</h2>
                    <p>CodeBox is growing into more than a feed — a spot to actually get better at writing code, one course, puzzle, and badge at a time.</p>
                </div>
                <div class="cb-learn-grid">
                    <div class="cb-learn-card cb-reveal">
                        <div class="cb-learn-icon"><i class="fas fa-graduation-cap"></i></div>
                        <h3>Courses <span class="cb-soon">Coming soon</span></h3>
                        <p>Structured courses on real languages and frameworks, taught by people who actually ship code.</p>
                    </div>
                    <div class="cb-learn-card cb-reveal">
                        <div class="cb-learn-icon"><i class="fas fa-puzzle-piece"></i></div>
                        <h3>Puzzles <span class="cb-soon">Coming soon</span></h3>
                        <p>Bite-sized coding challenges that sharpen your skills one puzzle at a time.</p>
                    </div>
                    <div class="cb-learn-card cb-reveal">
                        <div class="cb-learn-icon"><i class="fas fa-medal"></i></div>
                        <h3>Levels &amp; badges <span class="cb-soon">Coming soon</span></h3>
                        <p>Earn XP, level up, and collect badges as you learn, share, and help others along the way.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="cb-section" id="how-it-works">
            <div class="cb-container">
                <div class="cb-section-head cb-reveal">
                    <span class="cb-eyebrow"><i class="fas fa-bolt"></i> Getting started</span>
                    <h2>Up and running in three steps</h2>
                </div>
                <div class="cb-steps">
                    <div class="cb-step cb-reveal">
                        <div class="cb-step-index">1</div>
                        <h3>Create your account</h3>
                        <p>Sign up, set up your profile, and tell the community what you're working on.</p>
                    </div>
                    <div class="cb-step cb-reveal">
                        <div class="cb-step-index">2</div>
                        <h3>Share something</h3>
                        <p>Post a showcase, a question, or an invitation to collaborate — whatever you need.</p>
                    </div>
                    <div class="cb-step cb-reveal">
                        <div class="cb-step-index">3</div>
                        <h3>Connect &amp; build</h3>
                        <p>Get feedback, answer others, and team up on the projects that matter to you.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="cb-cta cb-reveal">
            <h2>Ready to share what you're building?</h2>
            <p>Join CodeBox and put your code in front of developers who actually want to see it.</p>
            <div class="cb-cta-actions">
                @auth
                    <a href="{{ url('/dashboard') }}" class="cb-btn cb-btn-primary cb-btn-lg">Go to dashboard</a>
                @else
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="cb-btn cb-btn-primary cb-btn-lg">Get started for free</a>
                    @endif
                    @if (Route::has('login'))
                        <a href="{{ route('login') }}" class="cb-btn cb-btn-ghost cb-btn-lg">Log in</a>
                    @endif
                @endauth
            </div>
        </section>

        <footer class="cb-footer">
            <div class="cb-container">
                <div class="cb-footer-brand">
                    <div class="CodeBox d-flex justify-content-center" style="width:34px;height:34px;">
                        <p style="font-size:18px;">{<span>...</span>}</p>
                    </div>
                    <span>&copy; {{ date('Y') }} CodeBox. Built by developers, for developers.</span>
                </div>
                <div class="cb-footer-links">
                    @if (Route::has('login'))
                        <a href="{{ route('login') }}">Log in</a>
                    @endif
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}">Register</a>
                    @endif
                    <a href="#features">Features</a>
                    <a href="#learn">Learn</a>
                </div>
            </div>
        </footer>

        <script src="assets/js/welcome.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
    </body>
</html>
