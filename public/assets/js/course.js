let path = window.location.pathname.slice(1)[0].toUpperCase() + window.location.pathname.slice(2)
let actived = document.querySelector(`a[data-type="${path}"]`)
if(actived){
    actived.classList.add('active')
    actived.addEventListener('click', e=>{
        e.preventDefault();
    });
}

let myRoles = []
let allTeachers = []
let allCourses = []
let myTeacherRow = null
let filterTeacherId = null
let my_id = null

function escapeHtml(text){
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}
function photoUrl(path, fallback){
    return path ? `../storage/${path}` : fallback
}
function csrfToken(){
    return document.querySelector('meta[name="csrf-token"]').content
}

fetch('get_role')
.then(response=>response.json())
.then(roleString=>{
    myRoles = (roleString || '').split(',').map(r=>r.trim()).filter(Boolean)
    if(myRoles.includes('admin')){
        document.querySelector('.btn-add-teacher').classList.remove('d-none')
    }
    renderAddCourseButton()
})

function renderAddCourseButton(){
    const canAddCourse = myRoles.includes('admin') || myRoles.includes('teacher')
    document.querySelector('.btn-add-course').classList.toggle('d-none', !canAddCourse)
}

function loadTeachersAndCourses(){
    Promise.all([
        fetch('get_teachers').then(r=>r.json()),
        fetch('get_courses').then(r=>r.json()),
    ]).then(([teachers, courses])=>{
        allTeachers = teachers
        allCourses = courses
        myTeacherRow = teachers.find(t => t.user_id == my_id) || null
        renderTeachers()
        renderCourses()
    })
}

function courseCountFor(teacherId){
    return allCourses.filter(c => c.teacher_id === teacherId).length
}

function renderTeachers(){
    const row = document.querySelector('.teachers-row')
    if(allTeachers.length === 0){
        row.innerHTML = `<p class="empty-note">No teachers yet.</p>`
        return
    }
    row.innerHTML = allTeachers.map(teacher => {
        const profileLink = teacher.user_id ? `../profile?id=${teacher.user_id}` : null
        const nameHtml = profileLink
            ? `<a href="${profileLink}">${escapeHtml(teacher.name)}</a>`
            : escapeHtml(teacher.name)
        const bio = teacher.bio ? `<p class="teacher-bio">${escapeHtml(teacher.bio)}</p>` : ''
        const count = courseCountFor(teacher.id)
        return `<div class="teacher-card">
            <img src="${photoUrl(teacher.profile_photo_path, '../assets/images/user.png')}" alt="${escapeHtml(teacher.name)}">
            <h4>${nameHtml}</h4>
            ${bio}
            <button type="button" class="teacher-courses-btn" onclick="filterByTeacher(${teacher.id}, '${escapeHtml(teacher.name).replace(/'/g, "\\'")}')">${count === 1 ? '1 course' : count + ' courses'}</button>
        </div>`
    }).join('')
}

function filterByTeacher(teacherId, teacherName){
    filterTeacherId = teacherId
    const filterBar = document.querySelector('.courses-filter')
    filterBar.classList.remove('d-none')
    filterBar.querySelector('.filter-teacher-name').textContent = teacherName
    renderCourses()
    document.querySelector('.courses-section').scrollIntoView({behavior: 'smooth', block: 'start'})
}
function clearTeacherFilter(){
    filterTeacherId = null
    document.querySelector('.courses-filter').classList.add('d-none')
    renderCourses()
}

