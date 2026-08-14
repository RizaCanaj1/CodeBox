// First path SEGMENT only (not the whole rest of the pathname) — using the
// whole tail here would break as soon as any nav page grows a second path
// segment (e.g. /puzzle/bug-hunter), since data-type is just "Puzzle".
let firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || ''
let path = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
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
