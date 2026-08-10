// Stories bar + fullscreen viewer (dashboard.blade.php only). Replaces the
// old "click a card, it grows in place" hack — this is a proper Instagram-
// style overlay: locks page scroll while open, auto-advances through a
// user's stories with a timed progress bar, and only closes on the X
// button (or Escape) so scrolling/clicking posts behind it isn't possible
// mid-story.
if (document.getElementById('storiesBar')) {

const IMAGE_DURATION_MS = 5000;

const storiesBar = document.getElementById('storiesBar');
const addStoryCard = document.getElementById('addStoryCard');
const storyFileInput = document.getElementById('story');
const addStoryBtn = document.getElementById('addStoryBtn');

const storyViewer = document.getElementById('storyViewer');
const storyStage = storyViewer.querySelector('.story-viewer-stage');
const storyViewerMedia = document.getElementById('storyViewerMedia');
const storyProgress = document.getElementById('storyProgress');
const storyViewerAvatar = document.getElementById('storyViewerAvatar');
const storyViewerUsername = document.getElementById('storyViewerUsername');
const storyViewerTime = document.getElementById('storyViewerTime');
const storyHighlightBtn = document.getElementById('storyHighlightBtn');
const storyExpandBtn = document.getElementById('storyExpandBtn');
const storyViewersPanel = document.getElementById('storyViewersPanel');
const storyViewersCount = document.getElementById('storyViewersCount');
const storyCloseBtn = document.getElementById('storyCloseBtn');
const storyPrevBtn = document.getElementById('storyPrevBtn');
const storyNextBtn = document.getElementById('storyNextBtn');
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

let storiesData = { own: null, others: [] };
let activeGroups = [];
let groupIndex = 0;
let storyIndex = 0;
let segFills = [];
let segAdvanceTimer = null;
let segState = null; // { fillEl, remainingMs, startedAt }
let paused = false;
let currentVideoEl = null;
let expanded = false; // "expand to fit image" toggle — see updateStageSize()
let currentMediaNatural = { w: 0, h: 0 };
// Bumped every showStory() call. An <img>/<video> removed from the DOM
// (via storyViewerMedia.innerHTML = '') keeps loading in the background —
// browsers don't cancel that just because the element was detached — so
// its 'load'/'timeupdate'/'ended' handlers can still fire well after the
// user has navigated to a different story. Each handler captures the
// token that was current when IT was created and bails if it no longer
// matches, instead of animating/advancing a segment that isn't even being
// watched anymore.
let renderToken = 0;

function loadStories() {
    fetch('get-stories')
        .then(r => r.json())
        .then(data => {
            storiesData = data;
            renderBar();
        })
        .catch(err => console.error(err));
}

function renderBar() {
    storiesBar.querySelectorAll('.story-ring').forEach(el => el.remove());

    activeGroups = [];
    if (storiesData.own) activeGroups.push(storiesData.own);
    (storiesData.others || []).forEach(g => activeGroups.push(g));

    if (storiesData.own) {
        addStoryCard.insertAdjacentElement('afterend', buildRing(storiesData.own, true));
    }
    (storiesData.others || []).forEach(group => {
        storiesBar.appendChild(buildRing(group, false));
    });
}

function buildRing(group, isOwn) {
    const ring = document.createElement('div');
    ring.className = 'story-ring' + (group.all_viewed ? ' seen' : '');
    ring.dataset.userId = group.user_id;
    const avatarSrc = group.profile ? `./storage/${group.profile}` : './assets/images/user.png';
    ring.innerHTML = `
        <div class="story-ring-avatar"><img src="${avatarSrc}" alt="${escapeHtml(group.username)}"></div>
        <span class="story-ring-name">${escapeHtml(isOwn ? 'Your story' : group.username)}</span>
    `;
    ring.addEventListener('click', () => {
        const idx = activeGroups.findIndex(g => g.user_id === group.user_id);
        if (idx === -1) return;
        openViewer(idx, firstUnseenIndex(activeGroups[idx]));
    });
    return ring;
}

function firstUnseenIndex(group) {
    const idx = group.stories.findIndex(s => !s.viewed);
    return idx === -1 ? 0 : idx;
}

// ---------- upload ----------
if (storyFileInput) {
    addStoryBtn?.addEventListener('click', () => storyFileInput.click());
    storyFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) uploadStory(file);
    });
}

