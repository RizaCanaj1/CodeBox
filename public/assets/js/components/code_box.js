/*
 * FIXES APPLIED (see numbered comments inline):
 * 1. Fixed implicit global variable `id` in open_code_box() (missing let/const) —
 *    this was writing to `window.id` on every click, which is exactly the kind
 *    of thing that breaks when you have more than one codebox on screen at once.
 * 2. codeblock_event() was being called once PER .codebox-animation element found
 *    on the page (inside the forEach), instead of once total — with N codeboxes
 *    on screen, every .test-beta button ended up with N duplicate click/mouseover
 *    listeners. Moved the call outside the loop.
 * 3. `.codeblock#${id}` breaks (throws) whenever id is numeric, because CSS id
 *    selectors can't start with a digit unless escaped. Switched to an attribute
 *    selector, which works regardless of the id's format.
 * 4. `if(test_beta)` on a NodeList is always truthy (even when empty) — fixed to
 *    check `.length` so the empty case is actually handled.
 * 5. `code_opened` is set but never read anywhere — left in place (something else
 *    may rely on it existing) but flagged as dead code.
 * 6. The window 'keydown' (Escape) listener was being added *inside*
 *    code_box_scroll, which runs on every single 'scroll' event — meaning every
 *    pixel of scrolling registered a brand new permanent keydown listener on
 *    window. Moved it out so it's registered exactly once per open_code() call.
 * 7. Similarly, code_box_scroll was re-registering a click listener on
 *    search_icon on every scroll tick, stacking duplicate handlers that each
 *    call remove_code() again — with multiple codeboxes this compounds fast.
 *    Removed the redundant addEventListener call; the direct remove_code()
 *    call already does the job.
 * 8. Search term was passed straight into `new RegExp(...)` — typing a
 *    regex-special character (e.g. "(", "*", "[") threw an uncaught
 *    SyntaxError and broke search entirely. Added escapeRegex() and used it
 *    everywhere a RegExp is built from user input.
 * 9. filter_lines() with an empty search term selected ALL <span> elements
 *    (including the nested content span AND the outer line span), roughly
 *    doubling the "Found X matches" count. Fixed to only count line spans.
 * 10. The "jump to match #" input used `span.parentNode` to find the line's
 *     id, but the mark_search span is nested two levels inside the line span
 *     (line span > content span > mark_search span), so `.id` was always
 *     empty and the jump silently did nothing. Fixed with `.closest(...)`.
 * 11. Large files (10k-30k+ lines) were rendered with a single `innerHTML =`
 *     assignment, which can freeze the tab for a noticeable moment. Added
 *     renderCodeInChunks() and used it for both places code gets rendered,
 *     so big files paint progressively across animation frames instead of
 *     blocking the main thread. It also now shows a small pinned "Rendering
 *     X/Y lines…" readout while a big file is still populating.
 * 12. Replaced the plain "Loading..." text with a proper skeleton (see
 *     showCodeLoadingSkeleton() and the .code-loading rules in the CSS)
 *     shown while a file is being fetched, so there's an actual loading
 *     state instead of a flash of plain text or an empty box.
 * 13. renderCodeInChunks() no longer appends chunks into the visible
 *     container (that was the visible "lines popping in one by one, chunk
 *     by chunk" lag). It now assembles the whole file off-screen across
 *     animation frames — showing a "Loading X/Y lines…" readout the whole
 *     time — and swaps the finished result into the container in one
 *     write, so the box goes straight from loading state to fully-rendered.
 * 14. Search was scanning every line on every keystroke using
 *     `line.innerText` (forces a synchronous layout flush per element) and
 *     re-binding a fresh click listener on every match every time — with
 *     10k-30k lines this could freeze the tab for seconds. Rewritten to:
 *     debounce the input (200ms), read `textContent` instead of
 *     `innerText`, process lines in chunks across animation frames (with a
 *     cancellable run id so a newer keystroke abandons a stale in-flight
 *     pass), and use one delegated click listener instead of one per match.
 * 15. The search bar/scroll button's `position: fixed` top offset was only
 *     ever recomputed on the codebox's own internal scroll — scrolling the
 *     outer page moved the box without updating them, so they'd float in
 *     the wrong spot (or a separate listener would just yank them away
 *     with `d-none` on any page scroll at all). Now recomputed on window
 *     scroll too (throttled to one rAF), and they're only hidden once the
 *     box has actually scrolled out of the viewport.
 */

