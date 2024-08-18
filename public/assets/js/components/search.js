let startSearching = false;
let startTimer = null;
const search_results = document.querySelector('.search_results')
function searchUp(event){
    if(event.target.value == '') search_results.classList.remove('searched')
    else if(search_results.className.includes('searched')) search_results.classList.remove('loading')
    search_results.innerHTML=''
    clearTimeout(startTimer)
    startTimer = null;
    startSearching = true
    if(event.target.value !=''){searcher(event.target.value)}
}
function searcher(text){
    startTimer = setTimeout(()=>{
        startSearching = false
        search_results.classList.remove('loading')
        search_results.classList.add('searched')
        fetch_search(text)
    },1500)
}
function fetch_search(text){
    fetch(`./searched/${text}`)
    .then(response=>response.json())
    .then(data=>{
        console.log(data)
        const s_wrapper = document.createElement('div')
        s_wrapper.classList.add('s_wrapper')
        const users = document.createElement('div')
        users.innerHTML="<h3>Users</h3>"
        users.classList.add('users')
        const posts = document.createElement('div')
        posts.innerHTML="<h3>Posts</h3>"
        posts.classList.add('s_posts')
        s_wrapper.appendChild(posts)
        s_wrapper.appendChild(users)
        search_results.appendChild(s_wrapper)
        searchUsers(data.Users.slice(0, 3),users)
        searchPosts(data.Posts.slice(0, 3),posts)
    })
    .catch(error=>console.error(error))
}
function searchPosts(postsData,posts){
    const posts_wrapper = document.createElement('div')
    posts_wrapper.classList.add('p_wrapper')
    postsData.forEach(postData => {
        const post = document.createElement('div')
        post.classList.add('s_post')
        let views = ()=>{
            if(postData.nr_of_views==1) return `${postData.nr_of_views} view`
            if(postData.nr_of_views>0) return `${postData.nr_of_views} views`
            return `${postData.nr_of_views} views`
        }
        const truncatedContent = postData.content.length > 10 
        ? postData.content.slice(0, 10) + "..." 
        : postData.content;
        post.innerHTML = `
            <div class='p_primary'>
                <h5>${postData.title}</h5>
                <p>${truncatedContent}</p>
            </div>
            <div class='p_secondary d-flex gap-4 align-items-center'>
                <p>${postData.nr_of_comments}</p>
                <i class="fa-solid fa-comment fa-lg pb-3"></i>
                <p>${views()}</p>
            </div>
        `;
        posts_wrapper.appendChild(post)
    });
    posts.appendChild(posts_wrapper)
}
function searchUsers (usersData,users){
    const users_wrapper = document.createElement('div')
    users_wrapper.classList.add('u_wrapper')
    let friendship = ''
    usersData.forEach(userData => {
        fetch(`get-friend-status/${userData.id}`)
        .then(response=>response.json())
        .then(data=>{
            if(my_id == userData.id){
                friendship = ``
            }
            else if(data.length>0){
                if(data[0].status =='no_respond'){
                }
            }
            else{
                friendship =`
                <button class='btn btn-primary'><i class="fa-solid fa-user-plus"></i></button>
                <button class='text-warning'><i class="fa-solid fa-triangle-exclamation"></i></button>`
            }
            const user = document.createElement('div')
            user.classList.add('user')
            let img_source = userData.profile_photo_path
            if(img_source){
                img_source=`./storage/${img_source}`
            }
            else {
                img_source='../assets/images/user.png'
            }
            user.innerHTML = `<a href='../profile?id=${userData.id}'><h5>${userData.name}</h5><img class='searched_image' src="${img_source}"></img></a>
            <div class='friendship_button d-flex justify-content-around mt-2'>
                ${friendship}
            </div>`
            users_wrapper.appendChild(user)
        })
    });
    users.appendChild(users_wrapper)
}