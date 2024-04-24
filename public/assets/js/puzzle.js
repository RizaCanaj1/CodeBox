let path = window.location.pathname.slice(1)[0].toUpperCase() +window.location.pathname.slice(2)
let actived = document.querySelector(`a[data-type="${path}"]`)
actived.classList.add('active')
actived.addEventListener('click', e=>{
    e.preventDefault();
});
document.querySelector('.CodeBox').addEventListener('click',()=>{
    window.location.href='dashboard'
})