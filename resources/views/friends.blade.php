<x-app-layout>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/friends.css"/>

    <div class="friends-shell">
        <h1>Friends</h1>

        <section class="requests-section d-none">
            <h2><span class="requests-count"></span></h2>
            <div class="requests-list"></div>
        </section>

        <section class="suggestions-section">
            <h2>People you may know</h2>
            <div class="suggestions-list"></div>
        </section>
    </div>

    <script src="../assets/js/friends.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
