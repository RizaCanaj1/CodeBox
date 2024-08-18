const roles = [
    {name:'mod',permissions:[
        {permission:'code_edit',value:true},
        {permission:'role_edit',value:true}
    ]},
    {name:'member',permissions:[
        {permission:'code_edit',value:false},
        {permission:'role_edit',value:false}
    ]}
]

let showRoles = ''
roles.forEach(role=>{
showRoles+=`<div class='role'>${role.name}</div>`
})
const roles_model = (my_id,creator_id) =>{ 
    return `<div class='roles_wrapper'>
    <div class='title'>Roles</div>
        <div class='roles'>
            ${showRoles}
            <div class='add_role' onclick='handle_add_role()'><p>Add Role</p></div>
            <div class='add_role_form d-none mt-3'>
                <div class='d-flex flex-column gap-2'>
                    <input class='text-center' type='text' name='name' id='name' placeholder='Name role'/>
                    <label for='code_edit'>Code Editing</label>
                    <input class='d-none' type='checkbox' name='code_edit' id='code_edit'/>
                    <label for='role_edit'>Role Editing</label>
                    <input class='d-none' type='checkbox' name='role_edit' id='role_edit'/>
                    <div class='buttons'><button class='save' onclick='handle_new_role(event)'>Save</button></div>
                </div>
            </div>
        </div>
        
    </div>`
}
function handle_new_role(e){
    const formElement = e.target.closest('.add_role_form')
    const role_name = formElement.querySelector('input[name="name"]').value
    let permissions = []
    const permissionsElements = formElement.querySelectorAll('input:not([name="name"])')
    permissionsElements.forEach(permission=>{
        console.log(permission.checked)
        p={
            permission : permission.id ,
            value : permission.checked
        }
        permissions.push(p)
    })
    const form={
        name:role_name,
        permissions:permissions
    }
    const check_name = roles.filter(role => role.name==role_name)
    console.log(permissions,roles[0].permissions)
    console.log(check_name)
    //const check = roles.filter(role => {let p=role.permissions; return p==permissions});
    //const check_permissions = roles.filter(role => {
    //    let permissionsToCheck = [];
    //    role.permissions.forEach(p=>permissionsToCheck.push.p)
    //    return permissionsToCheck.every(permission => {
    //        return role.permissions.some(p => p.permission === permission && p.value === true);
    //    });
    //});
    //console.log(check_permissions);
    
    //console.log(check)
    if(check_name.length==0){
        const first_role =  document.querySelector('.roles .role:first-child')
        roles.push(form)
        first_role.outerHTML=`<div class='role'>${form.name}</div>${first_role.outerHTML}`
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content
        fetch(`../add-group-role/${group_id}`,{
            method:'POST',
            body: JSON.stringify(form),
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response=>response.json())
        .then(data=>console.log(data))
        .catch(error=>console.error(error))
        
    }
    else console.log('This role exists')
}
function handle_add_role(){
    document.querySelector('.add_role_form').classList.remove('d-none')
}
