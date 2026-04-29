const { Chart } = require("chart.js");
const remove = document.createElement("button");
remove.className = "remove";
remove.value = "-";

function statusCheck(response) {
    if (response.ok) return response;
    return response.json().then(errData => {
        const msg = errData.error || ('HTTP ' + response.status);
        throw new Error(msg);
    }).catch(() => {
        throw new Error('HTTP ' + response.status);
    });
}
function updateGraph(){
    let x = fetch('/watch/x').then(statusCheck).then(res => res.json());
    let y = fetch('/watch/y').then(statusCheck).then(res => res.json());
    let calChart = new Chart("calgraph", {
        type: "line",
        data: {
            datasets: [
                {
                    data: x
                },
                {
                    data: y
                }
            ]
        },
        options: {}
    });
}
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