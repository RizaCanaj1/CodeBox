let closest_post
let current_page = 1
let nr_of_posts = ''
let last_page = null
let my_id
fetch('../authid')
.then(response=>response.json())
.then(data=>my_id = data)
// Single-column feed now — used to split into .odd/.even wrapper divs and
// balance posts between them by height (Pinterest-style masonry), but that
// meant posts landed out of chronological order for a 1-column layout.
document.querySelector('.posts').innerHTML=''
let postUpdateInterval = null;
let hovered_post = null;
let delayTimer = null;
let currentPostId = null;
let viewed=[]
window.addEventListener('mousemove', function(event) {
    if(event.target.closest('.post')){
        closest_post = event.target.closest('.post')
        currentPostId = closest_post.className.split(' ')[0].split('-')[1];
        if(!viewed.includes(currentPostId)){
            hovered_post = closest_post;
            if(!delayTimer) delayTimer = setTimeout(countView, 8000);
        }
    }
    else{
        hovered_post = null;
        currentPostId = null;
        clearTimeout(delayTimer);
        delayTimer = null;
    }
});

function countView() {
    viewed.push(currentPostId)
    
    fetch(`count-view/${currentPostId}`)
    .catch(error=>console.log(error))
    hovered_post = null;
    currentPostId = null;
    clearTimeout(delayTimer);
    delayTimer = null;
}
let post_seed = null
function get_posts(page){
    let postsHTML = [];
    // Reuse the same random-order seed across every page of a scroll
    // session (the backend picks one on the first request and hands it
    // back) — without this, each page was an independently re-shuffled
    // order and the same post could show up on more than one page.
    let seed_param = post_seed !== null ? `&seed=${post_seed}` : ''
    fetch(`get-posts?page=${page}${seed_param}`).then(response=>response.json())
    .then(data=>{
        if(post_seed === null) post_seed = data.seed
        let from = data.from - 1
        let p = data.current_page
        nr_of_posts = data.total - data.from + 1
        last_page = data.last_page
        data = data.data
        for (let i = 0; i < data.length ; i++) {
            let post = data[i];
            let postHTML = createpost(post, i);
            postsHTML.push(postHTML);
        }
        const postsContainer = document.querySelector('.posts')
        for (let i = 0; i < data.length ; i++) {
            let post_div = document.createElement('div')
            post_div.innerHTML = postsHTML[i];
            postsContainer.appendChild(post_div)

            setTimeout(()=>{let d = document.querySelector(`.post.pid-${data[i].id}`);d.style.animation='none';d.style.opacity= '1';},3500)
            if(i==data.length-1){
                const all_posts = document.querySelectorAll('.post')
                show_emojis().then(emojis_text=>{
                    all_posts.forEach(p=>{
                        const emojis = p.querySelector(`.emojis`)
                        const emojis_btn = p.querySelector(`.emojis_btn`)
                        const emojis_wrapper = p.querySelector('.emojis_wrapper')
                        if(emojis&&emojis_btn&&emojis_wrapper){
                            emojis_btn.onclick = ()=>{
                                if (emojis_wrapper.classList.contains('show_emojis')) {emojis_wrapper.classList.remove('show_emojis');}
                                else {emojis_wrapper.classList.add('show_emojis');}
                            }
                            document.getElementById('loading_emojis').remove()
                            const input_field = p.querySelector(`.comment_input`)
                            emojis_handler(input_field,emojis_text,emojis)
                        }
                    })
                })
                .catch(error=>{
                    const emojis_wrapper = document.querySelectorAll('.emojis_wrapper')
                    emojis_wrapper.forEach(x=>{
                        x.innerHTML=`<h5 class='text-danger'>${error}</h5>`
                        x.style.overflowY = 'hidden'
                    })
                })
            }

        }
        // Wire up comments/codebox/drag/etc. for this batch of posts —
        // see wirePostInteractions() for why this is needed here at all
        // (previously nothing ever ran this for posts loaded after the
        // first page).
        wirePostInteractions();
    })
    current_page++

}

