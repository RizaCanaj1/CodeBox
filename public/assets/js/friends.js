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
    }
    
    console.log(data)

})