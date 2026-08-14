// Shared nav-bar search — loaded on every page via navigation-menu.blade.php,
// including pages that already declare their own top-level `let my_id`
// (group.js, course.js, friends.js). Deliberately does NOT declare a
// top-level `my_id` itself (that caused a real "Identifier already
// declared" SyntaxError class of bug earlier in this app's history) —
// keeps its own locally-scoped copy instead.
let searchCurrentUserId = null
fetch('/authid').then(r => r.json()).then(id => { searchCurrentUserId = id }).catch(() => {})

let startTimer = null
let searchRequestSeq = 0
let overlayEl = null
let paletteInputEl = null
let paletteResultsEl = null

// Built once, lazily, on first open — same pattern as the app's other
// dynamically-built overlays (.confirm_modal, .access_modal in
// file_management.js). Stays in the DOM after that; open/close just
// toggles animation classes.
function ensureSearchOverlay(){
    if(overlayEl) return overlayEl
    overlayEl = document.createElement('div')
    overlayEl.className = 'search_overlay'
    overlayEl.innerHTML = `
        <div class='search_palette'>
            <div class='search_palette_input_row'>
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" class="search_palette_input" placeholder="Search posts, people, courses…" autocomplete="off">
                <kbd class="search_palette_esc">Esc</kbd>
            </div>
            <div class='search_palette_results'></div>
        </div>`
    document.body.appendChild(overlayEl)
    paletteInputEl = overlayEl.querySelector('.search_palette_input')
    paletteResultsEl = overlayEl.querySelector('.search_palette_results')

    overlayEl.addEventListener('mousedown', e=>{
        if(e.target === overlayEl) closeSearchOverlay()
    })
    paletteInputEl.addEventListener('keyup', e=>{
        if(e.key === 'Escape') return
        searchUp(e)
    })
    return overlayEl
}

function openSearchOverlay(){
    const overlay = ensureSearchOverlay()
    if(overlay.classList.contains('open')){
        paletteInputEl.focus()
        return
    }
    overlay.classList.add('open')
    // Two-step class toggle so the browser paints the "just opened, not
    // yet animated" state on one frame before the transition target class
    // lands on the next — without that gap the transition has nothing to
    // animate FROM and just snaps straight to open.
    requestAnimationFrame(()=>{
        requestAnimationFrame(()=> overlay.classList.add('open-visible'))
    })
    document.body.classList.add('search-overlay-active')
    setTimeout(()=> paletteInputEl.focus(), 60)
}
function closeSearchOverlay(){
    if(!overlayEl || !overlayEl.classList.contains('open')) return
    overlayEl.classList.remove('open-visible')
    document.body.classList.remove('search-overlay-active')
    // Matches the CSS transition duration — keeps `.open` (and the overlay
    // in the DOM/visible) until the closing animation has actually finished.
    setTimeout(()=>{
        overlayEl.classList.remove('open')
        paletteInputEl.value = ''
        paletteResultsEl.innerHTML = ''
    }, 180)
}
function toggleSearchOverlay(){
    if(overlayEl && overlayEl.classList.contains('open')) closeSearchOverlay()
    else openSearchOverlay()
}

document.addEventListener('keydown', e=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault()
        toggleSearchOverlay()
    }
    else if(e.key === 'Escape' && overlayEl && overlayEl.classList.contains('open')){
        closeSearchOverlay()
    }
})

function searchUp(event){
    clearTimeout(startTimer)
    startTimer = null
    const text = event.target.value.trim()
    if(text === ''){
        paletteResultsEl.innerHTML = ''
        return
    }
    searcher(text)
}
function searcher(text){
    startTimer = setTimeout(()=> fetch_search(text), 300)
}
function fetch_search(text){
    // Absolute path — this script is shared across every page depth
    // (dashboard, a group at /group/5, applications, etc.); a relative
    // "./searched/..." would resolve against whatever page happens to be
    // open instead of always hitting the real /searched/{text} route.
    const seq = ++searchRequestSeq
    fetch(`/searched/${encodeURIComponent(text)}`)
    .then(response=>response.json())
    .then(data=>{
        // A slower, older request finishing after a newer one would
        // otherwise overwrite what's currently on screen with stale results.
        if(seq !== searchRequestSeq) return
        renderSearchResults(data, text)
    })
    .catch(error=>console.error(error))
}