setTimeout(() => {
    window.onscroll = () => {
        if (isBottom() && current_page <= last_page) {
            get_posts(current_page);
        }
    };
}, 3500);
function isBottom() { return window.innerHeight + window.scrollY >= document.body.offsetHeight-20; }
if(window.location.pathname =='/dashboard'){
    if(last_page>current_page || current_page==1){
        get_posts(current_page) 
    }
}
else{
    let user_id = url.searchParams.get('id');
    fetch(`get-posts-from-user/${user_id}`).then(response=>response.json())
    .then(data=>{
        data = data.data
        let type_of_posts = []
        let post_selector = document.querySelector('.post-selector div')
        post_selector.innerHTML=''
        data.forEach((post,i)=>{
            document.querySelector('.posts').innerHTML+= createpost(post,i);
            if (!type_of_posts.includes(post.type)) {
                type_of_posts.push(post.type);
                let type = post.type.charAt(0).toUpperCase() + post.type.slice(1);
                post_selector.innerHTML+=`<h3 class='actived'>${type}</h3>`
            }
        })
        if(type_of_posts.length==0){
            post_selector.innerHTML+=`<h3 class='no_posts actived'>This user has no posts yet</h3>`
        }
        let post_selectors = document.querySelectorAll('.post-selector .p-selector h3')
        post_selectors.forEach(selector => {
            selector.addEventListener('click',()=>{
                let actived=document.querySelectorAll('.actived').length
                if(selector.className=='actived' && actived>1){
                    selector.classList.remove('actived')
                    document.querySelectorAll(`.p${selector.innerText.toLowerCase()}`).forEach(removePost=>{
                        removePost.style.opacity='1';
                        removePost.style.animation='removepost 1s forwards'
                        removePost.classList.add('remove-post')
                    })
                }
                else{
                    selector.classList.add('actived')
                    document.querySelectorAll(`.p${selector.innerText.toLowerCase()}`).forEach(showPost=>{
                        showPost.style.opacity='1';
                        showPost.style.animation='none'
                        showPost.classList.remove('remove-post')
                    })
                }
                if(selector.className.split(' ')[0]!='no_posts') post_selection(selector)
            })
        });
    })
}
// Closes whichever post is currently in fullscreen focus mode (there's
// only ever one — openPostFullscreen() closes any previous one before
// opening a new one) and restores the page underneath it.
function removePostFocus() {
    document.querySelectorAll('.post-focus').forEach(post => {
        post.classList.remove('post-focus', 'post-fullscreen');
    });
    const backdrop = document.getElementById('postFullscreenBackdrop');
    if (backdrop) backdrop.classList.add('d-none');
    document.body.style.overflow = '';
}

// Full-screen focus mode — same idea as the story viewer's expand button
// (see storyExpandBtn/setExpanded in stories.js): blows the post up big
// over a dark backdrop instead of just nudging it forward in the feed.
// Reuses the *same* .post DOM node (just repositioned via CSS, see
// .post.post-fullscreen in post.css) rather than cloning it into a
// separate modal, so every listener already wired to it — comments,
// codebox, carousel nav — keeps working with zero extra wiring.
function openPostFullscreen(post) {
    removePostFocus();
    post.classList.add('post-focus', 'post-fullscreen');
    const backdrop = document.getElementById('postFullscreenBackdrop');
    if (backdrop) backdrop.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
}