function uploadStory(file) {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('_token', csrfToken);
    if (addStoryBtn) addStoryBtn.textContent = 'Uploading…';
    fetch('add-story', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (addStoryBtn) addStoryBtn.textContent = 'Add your story';
            if (data.error) {
                if (addStoryBtn) {
                    const original = addStoryBtn.textContent;
                    addStoryBtn.textContent = data.error;
                    setTimeout(() => { addStoryBtn.textContent = 'Add your story'; }, 2500);
                }
                return;
            }
            loadStories();
        })
        .catch(err => {
            console.error(err);
            if (addStoryBtn) addStoryBtn.textContent = 'Add your story';
        });
}

// ---------- viewer ----------
function openViewer(gIdx, sIdx) {
    if (gIdx < 0 || gIdx >= activeGroups.length) return;
    groupIndex = gIdx;
    storyIndex = sIdx || 0;
    storyViewer.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
    buildProgressBars();
    showStory();
}

function closeViewer() {
    storyViewer.classList.add('d-none');
    document.body.style.overflow = '';
    clearTimeout(segAdvanceTimer);
    if (currentVideoEl) currentVideoEl.pause();
    currentVideoEl = null;
    segState = null;
    storyViewerMedia.innerHTML = '';
    setExpanded(false); // fresh state next time the viewer opens
    // picks up any highlight toggles / freshly-seen rings from this session
    loadStories();
}

// "Expand to fit image" — resizes .story-viewer-stage to the current
// media's actual aspect ratio (up to most of the viewport) instead of the
// fixed portrait frame, so a wide/landscape story isn't letterboxed down
// to a sliver. Recomputed on toggle, on every new story (each may have a
// different aspect ratio), and on window resize while it's active.
function setExpanded(value) {
    expanded = value;
    storyExpandBtn.classList.toggle('active', expanded);
    storyExpandBtn.innerHTML = expanded ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
    storyExpandBtn.title = expanded ? 'Back to story view' : 'Expand to fit image';
    updateStageSize();
}

function updateStageSize() {
    if (!expanded || !currentMediaNatural.w || !currentMediaNatural.h) {
        storyStage.style.width = '';
        storyStage.style.height = '';
        return;
    }
    const maxW = window.innerWidth * 0.96;
    const maxH = window.innerHeight * 0.92;
    const ratio = currentMediaNatural.w / currentMediaNatural.h;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
        h = maxH;
        w = h * ratio;
    }
    storyStage.style.width = `${Math.round(w)}px`;
    storyStage.style.height = `${Math.round(h)}px`;
}

storyExpandBtn.addEventListener('click', () => setExpanded(!expanded));
window.addEventListener('resize', () => { if (expanded) updateStageSize(); });

function buildProgressBars() {
    const group = activeGroups[groupIndex];
    storyProgress.innerHTML = group.stories
        .map(() => `<div class="story-progress-seg"><div class="story-progress-seg-fill"></div></div>`)
        .join('');
    segFills = Array.from(storyProgress.querySelectorAll('.story-progress-seg'));
}

