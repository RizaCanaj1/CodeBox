let path = window.location.pathname.slice(1)[0].toUpperCase() +window.location.pathname.slice(2)
let actived = document.querySelector(`a[data-type="${path}"]`)
let requests = document.querySelector('.requests')
actived.classList.add('active')
actived.addEventListener('click', e=>{
    e.preventDefault();
});
document.querySelector('.CodeBox').addEventListener('click',()=>{
    window.location.href='dashboard'
})
fetch('get-requests')
.then(response=>response.json())
.then(data=>{
    if(data.length>0){
        requests.querySelector('.requests-notification').innerHTML+=`<p>You have ${data.length} request${(data.length==1)?(''):('s')}</p>`
        requests.innerHTML+=`
        <h2>Requests:</h2>
            <div class='requests-list'>
        </div>  `
        let requests_list = requests.querySelector('.requests-list')
        data.forEach(req => {
            console.log(req)
            requests_list.innerHTML += `
            <div class='card friend-request'>
                <h4 class='text-center mt-3'>${req.user_name}</h4>
                <div class='d-flex justify-content-around'>
                    <div class="card-body">
                        <img class="requested-image rounded-circle"src="${req.user_image ? `./storage/${req.user_image}` : './assets/images/user.png'}" alt="user">
                    </div>
                    <div class="card-text mt-5">
                        <div class='d-flex gap-3'>
                            <button class="btn btn-success">Accept</button>
                            <button class="btn btn-danger">Refuse</button>
                        </div>
                        <button class="btn btn-primary mt-3">View Profile</button>
                    </div>
                </div>
            </div>`
        });
    }
    
    console.log(data)

})