// 8. Escapes regex special characters so raw user input can safely be used
//    inside `new RegExp(...)` without throwing or matching unintended patterns.
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Large files stop getting the per-line fade-in animation (see
// .code.large-file in the CSS) — animating thousands of spans at once is
// its own perf cost, so big files get one cheap container-level fade instead.
const LARGE_FILE_LINE_THRESHOLD = 2000;

// 11. Splits already-formatted code HTML (format_code() on the PHP side joins
//     lines with '<br/>') into chunks and assembles them OFF-SCREEN across
//     animation frames, then swaps the finished result into `container` in
//     a single write. Earlier this appended each chunk directly into the
//     visible container, which was itself the "lag" — the box visibly grew
//     line-by-line as chunks landed, and the browser had to reflow/paint on
//     every single chunk. Building in a detached node means none of that
//     assembly touches layout at all; only the final swap does, once.
function renderCodeInChunks(container, htmlString, chunkSize = 1000) {
    container.innerHTML = '';
    if (!htmlString) return;
    const lineChunks = htmlString.split('<br/>');
    const totalLines = lineChunks.length;

    // Loading readout shown (in the box that will hold the code) while the
    // content is assembled off-screen — nothing rendered here shows lines
    // appearing one by one, since the container stays untouched until the
    // very end.
    let progressEl = null;
    if (totalLines > 1500) {
        progressEl = document.createElement('div');
        progressEl.classList.add('code-render-progress');
        progressEl.innerHTML = `<span class="spinner"></span><span class="progress-text">Loading ${totalLines} lines…</span>`;
        container.appendChild(progressEl);
    }

    const offscreen = document.createElement('div');
    let i = 0;
    function assembleNextChunk() {
        const slice = lineChunks.slice(i, i + chunkSize);
        if (slice.length) {
            const isLastSlice = (i + chunkSize) >= totalLines;
            offscreen.insertAdjacentHTML('beforeend', slice.join('<br/>') + (isLastSlice ? '' : '<br/>'));
            i += chunkSize;
        }
        if (i < totalLines) {
            if (progressEl) {
                progressEl.querySelector('.progress-text').textContent = `Loading ${Math.min(i, totalLines)}/${totalLines} lines…`;
            }
            requestAnimationFrame(assembleNextChunk);
            return;
        }
        // Single swap-in: one reflow/paint for the whole file instead of
        // one per chunk, and the per-line reveal animation (see
        // .codeblock span[id^='line-'] in the CSS) fires for every line at
        // the same moment instead of cascading down the page as chunks land.
        container.innerHTML = '';
        container.classList.toggle('large-file', totalLines > LARGE_FILE_LINE_THRESHOLD);
        while (offscreen.firstChild) container.appendChild(offscreen.firstChild);
        container.classList.remove('code-reveal');
        void container.offsetWidth; // restart the reveal animation reliably
        container.classList.add('code-reveal');
    }
    requestAnimationFrame(assembleNextChunk);
}

// 12. Skeleton placeholder (a handful of shimmering bars) shown while a
//     file's code is being fetched, instead of plain "Loading..." text.
function showCodeLoadingSkeleton(container, lineCount = 8) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.classList.add('code-loading');
    for (let i = 0; i < lineCount; i++) {
        const line = document.createElement('div');
        line.classList.add('code-loading-line');
        // vary the width so it reads as text lines, not a stack of identical bars
        line.style.width = `${40 + Math.round(Math.random() * 50)}%`;
        wrapper.appendChild(line);
    }
    container.appendChild(wrapper);
}

