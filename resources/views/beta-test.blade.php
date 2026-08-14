<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/beta-test.css?v={{ filemtime(public_path('assets/css/beta-test.css')) }}"/>

    <div class='beta_window'>
        <div class='informations'></div>
        <div class='fill_content'></div>
    </div>

    <script src="assets/js/beta-test.js?v={{ filemtime(public_path('assets/js/beta-test.js')) }}"></script>
    <!-- The shared nav (navigation-menu.blade.php, rendered by x-app-layout
         on every page including this one) uses fa-solid/fa-regular class
         names — the FA6 kit convention, not the old v5.7.0 fas/far classes
         the <link> above provides. Without this script those icons never
         resolve to anything and render invisibly. Every other page that
         uses x-app-layout already loads this; it was just missing here. -->
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
