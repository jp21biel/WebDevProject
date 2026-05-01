const { Chart } = require("chart.js");


let searchParams = [];
function rmv(e){
   for(let i= 0; i< searchParams.length; i++){
    if(searchParams[i] == e.target.textContent){
        searchParams.splice(i,1);
        break;
    }
   }
    e.target.closest('p').remove();
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
        query += " " + ing.textContent;
    }
    const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${query}&app_id=ef792d931d74ed83c333d2dabf55c331&app_key=8b60d4fc`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Edamam-Account-User': 'JakeBiel4'
        }
    });
    const data = await response.json();
    const results = document.getElementById('results');
    results.innerHTML = '';

    if (data.hits && data.hits.length > 0) {
        data.hits.forEach(hit => {
            const recipe = hit.recipe;
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
            <div class="card h-100">
            <img src="${recipe.image || ''}" class="card-img-top" alt="${recipe.label}">
            <div class="card-body">
            <h5 class="card-title">${recipe.label}</h5>
            <p class="text-muted small">${Math.round(recipe.calories)} kcal</p>
            <a href="${recipe.url}" target="_blank" class="btn btn-success btn-sm">View Recipe</a>
            </div>
            </div>`;
            results.appendChild(col);
        });
        
    } else {
        results.innerHTML = '<p class="text-muted">No recipes found.</p>';
    }


});

function clearAll(){
    document.getElementById('chosen').innerHTML = '';
    searchParams = [];
}