// 16. open_code_box() only ever ran once, 1000ms after the dashboard's
//     initial script parse (see post.js). Posts loaded afterwards by
//     infinite scroll were never covered, so their "Open codebox" button
//     did nothing. Now called again after every batch of scrolled-in
//     posts — the dataset guard below is what makes that safe: without
//     it, re-running this over the WHOLE document would re-attach a
//     second click listener to every already-wired .codebox-animation
//     from earlier pages too, double-firing their open animation.
function open_code_box(){
    const show_code_animations = document.querySelectorAll('.codebox-animation');
    show_code_animations.forEach(show_code_animation => {
        if (show_code_animation.dataset.codeboxWired) return;
        show_code_animation.dataset.codeboxWired = '1';
        let post_id = show_code_animation.getAttribute('class').split(' ')[0]
        show_code_animation.addEventListener('click',e=>{
            show_code_animation.classList.add('btn-panimation');
            setTimeout(()=>{
                // 1. Added `let` — this was an implicit global before, which is
                //    unsafe with multiple codeboxes reusing the same click flow.
                let id=e.target.getAttribute('class').split(" ")[0];

                // 3. Attribute selector instead of `#${id}` — works even when
                //    id is purely numeric (invalid as a raw CSS id selector).
                const post_codes = document.querySelectorAll(`.codeblock[id="${id}"]`);

                show_code_animation.classList.add('d-none');
                post_codes.forEach(post_code => {
                    post_code.classList.remove('d-none');
                    post_code.classList.add('d-flex');
                });
            },1000)
        })
    });

    // 2. Moved out of the forEach above — this only needs to run once per
    //    page load, not once per .codebox-animation element found.
    codeblock_event();
}
// Shared by post.js's initial showcase-post render and this file's own
// ".../" back-button re-render below — both used to build the "Beta Open"
// button independently and had drifted apart: one used class="pid-${id}
// test-beta" (which codeblock_event()'s id-parsing expects), the other
// used class="${id} test-beta" (no prefix, so parsing it returned
// "undefined") with a stray unmatched </div>. One shared builder means
// they can't diverge again. Also fixes extension detection to use the
// LAST dot-segment (post.js's old version used [1], the second segment —
// wrong for any filename with an internal dot, e.g. "index.min.html").
function buildSourceButtons(postId, source){
    const openButton = `<button class="pid-${postId} source-btn" onclick="open_code(event,${postId})">${source}</button>`
    const ext = source.split('.').pop().toLowerCase()
    if(ext === 'html' || ext === 'htm'){
        return `<div>${openButton}<button class="pid-${postId} test-beta" title="Open a live preview"> Open</button></div>`
    }
    return openButton
}
function codeblock_event() {
    let test_beta = document.querySelectorAll('.test-beta')
    // 4. querySelectorAll always returns a NodeList (truthy even when empty),
    //    so check .length to actually skip the empty case.
    if(test_beta.length){
        test_beta.forEach(t=>{
            // 16. Same reasoning as open_code_box() above — this is now
            //     re-run for every new page of posts, so already-wired
            //     "Open" buttons from earlier pages need to be skipped.
            if (t.dataset.testBetaWired) return;
            t.dataset.testBetaWired = '1';
            t.addEventListener('click',()=>{
                let t_id=t.getAttribute('class').split(' ')[0].split('-')[1]
                let fileName = t.parentElement.children[0].innerText
                // Opens in a new tab (rather than navigating the feed away)
                // and encodes the filename — it's user-controlled at
                // upload time and can contain spaces/'&'/etc.
                window.open(`../beta-test?post=${t_id}&file=${encodeURIComponent(fileName)}`, '_blank')
            })
            t.addEventListener('mouseover',e=>{
                t.alt = ''
            })
        })
    }
}
// 5. Set but never read anywhere in this file — kept in case other code
//    depends on it, but it's currently dead state.
let code_opened = false;
function open_code(event,id,code,file_extention){
    let code_animation = true
    let sorted_counter = 0
    let search_index = 1;
    let extension;
    code_opened=true;
    
    let code_box 
    if(!event.target) code_box = event
    else code_box = event.target.closest('pre')
    let scroll_button = document.createElement('button');
    scroll_button.classList.add('scroll-button','d-none')
    scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
    scroll_button.onmouseover = function() {
        if(scroll_button.querySelectorAll('i').length == 1){
            scroll_button.innerHTML+='<br><i class="fa-solid fa-chevron-up"></i>'
            scroll_button.querySelectorAll('i').forEach(i =>{
                i.classList.add('fa-xs')
            })
        }
    }
    scroll_button.onmouseout = function(){
        scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
        scroll_button.querySelectorAll('i').forEach(i =>{
            i.classList.remove('fa-xs')
        })
    }
    scroll_button.onclick = function(){
        code_box.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    let code_bar = document.createElement('div')
    let search_icon = document.createElement('i')
    let search_bar = document.createElement('div')
    let counter = document.createElement('div')
    let show_searchbar = false
    code_bar.classList.add('code-bar')
    search_icon.classList.add('fa-solid','fa-magnifying-glass','fa-xs')
    search_bar.classList.add('d-none','code-search')
    search_bar.innerHTML='<input class="form-control" placeholder="Search"></input>'
    search_icon.addEventListener('click',()=>{
        console.log('asd')
        search_bar.style.top = `auto`
        document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
            let others_search = x.querySelector('.code-search')
            let others_scroller = x.querySelector('.scroll-button')
            remove_code(others_search,others_scroller)
        }})
        code_animation = false
        show_searchbar = !show_searchbar;
        if(search_bar.classList.contains('d-none')){
            search_bar.classList.remove('d-none')
        }
        else{
            search_bar.classList.add('d-none')
        }
    })
    // Small debounce so a full search pass doesn't run on every single
    // keystroke — typing fast used to fire the whole-file scan once per
    // character, which is most of what froze the tab on big files.
    function debounce(fn, wait) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    function filter_lines() {
        if (search_bar.querySelector('input').value === '') {
            // 9. Only count the actual line spans, not every nested span
            //    (previously this counted the outer line span AND the
            //    inner content span separately, roughly doubling the total).
            return Array.from(code_box.querySelectorAll('span[id^="line-"]'));
        }
        return Array.from(code_box.querySelectorAll('span.mark_search')).map(span => span.parentNode);
    }

    function updateSearchCounter() {
        const total = filter_lines().length;
        counter.innerHTML=`<p>Found <a>${total}</a> matches</p><div class="d-flex gap-2"><input type="number" min="1" max="${total}" class='sorted_counter'></input><p>/${total}</p></div>`
        counter.querySelector('.sorted_counter').addEventListener("keyup",e=>{
            if(e.target.value<e.target.min) e.target.value=e.target.min
            if(e.target.value>e.target.max) e.target.value=e.target.max
        })
        counter.querySelector('.sorted_counter').addEventListener("change",e=>{
            sorted_counter = e.target.value
            // 10. .closest(...) walks up to the actual id="line-N" span instead
            //     of assuming it's the immediate parent (it's two levels up),
            //     so the line number used for scrolling/id lookup is correct.
            let target_line = filter_lines()[sorted_counter-1].closest('span[id^="line-"]')
            if(!target_line) return
            code_box.scrollTop = parseInt(target_line.id.split('-')[1])*21 - 150
            code_box.querySelectorAll(`span[id^='search_']`).forEach(s => s.classList.remove('scrolled_to'));
            code_box.querySelector(`#search_${e.target.value}`).classList.add('scrolled_to');
        })
    }

    // Single delegated click listener instead of re-binding a fresh click
    // listener on every .mark_search span on every keystroke — with
    // thousands of matches that was thousands of new listeners added (and
    // discarded) per character typed.
    code_box.addEventListener('click', e => {
        const searched = e.target.closest('span[id^="search_"]')
        if (!searched) return
        sorted_counter = parseInt(searched.getAttribute('id').split('_')[1])
        const sortedInput = counter.querySelector('.sorted_counter')
        if (sortedInput) sortedInput.value = sorted_counter
        searched.classList.add('scrolled_to')
        code_box.querySelectorAll(`span[id^='search_']`).forEach(s => {if(s!=searched)s.classList.remove('scrolled_to')});
    })

    let searchRunId = 0;
    let searchProgressEl = null;

    function runSearch(rawTerm) {
        const runId = ++searchRunId;
        sorted_counter = 0
        search_index = 1

        let searchTerm = rawTerm;
        if (searchTerm.includes('&gt;')) searchTerm = searchTerm.replace(/&gt;/g, '>')
        if (searchTerm.includes('&lt;')) searchTerm = searchTerm.replace(/&lt;/g, '<')
        if (searchTerm.includes('&amp;')) searchTerm = searchTerm.replace(/&amp;/g, '&')
        if (searchTerm.includes('>')) searchTerm = searchTerm.replace(/>/g, '&gt;');
        if (searchTerm.includes('<')) searchTerm = searchTerm.replace(/</g, '&lt;');
        search_bar.querySelector('input').value = searchTerm
        const isEmpty = searchTerm === ''

        // 8. Escape searchTerm before it's ever used to build a RegExp below,
        //    so typing "(" or "*" etc. doesn't throw and kill search.
        // Hoisted out of the per-line loop below — recomputing the same
        // escape/regex for every one of 10k-30k lines was pure waste.
        const safeSearchTerm = escapeRegex(searchTerm)
        const regex = isEmpty ? null : new RegExp(safeSearchTerm, 'gi')

        function escapeSearchTerm(lineText, index) {
            let s = safeSearchTerm;
            if (s.includes('&lt;') || s.includes('&gt;')) {
                return true;
            }
            if (!s.includes('&') && !s.includes('l') && !s.includes('g') && !s.includes('t') && !s.includes(';')) {
                return true;
            }
            let x = lineText.split(new RegExp(`(${s})`)).filter(Boolean);
            let pos = lineText.search(s);
            let lPositions = getAllOccurrences(lineText, '&lt;');
            let gPositions = getAllOccurrences(lineText, '&gt;');
            if ((lPositions.length > 0 || gPositions.length > 0) && pos != -1) {
                let search_key=1
                for (let y of x) {
                    if (y === s) {
                        if(search_key == index){
                            search_key++;
                            let z = 0;
                            for (let a = 0; a < x.indexOf(y); a++) {
                                if (x[a]) {
                                    z += x[a].length;
                                }
                            }
                            if (lPositions.some(lpos => parseInt(z - lpos) >= 0 && parseInt(z - lpos) <= 3)) {
                                return false;
                            } else if (gPositions.some(gpos => parseInt(z - gpos) >= 0 && parseInt(z - gpos) <= 3)) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                }
            } else {
                return true;
            }
        }

        const lineSpans = Array.from(code_box.querySelectorAll('span[id^="line-"] span:not(.mark_search)'));
        const total = lineSpans.length;
        const CHUNK = 400;
        let i = 0;

        if (total > 1500 && !searchProgressEl) {
            searchProgressEl = document.createElement('div');
            searchProgressEl.classList.add('code-render-progress','code-search-progress');
            searchProgressEl.innerHTML = `<span class="spinner"></span><span class="progress-text">Searching…</span>`;
            search_bar.appendChild(searchProgressEl);
        }

        // Processed in chunks across animation frames instead of one long
        // synchronous loop over every line — that loop (plus a
        // layout-forcing `.innerText` read per line) is what froze the tab
        // on large files. `runId` lets a newer keystroke abandon a chunked
        // pass that's still in flight.
        function processChunk() {
            if (runId !== searchRunId) {
                if (searchProgressEl) { searchProgressEl.remove(); searchProgressEl = null }
                return
            }
            lineSpans.slice(i, i + CHUNK).forEach(line => {
                let line_search_index = 0
                // perf: textContent instead of innerText — innerText forces a
                // synchronous layout flush per element, which is ruinous when
                // done for every line on every keystroke.
                const originalText = line.textContent
                const lineText = escapeHtml(originalText)

                if (!isEmpty && lineText.includes(searchTerm)) {
                    let mark_search = lineText.replace(regex, function (match)
                    {
                        line_search_index++;
                        if(escapeSearchTerm(lineText, line_search_index)){
                            const uniqueId = `search_${search_index++}`;
                            return `<span class="mark_search" id="${uniqueId}">${match}</span>`;
                        }
                        return match
                    });
                    if(escapeSearchTerm(lineText, line_search_index)) line.classList.remove('hide-code')
                    else line.classList.add('hide-code')
                    line.innerHTML = mark_search
                }
                else {
                    if(isEmpty) line.classList.remove('hide-code')
                    else if(escapeSearchTerm(lineText, line_search_index)) line.classList.add('hide-code');
                    if (line.querySelector('.mark_search')) {
                        line.querySelectorAll('.mark_search').forEach(span => span.outerHTML = span.innerHTML);
                    }
                }
            })
            i += CHUNK;
            if (i < total) {
                if (searchProgressEl) {
                    searchProgressEl.querySelector('.progress-text').textContent = `Searching… ${Math.min(i, total)}/${total}`;
                }
                requestAnimationFrame(processChunk);
            } else {
                if (searchProgressEl) { searchProgressEl.remove(); searchProgressEl = null }
                updateSearchCounter();
            }
        }
        requestAnimationFrame(processChunk);
    }

    search_bar.querySelector('input').addEventListener('keyup', debounce(e => runSearch(e.target.value), 200))
    
    search_bar.appendChild(counter)
    code_bar.appendChild(search_icon)
    code_bar.appendChild(search_bar)
    code_box.appendChild(code_bar)
    code_box.appendChild(scroll_button)
    // 15. search_bar/scroll_button are `position: fixed` with a `top`
    //     computed from code_box.getBoundingClientRect().top, so they stay
    //     glued to the box as its OWN content scrolls. But that `top` was
    //     only ever recomputed on the box's internal 'scroll' event — so
    //     scrolling the outer page (which moves the box's position in the
    //     viewport without firing the box's own scroll event) left them
    //     glued to a stale position, floating wherever the box used to be.
    //     Pulled the positioning into its own function and now run it on
    //     window scroll too, so it recomputes wherever the box actually is.
    let code_box_scroll = ()=>{
        document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
            let others_search = x.querySelector('.code-search')
            let others_scroller = x.querySelector('.scroll-button')
            // 7. Removed the addEventListener call that used to be here — it was
            //    stacking a new click listener on search_icon every single
            //    scroll tick. The remove_code() call right below already does
            //    the actual work; no listener needs to be (re)registered here.
            if(others_search&&others_scroller) remove_code(others_search,others_scroller)
        }})

        const rect = code_box.getBoundingClientRect()
        const boxIsVisible = rect.bottom > 0 && rect.top < window.innerHeight
        if(!boxIsVisible){
            // 15. The box itself has scrolled out of the viewport (page
            //     scroll, not box-internal scroll) — hide the fixed overlays
            //     instead of leaving them floating over whatever is now on
            //     screen where the box used to be.
            search_bar.classList.add('d-none')
            scroll_button.classList.add('d-none')
            return
        }

        if(show_searchbar){
            search_bar.classList.remove('d-none')
        }
        if(code_box.scrollTop > 20){
            search_bar.style.position='fixed'
            search_bar.style.top = `${rect.top+20}px`
        }
        else{
            search_bar.style.position='absolute'
            search_bar.style.top = `auto`
        }
        if(code_box.scrollTop > 200){
            scroll_button.classList.remove('d-none')
            scroll_button.style.top = `${rect.top+230}px`
            code_box.classList.add('scrolled')
        }
        else{
            scroll_button.classList.add('d-none')
            code_box.classList.remove('scrolled')
        }
    }
    // 15. Throttled to at most once per animation frame — window 'scroll'
    //     can fire far more often than that during a fling, and with
    //     several codeboxes open each one runs this same recompute.
    let code_box_scroll_frame = null
    let scheduleCodeBoxScroll = ()=>{
        if(code_box_scroll_frame) return
        code_box_scroll_frame = requestAnimationFrame(()=>{
            code_box_scroll_frame = null
            code_box_scroll()
        })
    }
    code_box.addEventListener("scroll", scheduleCodeBoxScroll)
    window.addEventListener("scroll", scheduleCodeBoxScroll)

    // 6. Moved out of code_box_scroll — this now registers exactly once per
    //    open_code() call instead of once per scroll event. Previously,
    //    scrolling any codebox even a little would permanently stack dozens
    //    (or with a long scroll, hundreds) of duplicate window keydown
    //    listeners, each doing the same Escape-key handling again.
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if(code_box.scrollTop > 20){
                search_bar.style.position='fixed'
                search_bar.style.top = `${code_box.getBoundingClientRect().top+20}px`
            }
            else if(!show_searchbar){
                search_bar.classList.add('d-none')
            }
            else{
                search_bar.style.position='absolute'
                search_bar.style.top = `auto`
            }
            scroll_button.classList.add('d-none')
        }
    });

    if(code){
        const lines = document.createElement('div')
        lines.classList.add('code')
        code_box.appendChild(lines)
        // 11. Chunked render instead of a single innerHTML assignment.
        renderCodeInChunks(lines, code)
    }
    if(!window.location.pathname.includes('group')){
        // 12. Show the skeleton immediately so there's something on screen
        //     while this fetch is in flight, instead of a blank box.
        showCodeLoadingSkeleton(code_box)
    }
    if(!window.location.pathname.includes('group'))
    fetch('./get-code/'+event.target.innerText)
    .then(response=>response.json())
    .then(data=>{
        console.log(data)
        data=data.code
        let button = document.createElement('button')
        button.textContent = '.../'
        button.addEventListener('click', () => {
            code_animation = true
            code_opened=false
            showCodeLoadingSkeleton(code_box) // 12. was: code_box.innerHTML = 'Loading...'
            code_box.classList.add('d-flex')
            $.ajax({
                url: '/get-post-code/' + id,
                type: 'GET',
                success: function(response) {
                    code_box.innerHTML = ''
                    if (Array.isArray(response)) {
                        response.forEach(code => {
                            code_box.innerHTML += buildSourceButtons(id, code.source)
                        })

                        codeblock_event(id)
                    }
                },
                error: function(xhr, status, error) {
                    console.error(error)
                }
            });
        });
        code_box.innerHTML = ''
        code_box.classList.remove('d-flex')
        code_box.appendChild(button)
        extension = event.target.innerText.split('.')[event.target.innerText.split('.').length-1]
        code_box.appendChild(document.createTextNode(event.target.innerText))
        code_box.appendChild(document.createElement('br'));
        code_box.appendChild(code_bar)
        code_box.appendChild(scroll_button)
        const lines = document.createElement('div')
        lines.classList.add('code')
        code_box.appendChild(lines)
        // 11. Chunked render instead of a single innerHTML assignment — this is
        //     the path that matters most for the 10k-30k line case, since this
        //     is the fetched/full-file render.
        renderCodeInChunks(lines, data)
        console.log(code_bar,scroll_button)
    })
    .catch(error=>console.error(error))
    let remove_code = (searcher,scroller)=>{
        if(searcher&&scroller){
            searcher.style.top = `${code_box.getBoundingClientRect().top}px`
            scroller.style.top = `${code_box.getBoundingClientRect().top+320}px`
            searcher.classList.add('d-none')
            scroller.classList.add('d-none')
        }
    }
    // 15. Was: window.addEventListener('scroll', () => remove_code(search_bar, scroll_button))
    //     — that force-hid this box's own search bar/scroll button on every
    //     single page scroll (even a tiny one), which is the "messes up
    //     when I scroll my whole screen" behavior. Positioning them
    //     correctly on window scroll (scheduleCodeBoxScroll, registered
    //     above) replaces this — they now follow the box instead of
    //     vanishing, and only hide once the box actually leaves the
    //     viewport.
    function getAllOccurrences(str, subStr) {
        let positions = [];
        let index = str.indexOf(subStr);
        while (index !== -1) {
            positions.push(index);
            index = str.indexOf(subStr, index + 1);
        }
        return positions;
    }
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}