function renderCourses(){
    const grid = document.querySelector('.courses-grid')
    const visible = filterTeacherId === null ? allCourses : allCourses.filter(c => c.teacher_id === filterTeacherId)
    if(visible.length === 0){
        grid.innerHTML = `<p class="empty-note">No courses ${filterTeacherId !== null ? 'from this teacher ' : ''}yet.</p>`
        return
    }
    grid.innerHTML = visible.map(course => {
        const canManage = myRoles.includes('admin') || (myTeacherRow && myTeacherRow.id === course.teacher_id)
        const teacherName = course.teacher ? escapeHtml(course.teacher.name) : 'Unknown teacher'
        const teacherLink = course.teacher && course.teacher.user_id ? `../profile?id=${course.teacher.user_id}` : null
        const teacherHtml = teacherLink ? `<a href="${teacherLink}">${teacherName}</a>` : teacherName
        const priceHtml = course.price != null ? `$${course.price}` : 'Free'
        const chips = [
            course.languages ? `<span class="course-chip"><i class="fa-solid fa-code"></i> ${escapeHtml(course.languages)}</span>` : '',
            course.total_hours != null ? `<span class="course-chip"><i class="fa-regular fa-clock"></i> ${course.total_hours}h total</span>` : '',
            course.schedule_days ? `<span class="course-chip"><i class="fa-regular fa-calendar"></i> ${escapeHtml(course.schedule_days)}</span>` : '',
            course.schedule_time ? `<span class="course-chip"><i class="fa-solid fa-business-time"></i> ${escapeHtml(course.schedule_time)}</span>` : '',
        ].filter(Boolean).join('')
        const actions = canManage ? `<div class="course-actions">
            <button type="button" class="course-edit-btn" onclick="openCourseForm(${course.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="course-delete-btn" onclick="deleteCourse(${course.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>` : ''
        return `<div class="course-card">
            <img src="${photoUrl(course.profile_photo_path, '../assets/images/code.png')}" alt="${escapeHtml(course.name)}">
            <div class="course-card-body">
                <div class="course-card-head">
                    <h4>${escapeHtml(course.name)}</h4>
                    <span class="course-price">${priceHtml}</span>
                </div>
                <p class="course-teacher">by ${teacherHtml}</p>
                ${course.description ? `<p class="course-description">${escapeHtml(course.description)}</p>` : ''}
                <div class="course-chips">${chips}</div>
                ${actions}
            </div>
        </div>`
    }).join('')
}