function showStory() {
    renderToken++;
    const myToken = renderToken;
    const group = activeGroups[groupIndex];
    const story = group.stories[storyIndex];
    clearTimeout(segAdvanceTimer);
    paused = false;
    segState = null;

    segFills.forEach((seg, i) => {
        const fill = seg.querySelector('.story-progress-seg-fill');
        fill.style.transition = 'none';
        if (i < storyIndex) {
            seg.classList.add('done');
            fill.style.width = '100%';
        } else {
            seg.classList.remove('done');
            fill.style.width = '0%';
        }
    });

    storyViewerAvatar.src = group.profile ? `./storage/${group.profile}` : './assets/images/user.png';
    storyViewerUsername.textContent = group.is_own ? 'Your story' : group.username;
    storyViewerTime.textContent = timeAgo(story.created_at);

    storyHighlightBtn.classList.toggle('d-none', !group.is_own);
    setHighlightIcon(story.is_highlight);

    storyViewersPanel.classList.toggle('d-none', !group.is_own);
    storyViewersCount.textContent = story.views_count ?? 0;

    storyPrevBtn.classList.toggle('d-none', groupIndex === 0 && storyIndex === 0);

    // Explicitly stop the outgoing video rather than just detaching it —
    // removing it from the DOM doesn't reliably stop playback/audio right
    // away in every browser.
    if (currentVideoEl) currentVideoEl.pause();
    storyViewerMedia.innerHTML = '';
    currentVideoEl = null;
    currentMediaNatural = { w: 0, h: 0 };
    updateStageSize(); // falls back to the fixed frame until the new media reports its own size
    const src = `./storage/stories/${story.source}`;
    const fillEl = segFills[storyIndex].querySelector('.story-progress-seg-fill');

    if (story.type === 'video') {
        const video = document.createElement('video');
        video.src = src;
        video.autoplay = true;
        video.playsInline = true;
        video.addEventListener('loadedmetadata', () => {
            if (myToken !== renderToken) return;
            currentMediaNatural = { w: video.videoWidth, h: video.videoHeight };
            updateStageSize();
        });
        video.addEventListener('timeupdate', () => {
            if (myToken !== renderToken || !video.duration || paused) return;
            fillEl.style.transition = 'none';
            fillEl.style.width = `${(video.currentTime / video.duration) * 100}%`;
        });
        video.addEventListener('ended', () => {
            if (myToken !== renderToken) return;
            nextStory();
        });
        storyViewerMedia.appendChild(video);
        currentVideoEl = video;
    } else {
        const img = document.createElement('img');
        img.src = src;
        img.alt = story.caption || '';
        storyViewerMedia.appendChild(img);
        img.addEventListener('load', () => {
            if (myToken !== renderToken) return;
            currentMediaNatural = { w: img.naturalWidth, h: img.naturalHeight };
            updateStageSize();
            playImageSegment(fillEl, IMAGE_DURATION_MS);
        }, { once: true });
    }

    if (story.caption) {
        const cap = document.createElement('div');
        cap.className = 'story-viewer-caption';
        cap.textContent = story.caption;
        storyViewerMedia.appendChild(cap);
    }

    markViewed(story.id);
}

