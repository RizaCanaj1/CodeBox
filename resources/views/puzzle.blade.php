<x-app-layout>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/puzzle.css"/>

    <div class="puzzle-shell">
        <div class="puzzle-hero">
            <i class="fa-solid fa-puzzle-piece puzzle-hero-icon"></i>
            <h1>Puzzles</h1>
            <p>Pick a mode. Bug Hunter is live — jump into a buggy multi-file project and squash every bug in it before it takes down your PC.</p>
        </div>

        <div class="puzzle-grid">
            <a class="puzzle-card puzzle-card-live" href="{{ url('/puzzle/bug-hunter') }}">
                <i class="fa-solid fa-bug"></i>
                <h4>Bug Hunter</h4>
                <p>Fix real bugs across a small multi-file project before they crawl to your PC.</p>
                <span class="puzzle-live">Play now</span>
            </a>
            <div class="puzzle-card puzzle-card-locked">
                <i class="fa-solid fa-code-compare"></i>
                <h4>More modes</h4>
                <p>Refactor Rush, Code Golf and others are on the way.</p>
                <span class="puzzle-soon">Coming soon</span>
            </div>
        </div>
    </div>

    <script src="../assets/js/puzzle.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
