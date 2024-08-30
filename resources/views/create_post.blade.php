@if ($errors->any())
    <div class="alert alert-info mb-4">
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif
<pre>
    {{print_r($data)}}
</pre>