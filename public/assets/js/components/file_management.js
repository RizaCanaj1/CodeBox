function check_projet(project_id){
    return fetch(`/get_project/${project_id}`)
    .then(response => response.json());
}
let folderBase = {}
let data = {}
let pos = ''
const warning_text = document.querySelector('.screen_wrapper .warning')
function file_model (base,key = Object.keys(base),folder = base[key],direction){
    let loading_issue = false
    if (direction === 'backwards') {
        const segments = pos.split('/');
        pos = segments.slice(0, -1).join('/');
    }
    else pos+="/"+key
    data = base
    folderBase=folder
    let back_button = (folder!=base[Object.keys(base)]?('<button class="back_button" onclick="handle_go_back(event)">...</button>'):(''))
    const folderContents = folder.contents;
    let foldersHTML = '';
    let filesHTML = '';
    for (const fileName in folderContents) {
        if (folderContents.hasOwnProperty(fileName)) {
            const fileInfo = folderContents[fileName];
            if (fileInfo.info.type === 'directory') {
                let fileIconsHTML = '';
                const maxFileIcons = 3;
                const numFileIcons = Math.min(fileInfo.file_count, maxFileIcons);
                for (let i = 0; i < numFileIcons; i++) {
                    fileIconsHTML += `<i class="fa-regular fa-file file_icon"></i>`;
                }
                foldersHTML += `
                    <div class='folder d-flex justify-content-between'>
                        <div class='name d-flex gap-2' onclick='handle_folder_open(event)'>
                            <i class="fa-solid fa-folder folder_icon"></i>
                            ${fileIconsHTML}
                            <h5>${fileName}</h5>
                        </div>
                        <div class='info d-flex gap-2'>
                            <div class='folders'><p>${fileInfo.folder_count === 1 ? '1 Folder' : (fileInfo.folder_count + ' Folders')}</p></div>
                            <div class='files'><p>${fileInfo.file_count === 1 ? '1 File' : (fileInfo.file_count + ' Files')}</p></div>
                            <div class='last_updated'>${fileInfo.info.last_updated}</div>
                        </div>
                    </div>`;
            } else {
                if(!loading_issue && fileInfo.info.size>160000) loading_issue = true
                filesHTML += `
                    <div class='file d-flex justify-content-between'>
                        <div class='name d-flex gap-2' onclick='handle_file_open(event)'>
                            <i class="fa-solid fa-file file_icon"></i>
                            <p class='extention'>${fileName.split('.')[1]}</p>
                            <p class='file_name'>${fileName}</p></div>
                        <div class='info d-flex gap-2'>
                            <div class='size'>${formatFileSize(fileInfo.info.size)}</div>
                            <div class='type'>${fileInfo.info.type}</div>
                            <div class='last_updated'>${fileInfo.info.last_updated}</div>
                        </div>
                    </div>`;
            }
        }
    }
    
    if(loading_issue){
        warning_text.innerText = 'Some files might take more time to load!'
    }
    else{
        warning_text.innerText =''
    }
    const folderElement = `
    <div class='mx-5 project_info d-flex justify-content-between'>
        <div class='folder_name d-flex justify-content-between'><h4>${back_button}${pos}</h4></div>
        <div class='d-flex gap-2'>
            <div class='folders'><p>${folder.folder_count === 1 ? '1 Folder' : folder.folder_count + ' Folders'}</p></div>
            <div class='files'><p>${folder.file_count === 1 ? '1 File' : folder.file_count + ' Files'}</p></div>
        </div>
    </div>
    <div class='project_files mx-3'>
        ${foldersHTML}
        ${filesHTML}
    </div>`;
    return folderElement
}
function handle_folder_open(event){
    const element = event.target.closest('.folder')
    const title = element.querySelector('h5')
    const file_icon = element.querySelectorAll('.file_icon')
    file_icon.forEach(icon => {
        icon.classList.remove('fa-regular')
        icon.classList.add('fa-solid')
    });
    const dir =  event.target.innerText;
    const folder = folderBase.contents[dir]
    title.outerHTML = `<h4><button class="back_button" onclick="handle_go_back(event)">...</button>${pos+'/'+title.innerHTML}</h4>`
    document.querySelectorAll('.open_folder').forEach(close_folder =>close_folder.classList.remove('open_folder'))
    element.classList.add('open_folder')
    setTimeout(()=>{
        document.querySelector(".code").innerHTML=file_model(data,dir,folder,'forwards')
    },800)
}
function handle_go_back(event){
    const dirPos = event.target.closest('h4').innerText.slice(4)
    const dirs = dirPos.split('/').slice(0, -1).slice(1)
    let folder = data[Object.keys(data)]
    dirs.forEach(mod_key=>{
        folder = folder.contents[mod_key]
    })
    document.querySelector(".code").innerHTML=file_model(data,dirs[dirs.length-1],folder,'backwards')
}
function handle_file_open(event){
    warning_text.innerText=''
    const csrf = document.querySelector('meta[name="csrf-token"]').content
    let file_name = event.target.closest('.name').querySelector('.file_name').innerText
    let group_id = (window.location.href.split('/')[window.location.href.split('/').length-1]).split(/[?#]/)[0]
    pos = pos+'/'+file_name
    const file_extention = file_name.split('.')[file_name.split('.').length-1]
    const file_data = {
        group_id:group_id,
        file_position:pos
    }
    fetch('../get-code',{
        method:'POST',
        headers: {
            'X-CSRF-TOKEN': csrf,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(file_data)
    })
    .then(resposne=>resposne.json())
    .then(data=>{
        let edit_button = ()=>{
            if(settings.creator_id==my_id)
                return `<div class='edit_button'><button onclick='edit_code()'><i class="fa-solid fa-pen"></i></button></div>`
            else return ''
        }
        document.querySelector(".code").innerHTML=`
            <div class='file_position'>
                <div>
                    <h4><button class="back_button" onclick="handle_go_back(event)">...</button>${pos}</h4>
                </div>
                    ${edit_button()}
            </div>
            <pre class='codeblock'></pre>`
        let codeblock = document.querySelector('.codeblock')
        open_code(codeblock,group_id,data.code,file_extention)
        
    })

}
function edit_code(){
    document.querySelector('.codeblock').classList.add('edit_code')
    window.onclick = (event)=>{
        var codeBlock = event.target.closest('.codeblock');
        if (codeBlock) {
            codeBlock.querySelectorAll("span[id^='line-'] span").forEach(line=>{ 
                line.setAttribute('contenteditable','true')
                line.classList.add('edit_line');
            })
        }
    }
}