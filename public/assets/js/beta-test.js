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
// Group-project preview only (postId previews are a single flat file with
// no siblings to resolve) — points relative <link>/<script src>/<img> tags
// in the previewed HTML at preview_project_asset() so the page doesn't
// render unstyled/broken just because its CSS/JS live in sibling files.
// Uses a signed token (from get-code's response) rather than the raw group
// id — see PostController::makePreviewToken() for why a plain group id +
// session cookie doesn't work here (the sandboxed iframe below can't send
// cookies on its own subresource requests).
function baseHrefFor(previewToken, currentFilePath){
    const dir = currentFilePath.split('/').slice(0, -1).join('/');
    return `/preview-project-asset/${previewToken}${dir}/`;
}
// Inserts the <base> tag right inside <head> (immediately after the opening
// tag) rather than just prepending it to the whole document — prepending
// ahead of a leading <!DOCTYPE>/<html> works in principle (the parser
// relocates stray tags into an implied <head>), but real-world HTML files
// are inconsistent enough about doctype/head formatting that inserting it
// at a known-good spot is far more reliable than trusting recovery
// behavior. Falls back to prepending only if no <head> tag exists at all.
function withBaseTag(html, baseHref){
    const baseTag = `<base href="${baseHref}">`;
    const headMatch = html.match(/<head[^>]*>/i);
    if(headMatch){
        const insertAt = headMatch.index + headMatch[0].length;
        return html.slice(0, insertAt) + baseTag + html.slice(insertAt);
    }
    const htmlMatch = html.match(/<html[^>]*>/i);
    if(htmlMatch){
        const insertAt = htmlMatch.index + htmlMatch[0].length;
        return html.slice(0, insertAt) + `<head>${baseTag}</head>` + html.slice(insertAt);
    }
    return baseTag + html;
}
function renderPreview(html, baseHref){
    infoEl.textContent = filePath || '';
    const iframe = document.createElement('iframe');
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
    iframe.srcdoc = baseHref ? withBaseTag(html, baseHref) : html;
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
        renderPreview(body.code, baseHrefFor(body.preview_token, filePath));
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