// ---------- Add Teacher (admin only) ----------
function openTeacherForm(){
    const existing = document.querySelector('.course_modal')
    if(existing) existing.remove()
    fetch('get-not-teachers').then(r=>r.json()).then(users=>{
        const modal = document.createElement('div')
        modal.className = 'course_modal'
        modal.innerHTML = `
            <div class='confirm_modal_head'><strong>Add teacher</strong></div>
            <form class='course_form' enctype="multipart/form-data">
                <label>Existing user (optional)
                    <select name="user_id">
                        <option value="">— none, just a listing —</option>
                        ${users.map(u=>`<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('')}
                    </select>
                </label>
                <label>Name <input type="text" name="name" required></label>
                <label>Bio <textarea name="bio" rows="3"></textarea></label>
                <label>Photo <input type="file" name="profile_photo_path" accept="image/*"></label>
                <div class='course_form_error'></div>
                <div class='confirm_modal_actions d-flex gap-2 justify-content-end'>
                    <button type='button' class='btn btn-secondary cancel'>Cancel</button>
                    <button type='submit' class='btn btn-success save'>Add Teacher</button>
                </div>
            </form>`
        modal.querySelector('.cancel').addEventListener('click', ()=>modal.remove())
        modal.querySelector('.course_form').addEventListener('submit', e=>{
            e.preventDefault()
            const formdata = new FormData(e.target)
            fetch('add_teacher', {
                method: 'POST',
                headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json'},
                body: formdata
            })
            .then(response => response.json().then(body => ({ok: response.ok, body})))
            .then(({ok, body})=>{
                if(!ok) throw new Error(body.error || body.message || 'Failed to add teacher')
                modal.remove()
                loadTeachersAndCourses()
            })
            .catch(error=>{ modal.querySelector('.course_form_error').textContent = error.message })
        })
        document.body.appendChild(modal)
    })
}

// ---------- Add / Edit Course ----------
function openCourseForm(courseId){
    const existing = document.querySelector('.course_modal')
    if(existing) existing.remove()
    const editing = allCourses.find(c => c.id === courseId) || null
    const isAdmin = myRoles.includes('admin')
    const teacherOptionsHtml = isAdmin
        ? `<label>Teacher
            <select name="teacher_id" required>
                ${allTeachers.map(t=>`<option value="${t.id}" ${editing && editing.teacher_id===t.id ? 'selected':''}>${escapeHtml(t.name)}</option>`).join('')}
            </select>
        </label>`
        : ''
    const modal = document.createElement('div')
    modal.className = 'course_modal'
    modal.innerHTML = `
        <div class='confirm_modal_head'><strong>${editing ? 'Edit course' : 'Add course'}</strong></div>
        <form class='course_form' enctype="multipart/form-data">
            ${teacherOptionsHtml}
            <label>Course name <input type="text" name="name" required value="${editing ? escapeHtml(editing.name) : ''}"></label>
            <label>Description <textarea name="description" rows="3">${editing ? escapeHtml(editing.description || '') : ''}</textarea></label>
            <div class='course_form_row'>
                <label>Price ($) <input type="number" name="price" min="0" max="100000" value="${editing && editing.price != null ? editing.price : ''}"></label>
                <label>Languages <input type="text" name="languages" placeholder="e.g. JS, Python" value="${editing ? escapeHtml(editing.languages || '') : ''}"></label>
            </div>
            <div class='course_form_row'>
                <label>Total hours <input type="number" name="total_hours" min="0" max="10000" value="${editing && editing.total_hours != null ? editing.total_hours : ''}"></label>
                <label>Days <input type="text" name="schedule_days" placeholder="e.g. Mon, Wed, Fri" value="${editing ? escapeHtml(editing.schedule_days || '') : ''}"></label>
            </div>
            <label>Time <input type="text" name="schedule_time" placeholder="e.g. 18:00 - 20:00" value="${editing ? escapeHtml(editing.schedule_time || '') : ''}"></label>
            ${editing ? '' : `<label>Photo <input type="file" name="profile_photo_path" accept="image/*"></label>`}
            <div class='course_form_error'></div>
            <div class='confirm_modal_actions d-flex gap-2 justify-content-end'>
                <button type='button' class='btn btn-secondary cancel'>Cancel</button>
                <button type='submit' class='btn btn-success save'>${editing ? 'Save changes' : 'Add Course'}</button>
            </div>
        </form>`
    modal.querySelector('.cancel').addEventListener('click', ()=>modal.remove())
    modal.querySelector('.course_form').addEventListener('submit', e=>{
        e.preventDefault()
        const errorEl = modal.querySelector('.course_form_error')
        if(editing){
            const fields = ['name','description','price','languages','total_hours','schedule_days','schedule_time']
            const payload = {}
            fields.forEach(f => { payload[f] = new FormData(e.target).get(f) })
            fetch(`update_course/${editing.id}`, {
                method: 'PUT',
                headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            .then(response => response.json().then(body => ({ok: response.ok, body})))
            .then(({ok, body})=>{
                if(!ok) throw new Error(body.message || 'Failed to save course')
                modal.remove()
                loadTeachersAndCourses()
            })
            .catch(error=>{ errorEl.textContent = error.message })
        } else {
            const formdata = new FormData(e.target)
            fetch('add_course', {
                method: 'POST',
                headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json'},
                body: formdata
            })
            .then(response => response.json().then(body => ({ok: response.ok, body})))
            .then(({ok, body})=>{
                if(!ok) throw new Error(body.error || body.message || 'Failed to add course')
                modal.remove()
                loadTeachersAndCourses()
            })
            .catch(error=>{ errorEl.textContent = error.message })
        }
    })
    document.body.appendChild(modal)
}
function deleteCourse(courseId){
    if(!confirm('Delete this course?')) return
    fetch(`delete_course/${courseId}`, {
        method: 'DELETE',
        headers: {'X-CSRF-TOKEN': csrfToken(), 'Accept': 'application/json'}
    })
    .then(response=>{
        if(!response.ok) throw new Error('Failed to delete course')
        return response.json()
    })
    .then(()=>loadTeachersAndCourses())
    .catch(error=>alert(error.message))
}

fetch('authid').then(r=>r.json()).then(id=>{
    my_id = id
    loadTeachersAndCourses()
})

const codeBoxLogo = document.querySelector('.CodeBox')
if(codeBoxLogo){
    codeBoxLogo.addEventListener('click',()=>{
        window.location.href='dashboard'
    })
}