// Wires up everything a rendered .post needs to actually be interactive:
// comment form submission, double-click focus, "View more" focus, drag
// reordering, and the "..." settings menu. This used to be inline in a
// setTimeout() that ran exactly once, 1000ms after the page's initial
// script parse — which covered the first page of posts (loaded fast
// enough to already be in the DOM by then) but nothing loaded afterwards
// by infinite scroll, since nothing ever ran this again for later pages.
// Now called once for the initial load AND again at the end of every
// get_posts() batch. Each per-post listener is guarded with a dataset
// flag so repeat calls only wire the newly-added posts — without that,
// re-running this over the whole document would re-attach a second set of
// listeners to every already-wired post from earlier pages too.
function wirePostInteractions(){
    const posts = document.querySelectorAll('.post');
    open_code_box()
    update_comments()
    document.querySelectorAll('form.add-comment').forEach(add_comment=>{
        if (add_comment.dataset.wired) return;
        add_comment.dataset.wired = '1';
        add_comment.addEventListener('submit', function(event) {
            event.preventDefault();
            let post_id = parseInt(add_comment.getAttribute('id').split('-')[1])
            const formData = new FormData(this);
            formData.append('_token', document.querySelector('meta[name="csrf-token"]').content);
            fetch(`add-comment/${post_id}`, {
                method: 'POST',
                body: formData
            })
            .then(response =>response.json())
            .then((data) => {
                this.querySelector('input[type="text"]').value = '';
                comments.forEach(c => {if(c.className =='text-danger')c.remove()})
                fetchComments(post_id,null);
                this.querySelector('input[type="text"]').placeholder = data.message;
                setTimeout(() => {
                    this.querySelector('input[type="text"]').placeholder = '';
                }, 2000);
            })
            .catch(error => {
                console.error(error)
            });
        });
    })
    posts.forEach(post=>{
        if (post.dataset.focusWired) return;
        post.dataset.focusWired = '1';
        post.addEventListener('dblclick', () => openPostFullscreen(post))
    })
    // Same expand/compress icon-swap pattern as the story viewer's expand
    // button (see .t-toggle-light/.t-toggle-dark for the same idea) — both
    // icons are always in the DOM and CSS shows/hides them based on
    // whether .post-fullscreen is present, so the button never needs its
    // own JS-tracked open/closed state (which would drift out of sync
    // whenever the post is closed some *other* way — Escape, the
    // backdrop, or opening a different post).
    document.querySelectorAll('.post-fullscreen-btn').forEach(btn=>{
        if (btn.dataset.wired) return;
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
            const post = btn.closest('.post')
            if (post.classList.contains('post-fullscreen')) removePostFocus()
            else openPostFullscreen(post)
        })
    })
    let allPosts = document.querySelectorAll('.post')
    let move_content = ''
    allPosts.forEach(p => {
        if (p.dataset.dragWired) return;
        p.dataset.dragWired = '1';
        p.addEventListener('mouseover',e=>{
            if(e.target.className.split(' ')[0]=='draggable_post'){
                p.draggable=true
            }
            else{
                p.draggable=false
            }
        })
        p.addEventListener('dragstart',e=>{
            drag_status = true
            draggedX = e.clientY-p.getBoundingClientRect().top
            draggedY = e.clientY-p.getBoundingClientRect().top
            move_content = p.innerHTML
        })
        p.addEventListener('dragend',()=>{
            setTimeout(()=>{
                p.innerHTML = closest_post.innerHTML
                closest_post.innerHTML = move_content
                p.classList.add('update_post')
                closest_post.classList.add('update_post')
                setTimeout(()=>{
                    document.querySelectorAll('.update_post').forEach(x=>x.classList.remove('update_post'))
                    update_comments()
                    open_code_box()
                },300)

            },50)
        })
    });

    // .onclick = (assignment, not addEventListener) already replaces any
    // previous handler rather than stacking a new one, so this one's safe
    // to re-run on already-wired posts without a dataset guard.
    let post_settings = document.querySelectorAll('.post_settings')
    post_settings.forEach(btn=>{
        btn.onclick = () => {
            let p_id = btn.className.split(' ')[0]
            let s_post = document.querySelector(`.${p_id}`)
            let settings = s_post.querySelector(`.settings`)
            let hide = settings.querySelector('.hide')
            hide.onclick=()=>{
                s_post.style.opacity='1';
                s_post.style.animation='none';
                setTimeout(()=>{s_post.classList.add('opacity-0')},100)

                setTimeout(()=>{s_post.classList.add('d-none')},400)
            }
            if(!btn.className.includes('settings_opened')) {
                btn.classList.add('settings_opened')
                settings.classList.add('open')
            }
            else {
                btn.classList.remove('settings_opened')
                settings.classList.remove('open')
            }
        }
    })

    // Community post media: clicking the blurred "+N" cell jumps straight
    // into focus mode (same mechanic as double-clicking the post), and the
    // carousel's prev/next buttons step through .post-carousel-slide,
    // clamped at both ends rather than wrapping.
    document.querySelectorAll('.media-more-cell').forEach(cell => {
        if (cell.dataset.wired) return
        cell.dataset.wired = '1'
        cell.addEventListener('click', () => openPostFullscreen(cell.closest('.post')))
    })
    document.querySelectorAll('.post-carousel').forEach(carousel => {
        if (carousel.dataset.wired) return
        carousel.dataset.wired = '1'
        const track = carousel.querySelector('.post-carousel-track')
        const slides = carousel.querySelectorAll('.post-carousel-slide')
        const prevBtn = carousel.querySelector('.post-carousel-prev')
        const nextBtn = carousel.querySelector('.post-carousel-next')
        const counter = carousel.querySelector('.post-carousel-current')
        let index = 0
        const render = () => {
            track.style.transform = `translateX(-${index * 100}%)`
            counter.textContent = index + 1
            prevBtn.classList.toggle('d-none', index === 0)
            nextBtn.classList.toggle('d-none', index === slides.length - 1)
        }
        prevBtn.addEventListener('click', () => { if (index > 0) { index--; render() } })
        nextBtn.addEventListener('click', () => { if (index < slides.length - 1) { index++; render() } })
        render()
    })
}

setTimeout(()=>{
    wirePostInteractions();
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            removePostFocus();
        }
    });
    const fullscreenBackdrop = document.getElementById('postFullscreenBackdrop');
    if (fullscreenBackdrop) {
        fullscreenBackdrop.addEventListener('click', removePostFocus);
    }
},1000)

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) {
        return map[m];
    });
}
// Relative "2h"/"3d" timestamp for a post's created_at — same style as
// stories.js's timeAgo(), kept separate since posts and stories are
// unrelated features that just happen to want the same format.
function postTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
}

