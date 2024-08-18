function open_code_box(){
    const show_code_animations = document.querySelectorAll('.codebox-animation');
    show_code_animations.forEach(show_code_animation => {
        let post_id = show_code_animation.getAttribute('class').split(' ')[0]
        show_code_animation.addEventListener('click',e=>{
            show_code_animation.classList.add('btn-panimation');
            setTimeout(()=>{
                id=e.target.getAttribute('class').split(" ")[0];
                const post_codes = document.querySelectorAll(`.codeblock#${id}`);
                
                show_code_animation.classList.add('d-none');
                post_codes.forEach(post_code => {
                    post_code.classList.remove('d-none');
                    post_code.classList.add('d-flex');
                });
            },1000)
        })
        codeblock_event(post_id)
    });
    
}
function codeblock_event() {
    let test_beta = document.querySelectorAll('.test-beta')
    if(test_beta){
        test_beta.forEach(t=>{
            t.addEventListener('click',()=>{
               let t_id=t.getAttribute('class').split(' ')[0].split('-')[1]
                window.location.href = `../beta-test?id=${t_id}&file=${t.parentElement.children[0].innerText}`
            })
            t.addEventListener('mouseover',e=>{
                t.alt = ''
            })
        })
    }
}
let code_opened = false;
function open_code(event,id,code,file_extention){
    let code_animation = true
    let sorted_counter = 0
    let search_index = 1;
    let extension;
    code_opened=true;
    
    let code_box 
    if(!event.target) code_box = event
    else code_box = event.target.closest('pre')
    let scroll_button = document.createElement('button');
    scroll_button.classList.add('scroll-button','d-none')
    scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
    scroll_button.onmouseover = function() {
        if(scroll_button.querySelectorAll('i').length == 1){
            scroll_button.innerHTML+='<br><i class="fa-solid fa-chevron-up"></i>'
            scroll_button.querySelectorAll('i').forEach(i =>{
                i.classList.add('fa-xs')
            })
        }
    }
    scroll_button.onmouseout = function(){
        scroll_button.innerHTML='<i class="fa-solid fa-chevron-up"></i>'
        scroll_button.querySelectorAll('i').forEach(i =>{
            i.classList.remove('fa-xs')
        })
    }
    scroll_button.onclick = function(){
        code_box.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    let code_bar = document.createElement('div')
    let search_icon = document.createElement('i')
    let search_bar = document.createElement('div')
    let counter = document.createElement('div')
    let show_searchbar = false
    code_bar.classList.add('code-bar')
    search_icon.classList.add('fa-solid','fa-magnifying-glass','fa-xs')
    search_bar.classList.add('d-none','code-search')
    search_bar.innerHTML='<input class="form-control" placeholder="Search"></input>'
    search_icon.addEventListener('click',()=>{
        console.log('asd')
        search_bar.style.top = `auto`
        document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
            let others_search = x.querySelector('.code-search')
            let others_scroller = x.querySelector('.scroll-button')
            remove_code(others_search,others_scroller)
        }})
        code_animation = false
        show_searchbar = !show_searchbar;
        if(search_bar.classList.contains('d-none')){
            search_bar.classList.remove('d-none')
        }
        else{
            search_bar.classList.add('d-none')
        }
    })
    search_bar.querySelector('input').onkeyup = e=>{
        sorted_counter = 0
        search_index=1
        let filter_lines = ()=>{
            let markSearchSpans = Array.from(code_box.querySelectorAll('span.mark_search'));
            if (e.target.value == '') {
                return Array.from(code_box.querySelectorAll('span'));
            } else {
                return markSearchSpans.map(span => span.parentNode);
            }
        }
        let searchTerm = e.target.value;

        code_box.querySelectorAll('span[id^="line-"] span:not(.mark_search)').forEach(line => {
            let line_search_index = 0
            const originalText = line.innerText
            if (searchTerm.includes('&gt;')) e.target.value = searchTerm.replace(/&gt;/g, '>')
            if (searchTerm.includes('&lt;')) e.target.value = searchTerm.replace(/&lt;/g, '<')
            if (searchTerm.includes('&amp;')) e.target.value = searchTerm.replace(/&amp;/g, '&')
            if (searchTerm.includes('>')) searchTerm = searchTerm.replace(/>/g, '&gt;');
            if (searchTerm.includes('<')) searchTerm = searchTerm.replace(/</g, '&lt;');
            
            const lineText = escapeHtml(originalText)
            let escapeSearchTerm = (index) => {
                let s = searchTerm;
                if (index > 0) {
                }
                if (s.includes('&lt;') || s.includes('&gt;')) {
                    return true;
                }
                if (!s.includes('&') && !s.includes('l') && !s.includes('g') && !s.includes('t') && !s.includes(';')) {
                    return true;
                }
                let x = lineText.split(new RegExp(`(${s})`)).filter(Boolean);
                let pos = lineText.search(s);
                let lPositions = getAllOccurrences(lineText, '&lt;');
                let gPositions = getAllOccurrences(lineText, '&gt;');
                if ((lPositions.length > 0 || gPositions.length > 0) && pos != -1) {
                    let search_key=1
                    for (let y of x) {
                        if (y === s) {
                            if(search_key == index){
                                search_key++;
                                let z = 0;
                                for (let a = 0; a < x.indexOf(y); a++) {
                                    if (x[a]) {
                                        z += x[a].length;
                                    }
                                }
                                if (lPositions.some(lpos => parseInt(z - lpos) >= 0 && parseInt(z - lpos) <= 3)) {
                                    return false;
                                } else if (gPositions.some(gpos => parseInt(z - gpos) >= 0 && parseInt(z - gpos) <= 3)) {
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        }
                    }
                } else {
                    return true;
                }
            }
            if (lineText.includes(searchTerm) && e.target.value != '') {
                let regex = new RegExp(searchTerm, 'gi')
                let mark_search = lineText.replace(regex, function (match) 
                {   
                    line_search_index++;
                    if(escapeSearchTerm(line_search_index)){
                        const uniqueId = `search_${search_index++}`;
                        return `<span class="mark_search" id="${uniqueId}">${match}</span>`;
                    }
                    return match
                });
                if(escapeSearchTerm(line_search_index)) line.classList.remove('hide-code')
                else line.classList.add('hide-code')
                line.innerHTML = mark_search
            }
            else {
                if(e.target.value == '') line.classList.remove('hide-code')
                else if(escapeSearchTerm(line_search_index)) line.classList.add('hide-code');
                line.querySelectorAll('.mark_search').forEach(span => span.outerHTML = span.innerHTML);
            }
        });
        
        counter.innerHTML=`<p>Found <a>${filter_lines().length}</a> matches</p><div class="d-flex gap-2"><input type="number" min="1" max="${filter_lines().length}" class='sorted_counter'></input><p>/${filter_lines().length}</p></div>`
        counter.querySelector('.sorted_counter').addEventListener("keyup",e=>{
            if(e.target.value<e.target.min) e.target.value=e.target.min
            if(e.target.value>e.target.max) e.target.value=e.target.max
        })
        counter.querySelector('.sorted_counter').addEventListener("change",e=>{
            sorted_counter = e.target.value
            code_box.scrollTop = parseInt(filter_lines()[sorted_counter-1].id.split('-')[1])*21 - 150
            code_box.querySelectorAll(`span[id^='search_']`).forEach(s => s.classList.remove('scrolled_to'));
            code_box.querySelector(`#search_${e.target.value}`).classList.add('scrolled_to');
            
        })
        code_box.querySelectorAll('span[id^="search_"]').forEach(searched=>{
            searched.addEventListener('click',()=>{
                sorted_counter = parseInt(searched.getAttribute('id').split('_')[1])
                counter.querySelector('.sorted_counter').value=sorted_counter
                searched.classList.add('scrolled_to')
                code_box.querySelectorAll(`span[id^='search_']`).forEach(s => {if(s!=searched)s.classList.remove('scrolled_to')});
            })
        })
    }
    
    search_bar.appendChild(counter)
    code_bar.appendChild(search_icon)
    code_bar.appendChild(search_bar)
    code_box.appendChild(code_bar)
    code_box.appendChild(scroll_button)
    let code_box_scroll = ()=>{
        document.querySelectorAll(`pre[id^='pid-']`).forEach(x=>{if(x!=code_box){
            let others_search = x.querySelector('.code-search')
            let others_scroller = x.querySelector('.scroll-button')
            search_icon.addEventListener('click',()=>{remove_code(others_search,others_scroller)})
            if(others_search&&others_scroller) remove_code(others_search,others_scroller)
        }})
        if(show_searchbar){
            search_bar.classList.remove('d-none')
        }
        if(code_box.scrollTop > 20){
            search_bar.style.position='fixed'
            search_bar.style.top = `${code_box.getBoundingClientRect().top+20}px`
        }
        else{
            search_bar.style.position='absolute'
            search_bar.style.top = `auto`
        }
        if(code_box.scrollTop > 200){   
            scroll_button.classList.remove('d-none')
            scroll_button.style.top = `${code_box.getBoundingClientRect().top+230}px`
            code_box.classList.add('scrolled')
        }
        else{
            scroll_button.classList.add('d-none')
            code_box.classList.remove('scrolled')
        }
        window.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if(code_box.scrollTop > 20){
                    search_bar.style.position='fixed'
                    search_bar.style.top = `${code_box.getBoundingClientRect().top+20}px`
                }
                else if(!show_searchbar){
                    search_bar.classList.add('d-none')
                }
                else{
                    search_bar.style.position='absolute'
                    search_bar.style.top = `auto`
                }
                scroll_button.classList.add('d-none')
            }
        });
    }
    code_box.addEventListener("scroll", code_box_scroll)
    if(code){
        const lines = document.createElement('div')
        lines.classList.add('code')
        lines.innerHTML = code
        code_box.appendChild(lines)
    }
    if(!window.location.pathname.includes('group'))
    fetch('./get-code/'+event.target.innerText)
    .then(response=>response.json())
    .then(data=>{
        console.log(data)
        data=data.code
        let button = document.createElement('button')
        button.textContent = '.../'
        button.addEventListener('click', () => {
            code_animation = true
            code_opened=false
            code_box.innerHTML = 'Loading...'
            code_box.classList.add('d-flex')
            $.ajax({
                url: '/get-post-code/' + id,
                type: 'GET',
                success: function(response) {
                    code_box.innerHTML = ''
                    if (Array.isArray(response)) {
                        response.forEach(code => {
                            let src_btn = (id,source) =>{return `<button class="pid-${id} source-btn" onclick="open_code(event,${id})">${source}</button>`}
                            let ex =code.source.split('.')[code.source.split('.').length-1]
                            if(ex == 'html'){
                                code_box.innerHTML += `${src_btn(id,code.source)}<button class="${id} test-beta">Beta Open</button></div>`
                            }
                            else{
                                code_box.innerHTML += src_btn(id,code.source)
                            }
                        })
                        
                        codeblock_event(id)
                    }
                },
                error: function(xhr, status, error) {
                    console.error(error)
                }
            });
        });
        code_box.innerHTML = ''
        code_box.classList.remove('d-flex')
        code_box.appendChild(button)
        extension = event.target.innerText.split('.')[event.target.innerText.split('.').length-1]
        code_box.appendChild(document.createTextNode(event.target.innerText))
        code_box.appendChild(document.createElement('br'));
        code_box.appendChild(code_bar)
        code_box.appendChild(scroll_button)
        const lines = document.createElement('div')
        lines.classList.add('code')
        lines.innerHTML = data
        code_box.appendChild(lines)
        console.log(code_bar,scroll_button)
    })
    .catch(error=>console.error(error))
    let remove_code = (searcher,scroller)=>{
        if(searcher&&scroller){
            searcher.style.top = `${code_box.getBoundingClientRect().top}px`
            scroller.style.top = `${code_box.getBoundingClientRect().top+320}px`
            searcher.classList.add('d-none')
            scroller.classList.add('d-none')
        }
    }
    window.addEventListener('scroll',()=>{
        remove_code(search_bar,scroll_button)
    })
    function getAllOccurrences(str, subStr) {
        let positions = [];
        let index = str.indexOf(subStr);
        while (index !== -1) {
            positions.push(index);
            index = str.indexOf(subStr, index + 1);
        }
        return positions;
    }
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}