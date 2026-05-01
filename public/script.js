const { Chart } = require("chart.js");


let searchParams = [];
function rmv(e){
    let parent = e.parent;
    for(let i = 0; i < searchParams.length; i++){
        if(searchParams[i] == e.id){
            searchParams.delete(i);
            break;
        }
    }
    document.removeChild(parent);
}
const remove = document.createElement("button");
remove.className = "remove";
remove.textContent = "-";
remove.addEventListener('click', rmv);

const { RecipeSearchClient } = require('edamam-api');
const edamamClient = new RecipeSearchClient({
  appId: 'ef792d931d74ed83c333d2dabf55c331',
  appKey: '8b60d4fc'
});

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
document.getElementById("submit").addEventListener('click', () => {
    searchParams.push(document.getElementById('ingr').value);
    let ingLabel = document.createElement("p");
    ingLabel.textContent = document.getElementById('ingr').value;
    document.getElementById('chosen').appendChild(ingLabel);
    document.getElementById('ingr').value = "";
});
document.getElementById('search').addEventListener('click', async() => {
    let query = "";
    let ingredients = document.getElementById('chosen').children;
    for(let ing of ingredients){
        query.concat(" ", ing.textContent);
    }
    const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${query}&app_id=${APP_ID}&app_key=${APP_KEY}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Edamam-Account-User': 'JakeBiel4'
        }
    });
    const data = await response.json();
});