function renderSearchResults(data, text){
    paletteResultsEl.innerHTML = ''
    const hasAny = (data.Posts?.length || data.Users?.length || data.Courses?.length)
    if(!hasAny){
        paletteResultsEl.innerHTML = `<p class="search_empty">No results for "${text.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}"</p>`
        return
    }
    renderResultGroup('People', data.Users || [], renderUserRow)
    renderResultGroup('Posts', data.Posts || [], renderPostRow)
    renderResultGroup('Courses', data.Courses || [], renderCourseRow)
}
function renderResultGroup(label, items, rowBuilder){
    if(items.length === 0) return
    const group = document.createElement('div')
    group.className = 'search_result_group'
    group.innerHTML = `<div class="search_result_group_label">${label}</div>`
    items.slice(0, 4).forEach(item => group.appendChild(rowBuilder(item)))
    paletteResultsEl.appendChild(group)
}

// Every row is built from a static, value-free HTML skeleton, then filled
// in via textContent — safe against XSS by construction, no manual
// escaping needed for any of the interpolated fields below.
function renderUserRow(userData){
    const row = document.createElement('a')
    row.className = 'search_result_row'
    row.href = `../profile?id=${userData.id}`
    row.innerHTML = `
        <img class="search_result_avatar" alt="">
        <span class="search_result_text">
            <span class="search_result_title"></span>
        </span>
        <span class="search_result_action"></span>`
    row.querySelector('.search_result_avatar').src = userData.profile_photo_path ? `/storage/${userData.profile_photo_path}` : '../assets/images/user.png'
    row.querySelector('.search_result_title').textContent = userData.name

    if(userData.id !== searchCurrentUserId){
        fetch(`/get-friend-status/${userData.id}`)
        .then(response=>response.json())
        .then(statusData=>{
            if(statusData.length > 0) return // already requested/friends — nothing to offer
            const actionSlot = row.querySelector('.search_result_action')
            const addBtn = document.createElement('button')
            addBtn.type = 'button'
            addBtn.className = 'search_add_friend_btn'
            addBtn.title = 'Add friend'
            addBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i>'
            addBtn.addEventListener('click', e=>{
                e.preventDefault()
                e.stopPropagation()
                fetch(`/add-friend/${userData.id}`)
                .then(response => response.json().then(body => ({ok: response.ok, body})))
                .then(({ok})=>{
                    if(ok) addBtn.outerHTML = '<span class="search_requested">Requested</span>'
                })
            })
            actionSlot.appendChild(addBtn)
        })
        .catch(()=>{})
    }
    return row
}
function renderPostRow(postData){
    // No per-post permalink page exists in this app (posts only render
    // inline in the dashboard feed) — shown as a plain row, not a link.
    const row = document.createElement('div')
    row.className = 'search_result_row search_result_row_static'
    const content = postData.content || ''
    const truncated = content.length > 90 ? content.slice(0, 90) + '…' : content
    row.innerHTML = `
        <span class="search_result_icon"><i class="fa-solid fa-file-lines"></i></span>
        <span class="search_result_text">
            <span class="search_result_title"></span>
            <span class="search_result_sub"></span>
        </span>
        <span class="search_result_meta"><i class="fa-solid fa-comment"></i></span>`
    row.querySelector('.search_result_title').textContent = postData.title
    row.querySelector('.search_result_sub').textContent = truncated
    row.querySelector('.search_result_meta').prepend(document.createTextNode(postData.nr_of_comments + ' '))
    return row
}
function renderCourseRow(courseData){
    const row = document.createElement('a')
    row.className = 'search_result_row'
    row.href = '../course'
    const price = courseData.price != null ? `$${courseData.price}` : 'Free'
    row.innerHTML = `
        <span class="search_result_icon"><i class="fa-solid fa-graduation-cap"></i></span>
        <span class="search_result_text">
            <span class="search_result_title"></span>
            <span class="search_result_sub"></span>
        </span>
        <span class="search_result_meta"></span>`
    row.querySelector('.search_result_title').textContent = courseData.name
    row.querySelector('.search_result_sub').textContent = courseData.teacher ? `by ${courseData.teacher.name}` : ''
    row.querySelector('.search_result_meta').textContent = price
    return row
}