const POST_TYPE_LABELS = { question: 'Question', showcase: 'Showcase', invitation: 'Invitation', community: 'Community' };

// Community post media: shows up to 3 images clearly, and — if there are
// more than 3 — the 4th cell is the actual 4th image blurred with a
// "+N more" overlay (N = however many aren't shown clearly or in that
// blurred cell), same convention Instagram/Twitter use. Double-clicking
// the post (existing .post-focus mechanic, see wirePostInteractions())
// swaps this compact grid for a full carousel of every image — the
// carousel markup is rendered up front (all slides) and just hidden by
// CSS until then, rather than building it lazily on focus.
function buildMedia(post) {
    const media = post.media;
    if (media.length === 0) {
        return `<div class='pimage d-flex justify-content-center'><img src="./assets/images/laravel.png" alt="laravel"></div>`;
    }
    if (media.length === 1) {
        return `<div class='pimage d-flex justify-content-center'><img src="./storage/media/${escapeHtml(media[0])}" alt="laravel"></div>`;
    }

    const visibleCount = Math.min(3, media.length);
    const cells = media.slice(0, visibleCount).map(source =>
        `<img src="./storage/media/${escapeHtml(source)}" alt="laravel">`
    ).join('');
    const moreCount = media.length - 3;
    const moreCell = moreCount > 0
        ? `<div class="media-more-cell"><img src="./storage/media/${escapeHtml(media[3])}" alt="laravel"><span class="media-more-count">+${moreCount}</span></div>`
        : '';
    const grid = `<div class='p-mimage p-mimage-${visibleCount + (moreCount > 0 ? 1 : 0)}'>${cells}${moreCell}</div>`;

    const slides = media.map((source, idx) =>
        `<div class="post-carousel-slide${idx === 0 ? ' active' : ''}"><img src="./storage/media/${escapeHtml(source)}" alt="laravel ${idx + 1}"></div>`
    ).join('');
    const carousel = `
    <div class="post-carousel">
        <div class="post-carousel-track">${slides}</div>
        <button type="button" class="post-carousel-nav post-carousel-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
        <button type="button" class="post-carousel-nav post-carousel-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="post-carousel-counter"><span class="post-carousel-current">1</span>/${media.length}</div>
    </div>`;

    return grid + carousel;
}

