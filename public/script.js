const remove = document.createElement("button");
remove.className = "remove";
remove.value = "-";
function rmv(e){
    let parent = e.parent;
    
}
function add(){
    let item = document.createElement("p", document.getElementById("ingr").value);
    item.className = "ingredient";
    let div = document.createElement("div");
    div.appendChild(item);
    div.appendChild(remove);
    document.getElementById("chosen").appendChild(div);
}
document.getElementById("submit").addEventListener("click", add);