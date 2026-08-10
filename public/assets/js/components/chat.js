// Floating chat widget (dashboard.blade.php only). "Live" here means
// polling — the same pattern this app already uses for live-updating
// comments (see startCommentFetch() in comments.js, every 3s) — rather
// than a websocket push. No new server infrastructure needed, and it's
// close enough to instant for a chat widget: messages land within a
// couple seconds. A true push-based version (Laravel Reverb) is a
// reasonable follow-up if this needs to feel snappier later.
if (document.getElementById('chatWidget')) {

const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatPanel = document.getElementById('chatPanel');
const chatBackBtn = document.getElementById('chatBackBtn');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatPanelTitle = document.getElementById('chatPanelTitle');
const chatConversations = document.getElementById('chatConversations');
const chatThread = document.getElementById('chatThread');
const chatMessages = document.getElementById('chatMessages');
const chatInputForm = document.getElementById('chatInputForm');
const chatInput = document.getElementById('chatInput');
const chatUnreadBadge = document.getElementById('chatUnreadBadge');
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

let panelOpen = false;
let activeFriendId = null;
let conversationsCache = [];
let messagePollTimer = null;

function loadConversations() {
    fetch('get-conversations')
        .then(r => r.json())
        .then(data => {
            conversationsCache = data;
            renderConversations();
            updateUnreadBadge();
        })
        .catch(err => console.error(err));
}

function updateUnreadBadge() {
    const total = conversationsCache.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    chatUnreadBadge.textContent = total > 9 ? '9+' : String(total);
    chatUnreadBadge.classList.toggle('d-none', total === 0);
}

function renderConversations() {
    if (activeFriendId !== null) return; // a thread is open — don't clobber it
    if (conversationsCache.length === 0) {
        chatConversations.innerHTML = '';
        return;
    }
    chatConversations.innerHTML = conversationsCache.map(c => `
        <div class="chat-conversation${c.unread_count > 0 ? ' unread' : ''}" data-user-id="${c.user_id}">
            <img class="chat-conversation-avatar" src="${c.profile ? `./storage/${c.profile}` : './assets/images/user.png'}" alt="">
            <div class="chat-conversation-meta">
                <div class="chat-conversation-name">${escapeHtml(c.username)}</div>
                <div class="chat-conversation-preview">${c.last_message ? escapeHtml(c.last_message) : 'Say hello!'}</div>
            </div>
            ${c.unread_count > 0 ? `<span class="chat-conversation-dot"></span>` : ''}
        </div>
    `).join('');
    chatConversations.querySelectorAll('.chat-conversation').forEach(el => {
        el.addEventListener('click', () => openThread(Number(el.dataset.userId)));
    });
}

function openThread(friendId) {
    activeFriendId = friendId;
    const convo = conversationsCache.find(c => c.user_id === friendId);
    chatPanelTitle.textContent = convo ? convo.username : 'Chat';
    chatBackBtn.classList.remove('d-none');
    chatConversations.classList.add('d-none');
    chatThread.classList.remove('d-none');
    chatMessages.innerHTML = '';
    loadMessages(true);
    clearInterval(messagePollTimer);
    messagePollTimer = setInterval(() => loadMessages(false), 3000);
    chatInput.focus();
}

function closeThread() {
    activeFriendId = null;
    clearInterval(messagePollTimer);
    chatBackBtn.classList.add('d-none');
    chatThread.classList.add('d-none');
    chatConversations.classList.remove('d-none');
    loadConversations();
}

function loadMessages(scrollToBottom) {
    const forFriendId = activeFriendId;
    if (forFriendId === null) return;
    fetch(`get-messages/${forFriendId}`)
        .then(r => r.json())
        .then(data => {
            if (activeFriendId !== forFriendId) return; // switched/closed while this was in flight
            renderMessages(data);
            if (scrollToBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(err => console.error(err));
}

function renderMessages(messages) {
    const wasNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 40;
    chatMessages.innerHTML = messages.map(m => `
        <div class="chat-bubble ${m.sender_id === activeFriendId ? 'theirs' : 'mine'}">${escapeHtml(m.content)}</div>
    `).join('');
    if (wasNearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatToggleBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    chatPanel.classList.toggle('d-none', !panelOpen);
    if (panelOpen) {
        loadConversations();
    } else {
        closeThread();
    }
});
chatCloseBtn.addEventListener('click', () => {
    panelOpen = false;
    chatPanel.classList.add('d-none');
    closeThread();
});
chatBackBtn.addEventListener('click', closeThread);

chatInputForm.addEventListener('submit', e => {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (!content || activeFriendId === null) return;
    chatInput.value = '';
    fetch(`send-message/${activeFriendId}`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    })
        .then(r => r.json())
        .then(() => loadMessages(true))
        .catch(err => console.error(err));
});

// Keeps the floating badge current even while the panel is closed, and
// refreshes the conversation list while it's open on the list view.
loadConversations();
setInterval(loadConversations, 8000);

}