function createpost(post,i){
    let comments = post.comments
    let type = post.type
    let comment_model = comment_m(comments)
    let viewsLabel = `${post.views_count} view${post.views_count == 1 ? '' : 's'}`
    let comment_form = `
    <div class='d-none comments' id="comments_id-${post.id}">
        ${comment_model}
    </div>
    <form class='add-comment d-none justify-content-between gap-2' id="fid-${post.id}">
        <input class='form-control comment_input' type="text" name='content'>
        <div class='emojis position-absolute w-100'><div class="emojis_nav position-sticky d-flex justify-content-center align-items-center"></div><div class='emojis_wrapper position-absolute w-100 pt-2 px-4'><h5 id="loading_emojis">Loading Emojis</h5></div></div><p class='emojis_btn'><i class="fa-solid fa-smile"></i></p>
        <div class='form-group d-flex justify-content-between gap-2'><div class='info-icon'><i class="fa-solid fa-info fa-lg"></i><div class='info-box'><p>Type '<|' in your comment to start a code block (easier to read/navigate code), and '|>' to close it — if you don't, it's assumed to run to the end of your comment.</p></div></div><button class='btn btn-dark'>Send</button></div>
    </form>`
    // Same .hide/.report/.block class contract wirePostInteractions() expects
    // (see post.js) — .report/.block have never had click handlers wired up
    // (pre-existing, not something this redesign changed), .hide fades the
    // post out.
    let settings_form = `<div class='settings'>
        <button type="button" class='seethrow-btn hide'><i class="fa-solid fa-eye-slash"></i> Hide</button>
        <button type="button" class='seethrow-btn report'><i class="fa-solid fa-flag"></i> Report</button>
        <button type="button" class='seethrow-btn block'><i class="fa-solid fa-ban"></i> Block</button>
    </div>`
    let typeLabel = POST_TYPE_LABELS[type] || type
    // draggable_post has to be the FIRST class on whatever the drag-handle
    // element is — wirePostInteractions()'s mouseover check does an exact
    // `className.split(' ')[0] == 'draggable_post'` match, not a
    // classList.contains(), so it can't be buried after other classes.
    let header = (window.location.pathname == '/dashboard') ? `
    <div class='post-head'>
        <img class="draggable_post post-avatar" src="${post.profile ? `./storage/${post.profile}` : './assets/images/user.png'}" alt="user">
        <div class="draggable_post post-head-meta">
            <a href="/profile?id=${post.user_id}" class="post-author">${escapeHtml(post.username)}</a>
            <span class="post-time">${postTimeAgo(post.created_at)}</span>
        </div>
        <span class="post-type-badge type-${type}">${typeLabel}</span>
        <button type="button" class='post-fullscreen-btn' aria-label="Toggle fullscreen"><i class="fa-solid fa-expand"></i><i class="fa-solid fa-compress"></i></button>
        <div class="post-settings-wrap">
            <button type="button" class='pid-${post.id} seethrow-btn post_settings' aria-label="Post settings"><i class="fa-solid fa-ellipsis-h"></i></button>
            ${settings_form}
        </div>
    </div>
    ` : `
    <div class='post-head'>
        <span class="post-type-badge type-${type}">${typeLabel}</span>
        <span class="post-time">${postTimeAgo(post.created_at)}</span>
        <button type="button" class='post-fullscreen-btn' aria-label="Toggle fullscreen"><i class="fa-solid fa-expand"></i><i class="fa-solid fa-compress"></i></button>
    </div>
    `;
    let footer = `
    <div class='post-actions'>
        <div class='post-comment-action'>
            <i class="comments_id-${post.id} fa-solid fa-comment"></i>
            <span class="counter-${post.id}">${comments.length}</span>
        </div>
        <span class='views_count'>${viewsLabel}</span>
    </div>`
    switch (type) {
        case 'question':
            return `
            <div class="pid-${post.id} post pquestion" id="${post.id}" style='--show_post_delay:${i * 0.2}s'>
                ${header}
                <div class='pdescription'>
                    <h3 class='post-title'>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                ${footer}
                ${comment_form}
            </div>`
        case 'showcase': {
            let button = (id,source) =>{return `<button class="pid-${id} source-btn" onclick="open_code(event,${id})">${source}</button>`}
            return `
            <div class="pid-${post.id} post pshowcase" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${header}
                <div class='pdescription'>
                    <h3 class='post-title'>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                <div class='d-flex justify-content-center'>
                    <button class="pid-${post.id} seethrough-btn codebox-animation"><p class="pid-${post.id}"><<span class="pid-${post.id} m_between_code"></span>/<span class="pid-${post.id} nr_of_code">${post.code.length}CodeBox</span><span class="pid-${post.id} m_between_code"></span>></p></button>
                    <p><pre class='codeblock d-none align-items-center flex-column' id="pid-${post.id}">${post.code.map(source => `${(source.split(".")[1] == 'html') ?`<div>${button(post.id,source)}<button class="pid-${post.id} test-beta" title='This feature is still in development. This works only for simple HTML files for now'> Beta Open</button></div>`:button(post.id,source)}`).join('')}</pre></p>
                </div>
                ${footer}
                ${comment_form}
            </div>`
        }
        case 'invitation':
            return `
            <div class="pid-${post.id} post pinvitation" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${header}
                <div class='pdescription'>
                    <h3 class='post-title'>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                </div>
                <div class='post-invitation-action'>
                    ${(my_id != post.user_id)?(`${(post.applied > 0 ?
                        (post.applied >= 5 && post.invitation_status == 'refused' ?
                            `<a class="p-2 bg-danger text-white rounded-3">Contact the owner for more information!</a>` :
                            (post.invitation_status == 'approved' ?
                                `<a href="/group/${post.id}" class="btn btn-secondary">Group</a>` :
                                (post.invitation_status == 'pending' ?
                                    `<a href='applications/${post.id}' class="p-2 bg-warning text-white rounded-3">Wait for response</a>` :
                                    `<a href='applications/${post.id}' class="btn btn-outline-primary">Apply</a>`
                                )
                            )
                        ) :
                        `<a href='applications/${post.id}' class="btn btn-outline-primary">Apply</a>`
                    )}`):(`<a href='applications/${post.id}' class="btn btn-outline-success">View applications</a>`)}
                </div>
            </div>`
        case 'community':
            return `
            <div class="pid-${post.id} post pcommunity" id="${post.id}" style='--show_post_delay:${i * 0.3}s'>
                ${header}
                <div class='pdescription'>
                    <h3 class='post-title'>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                    ${buildMedia(post)}
                </div>
                ${footer}
                ${comment_form}
            </div>`
        default:
            return ''
    }
}