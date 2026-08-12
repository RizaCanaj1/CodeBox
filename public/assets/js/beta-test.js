// Live-preview page for the "Open" button (showcase posts: code_box.js's
// codeblock_event(); group workspace: file_management.js's
// handle_open_item_preview()) — renders an HTML file's raw content inside
// a sandboxed iframe. Takes either ?post=<id>&file=<name> (showcase post,
// flat storage/codes/ lookup) or ?group=<id>&file=<path> (group Code/
// tree, same auth + folder-access checks as editing/deleting a file).
//
// Previously this fetched straight from the public storage symlink
// (bypassing Laravel entirely — no auth, no ownership check) and the page
// itself was reachable while logged out. Both fetch paths below now go
// through authenticated, permission-checked endpoints instead.
const url = new URL(window.location.href);
const groupId = url.searchParams.get('group');
const postId = url.searchParams.get('post');
const filePath = url.searchParams.get('file');
const infoEl = document.querySelector('.informations');
const contentEl = document.querySelector('.fill_content');

function showError(message){
    infoEl.textContent = message;
    infoEl.classList.add('text-danger');
}
function renderPreview(html){
    infoEl.textContent = filePath || '';
    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    // Scripts in the previewed HTML run in an opaque, unique origin — no
    // access to this app's cookies/DOM/session — since the content being
    // previewed is user-uploaded and would otherwise be a stored-XSS
    // vector against whoever clicks "Open" on someone else's file.
    //
    // Content goes in via srcdoc, not document.open()/write()/close() —
    // sandboxing without allow-same-origin (deliberately omitted, for the
    // reason above) makes the iframe cross-origin to this page, so
    // iframe.contentDocument is null and the write() approach can't work
    // at all. srcdoc sets the content declaratively before the frame even
    // loads, so no same-origin access is needed either way.
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = html;
    contentEl.appendChild(iframe);
}

if(!filePath){
    showError('No file specified.');
}
else if(groupId){
    const csrf = document.querySelector('meta[name="csrf-token"]').content;
    fetch('/get-code', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrf,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({group_id: groupId, file_position: filePath, raw: true}),
    })
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body}) => {
        if(!ok) throw new Error(body.message || "This file doesn't exist");
        renderPreview(body.code);
    })
    .catch(error => showError(error.message));
}
else if(postId){
    fetch(`/preview-post-code/${encodeURIComponent(filePath)}`, {headers: {'Accept': 'application/json'}})
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body}) => {
        if(!ok) throw new Error(body.message || "This file doesn't exist");
        renderPreview(body.code);
    })
    .catch(error => showError(error.message));
}
else{
    showError('Nothing to preview.');
}