function setHighlightIcon(isHighlight) {
    storyHighlightBtn.classList.toggle('active', !!isHighlight);
    storyHighlightBtn.innerHTML = isHighlight ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

function playImageSegment(fillEl, ms) {
    const myToken = renderToken;
    segState = { fillEl, remainingMs: ms, startedAt: Date.now() };
    fillEl.style.transition = 'none';
    fillEl.style.width = '0%';
    void fillEl.offsetWidth; // force reflow so the transition below actually animates from 0%
    requestAnimationFrame(() => {
        // Belt-and-suspenders: showStory() is what normally prevents this
        // (see pointerup's reordering above for the specific race this
        // closed), but any future caller of playImageSegment() gets the
        // same protection against applying a transition for a story
        // that's no longer the one being shown.
        if (myToken !== renderToken) return;
        fillEl.style.transition = `width ${ms}ms linear`;
        fillEl.style.width = '100%';
    });
    segAdvanceTimer = setTimeout(nextStory, ms);
}

function pauseStory() {
    if (paused) return;
    paused = true;
    if (currentVideoEl) {
        currentVideoEl.pause();
        return;
    }
    if (!segState) return;
    clearTimeout(segAdvanceTimer);
    const elapsed = Date.now() - segState.startedAt;
    segState.remainingMs = Math.max(0, segState.remainingMs - elapsed);
    const computedWidth = getComputedStyle(segState.fillEl).width;
    segState.fillEl.style.transition = 'none';
    segState.fillEl.style.width = computedWidth;
}

function resumeStory() {
    if (!paused) return;
    paused = false;
    if (currentVideoEl) {
        currentVideoEl.play();
        return;
    }
    if (!segState) return;
    if (segState.remainingMs <= 0) {
        nextStory();
        return;
    }
    segState.startedAt = Date.now();
    const fillEl = segState.fillEl;
    const remaining = segState.remainingMs;
    const myToken = renderToken;
    requestAnimationFrame(() => {
        if (myToken !== renderToken) return;
        fillEl.style.transition = `width ${remaining}ms linear`;
        fillEl.style.width = '100%';
    });
    segAdvanceTimer = setTimeout(nextStory, remaining);
}

function nextStory() {
    const group = activeGroups[groupIndex];
    if (storyIndex < group.stories.length - 1) {
        storyIndex++;
        showStory();
    } else if (groupIndex < activeGroups.length - 1) {
        groupIndex++;
        storyIndex = 0;
        buildProgressBars();
        showStory();
    } else {
        closeViewer();
    }
}

function prevStory() {
    if (storyIndex > 0) {
        storyIndex--;
        showStory();
    } else if (groupIndex > 0) {
        groupIndex--;
        storyIndex = activeGroups[groupIndex].stories.length - 1;
        buildProgressBars();
        showStory();
    } else {
        showStory(); // already at the very first story — just restart it
    }
}

function markViewed(storyId) {
    fetch(`view-story/${storyId}`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken },
    })
        .then(r => r.json())
        .then(() => {
            const group = activeGroups[groupIndex];
            const story = group.stories.find(s => s.id === storyId);
            if (story) story.viewed = true;
        })
        .catch(err => console.error(err));
}

storyHighlightBtn.addEventListener('click', () => {
    const group = activeGroups[groupIndex];
    const story = group.stories[storyIndex];
    fetch(`toggle-story-highlight/${story.id}`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken },
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                story.is_highlight = data.is_highlight;
                setHighlightIcon(story.is_highlight);
            }
        })
        .catch(err => console.error(err));
});

storyCloseBtn.addEventListener('click', closeViewer);
storyPrevBtn.addEventListener('click', prevStory);
storyNextBtn.addEventListener('click', nextStory);

window.addEventListener('keydown', e => {
    if (storyViewer.classList.contains('d-none')) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowLeft') prevStory();
    else if (e.key === 'ArrowRight') nextStory();
});

// Hold-to-pause (press and hold anywhere on the story to freeze it) + tap
// zones for prev/next — a "tap" is a press-and-release under 250ms so a
// deliberate hold-to-read doesn't also trigger navigation on release.
let pointerDownAt = 0;
storyStage.addEventListener('pointerdown', e => {
    if (e.target.closest('.story-close-btn, .story-highlight-btn, .story-nav-btn')) return;
    pointerDownAt = Date.now();
    pauseStory();
});
storyStage.addEventListener('pointerup', e => {
    if (e.target.closest('.story-close-btn, .story-highlight-btn, .story-nav-btn')) return;
    // Check for tap-navigation BEFORE resuming — resumeStory() schedules a
    // requestAnimationFrame that applies on the *next* paint, not
    // synchronously. Calling it right before prevStory()/nextStory() meant
    // that rAF could still fire after showStory() had already reset
    // everything for the new story, re-starting the OLD story's progress
    // bar animation on top of the new one. Skipping resumeStory() entirely
    // when we're about to navigate away avoids scheduling that callback at
    // all, instead of trying to race it.
    if (Date.now() - pointerDownAt < 250) {
        if (e.target.closest('#storyTapPrev')) { prevStory(); return; }
        if (e.target.closest('#storyTapNext')) { nextStory(); return; }
    }
    resumeStory();
});

function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

loadStories();

}
