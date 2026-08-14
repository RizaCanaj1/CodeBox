let path = window.location.pathname.slice(1)[0].toUpperCase() + window.location.pathname.slice(2)
let actived = document.querySelector(`a[data-type="${path}"]`)
if(actived){
    actived.classList.add('active')
    actived.addEventListener('click', e=>{
        e.preventDefault();
    });
}
const codeBoxLogo = document.querySelector('.CodeBox')
if(codeBoxLogo){
    codeBoxLogo.addEventListener('click',()=>{
        window.location.href='dashboard'
    })
}

function escapeHtml(text){
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}
function photoUrl(path){
    return path ? `../storage/${path}` : '../assets/images/user.png'
}
function csrfToken(){
    return document.querySelector('meta[name="csrf-token"]').content
}

function loadRequests(){
    fetch('get-requests')
    .then(response=>response.json())
    .then(data=>{
        const section = document.querySelector('.requests-section')
        const list = document.querySelector('.requests-list')
        if(!data || data.length === 0){
            section.classList.add('d-none')
            list.innerHTML = ''
            return
        }
        section.classList.remove('d-none')
        document.querySelector('.requests-count').textContent = `You have ${data.length} request${data.length === 1 ? '' : 's'}`
        list.innerHTML = data.map(req => `
            <div class='friend-request' data-from-id="${req.from_user_id}">
                <img class="requested-image" src="${photoUrl(req.user_image)}" alt="user">
                <div class='friend-request-body'>
                    <h4>${escapeHtml(req.user_name)}</h4>
                    <div class='friend-request-actions'>
                        <button type="button" class="btn-accept" onclick="acceptRequest(${req.from_user_id})">Accept</button>
                        <button type="button" class="btn-refuse" onclick="declineRequest(${req.from_user_id})">Refuse</button>
                        <button type="button" class="btn-view-profile" onclick="viewProfile(${req.from_user_id})">View Profile</button>
                    </div>
                </div>
            </div>`).join('')
    })
}
function acceptRequest(fromUserId){
    fetch(`accept-friend/${fromUserId}`, {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json'}
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to accept request')
        return response.json()
    })
    .then(()=>{ loadRequests(); loadSuggestions(); })
    .catch(error=>alert(error.message))
}
function declineRequest(fromUserId){
    fetch(`decline-friend/${fromUserId}`, {
        method: 'POST',
        headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json'}
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to decline request')
        return response.json()
    })
    .then(()=>loadRequests())
    .catch(error=>alert(error.message))
}
function viewProfile(userId){
    window.location.href = `../profile?id=${userId}`
}

function loadSuggestions(){
    fetch('get-suggestions')
    .then(response=>response.json())
    .then(data=>{
        const list = document.querySelector('.suggestions-list')
        if(!data || data.length === 0){
            list.innerHTML = `<p class="empty-note">No suggestions yet — add a few friends and we'll find people you may know.</p>`
            return
        }
        list.innerHTML = data.map(person => {
            const mutualAvatars = (person.mutual_friends || []).slice(0, 3).map(m =>
                `<img class="mutual-avatar" src="${photoUrl(m.profile_photo_path)}" title="${escapeHtml(m.name)}" alt="${escapeHtml(m.name)}">`
            ).join('')
            const mutualHtml = person.mutual_count > 0
                ? `<div class="mutual-friends"><div class="mutual-avatars">${mutualAvatars}</div><span>${person.mutual_count} mutual friend${person.mutual_count === 1 ? '' : 's'}</span></div>`
                : ''
            return `<div class='suggestion-card' data-user-id="${person.id}">
                <img class="suggestion-image" src="${photoUrl(person.profile_photo_path)}" alt="user" onclick="viewProfile(${person.id})">
                <h4 onclick="viewProfile(${person.id})">${escapeHtml(person.name)}</h4>
                ${mutualHtml}
                <button type="button" class="btn-add-friend" onclick="addFriend(${person.id}, this)">Add Friend</button>
            </div>`
        }).join('')
    })
}
function addFriend(userId, btn){
    fetch(`add-friend/${userId}`)
    .then(response => response.json().then(body => ({ok: response.ok, body})))
    .then(({ok, body})=>{
        if(!ok) throw new Error(body.error || 'Failed to send request')
        btn.textContent = 'Requested'
        btn.disabled = true
    })
    .catch(error=>alert(error.message))
}

loadRequests()
loadSuggestions()
