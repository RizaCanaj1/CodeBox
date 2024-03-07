let url = new URL(window.location.href);
let post_id = url.searchParams.get('id');
let file = url.searchParams.get('file');
document.querySelector('.informations').innerHTML=`PostID:${post_id} File:${file}`
jQuery.get(`./storage/codes/${file}`,function (data){
    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    document.querySelector('.fill_content').appendChild(iframe);
    const iframeDocument = iframe.contentDocument;
    iframeDocument.open();
    iframeDocument.write(data);
    iframeDocument.close();

})
.fail(function () {
    document.querySelector('.informations').innerHTML=`Error: This file doesn't exist`
});