// Personal API key for stocks
const POLY_KEY = 'G2LZNVxjWng0x9vORobcitWkiU6SW0A9';
let chartInstance = null;

document.addEventListener("DOMContentLoaded", function() {
  // Get a motivational quote and putt it in the UI
  const quoteBox = document.getElementById("quote");
  if (quoteBox) {
    fetch("https://zenquotes.io/api/random")
      .then(function(resp) { return resp.json(); })
      .then(function(quoteArr) {
        const quoteObj = quoteArr[0];
        quoteBox.innerText = `"${quoteObj.q}" — ${quoteObj.a}`;
      })
      .catch(function(err) {
        console.error("Failed to get quote", err);
      });
  }







  // annyang (vc)
  if (window.annyang) {
    const cmds = {
      "hello": function() {
        alert("Hey buddy!");
      },
      "change the color to *clr": function(clr) {
        document.body.style.backgroundColor = clr;
      },
      "navigate to *pg": function(pg) {
        pg = pg.toLowerCase();
        if (pg === "home") location.href = "home.html";
        else if (pg === "stocks") location.href = "stocks.html";
        else if (pg === "dogs") location.href = "dogs.html";
      },
      "lookup *stockName": function(stockName) {
        if (btnFetch) {
          const formatted = stockName.trim().toUpperCase();
          document.getElementById('tickerInput').value = formatted;
          doStockLookup(formatted, 30);
        }
      },
      "load dog breed *breed": function(breed) {
        document.querySelectorAll('#button-24 button').forEach(btn => {
          if (btn.textContent.toLowerCase() === breed.toLowerCase()) {
            btn.click();
          }
        });
      }
    };
    annyang.addCommands(cmds);
    annyang.start();
  }






  // stock checker
  const btnFetch = document.getElementById('fetchBtn');
  if (btnFetch) {
    btnFetch.addEventListener('click', function() {
      const input = document.getElementById('tickerInput');
      const daysSelect = document.getElementById('daysSelect');
      const stock = input.value.trim().toUpperCase();
      const days = parseInt(daysSelect.value, 10);
      if (stock) doStockLookup(stock, days);
    });

    getRedditStocks();
  }


function doStockLookup(sym, days=30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const fromDate = start.toISOString().slice(0, 10);
  const toDate = end.toISOString().slice(0, 10);

  const endpoint = `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/` +
    `${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50000&apiKey=${POLY_KEY}`;

  fetch(endpoint)
    .then(resp => resp.json())
    .then(data => {
      if (!data.results) throw new Error("Stock data missing for " + sym);
      const dates = data.results.map(r => new Date(r.t).toLocaleDateString());
      const prices = data.results.map(r => r.c);
      showChart(dates, prices, sym);
    })
    .catch(err => alert("Something went wrong: " + err));
}


function showChart(dates, points, label) {
  const canvas = document.getElementById('stockChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: `${label} Close`,
        data: points,
        fill: false,
        borderColor: '#007bff',
        tension: 0.1
      }]
    },
    options: {
      responsive: true
    }
  });
}


function getRedditStocks() {
  const hardcodedDate = '2022-04-03';
  fetch(`https://tradestie.com/api/v1/apps/reddit?date=${hardcodedDate}`)
    .then(resp => resp.json())
    .then(posts => {
      const topPicks = posts
        .sort((a, b) => {
          const aCount = a.no_of_comments || a.comment_count || 0;
          const bCount = b.no_of_comments || b.comment_count || 0;
          return bCount - aCount;
        })
        .slice(0, 5);

      const redditTable = document.getElementById('redditBody');
      redditTable.innerHTML = '';
      topPicks.forEach(item => {
        const commentCount = (item.no_of_comments ?? item.comment_count).toLocaleString();
        const iconImg = item.sentiment === "Bullish" ? 'bull_pic.png' : 'bear_pic.jpg';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><a href="https://finance.yahoo.com/quote/${item.ticker}" target="_blank">${item.ticker}</a></td>
          <td>${commentCount}</td>
          <td><img src="${iconImg}" class="sentiment-icon" alt="${item.sentiment}"></td>
        `;
        redditTable.appendChild(row);
      });
    })
    .catch(err => console.error("Reddit fetch broke", err));
}













// dog image gallery
const dogsDiv = document.getElementById('dogCarousel');
if (dogsDiv) {
  fetch('https://dog.ceo/api/breeds/image/random/10')
    .then(resp => resp.json())
    .then(json => {
      json.message.forEach(pic => {
        let imgTag = document.createElement('img');
        imgTag.src = pic;
        dogsDiv.appendChild(imgTag);
      });

      // don't forget this finally works dont touch
      const sliderThing = simpleslider.getSlider({
        container: dogsDiv,
        paused: true
      });

      dogsDiv.addEventListener('click', function(e) {
        const rect = dogsDiv.getBoundingClientRect();
        if ((e.clientX - rect.left) < (rect.width / 2)) {
          sliderThing.prev();
        } else {
          sliderThing.next();
        }
      });
    })
    .catch(err => console.error("Dog API fail", err));
}

// get dog breeds and make buttons
const buttonDiv = document.getElementById('button-24');
if (buttonDiv) {
  loadDogBreeds();
}
});
//try getting daru's breed into here after project submit
function loadDogBreeds() {
  fetch('https://dog.ceo/api/breeds/list/all')
    .then(resp => resp.json())
    .then(json => {
      const breeds = Object.keys(json.message).slice(0, 10);
      makeBreedButtons(breeds);
    })
    .catch(err => console.error("dog breeds fail", err));
}

function makeBreedButtons(list) {
  const div = document.getElementById('button-24');
  div.innerHTML = '';
  list.forEach(b => {
    const button = document.createElement('button');
    button.textContent = b.charAt(0).toUpperCase() + b.slice(1);
    button.className = 'button-85';
    button.addEventListener('click', () => getBreedDetails(b));
    div.appendChild(button);
  });
}
//some dogs don't show up, ask abt this
function getBreedDetails(breed) {
  fetch(`https://api.thedogapi.com/v1/breeds/search?q=${breed}`)
    .then(resp => resp.json())
    .then(arr => {
      if (arr.length > 0) displayBreedData(arr[0]);
      else console.warn("no breed found for", breed);
    })
    .catch(err => console.error("breed info error", err));
}
//same as comment abobe
function displayBreedData(breedInfo) {
  const out = document.getElementById('breed-info');
  const match = breedInfo.life_span && breedInfo.life_span.match(/(\d+)\s*-\s*(\d+)/);
  const low = match ? match[1] : 'N/A';
  const high = match ? match[2] : 'N/A';

  out.classList.remove('hidden');
  out.innerHTML = `
    <h2>${breedInfo.name}</h2>
    <p><strong>Temperament:</strong> ${breedInfo.temperament || 'Not available'}</p>
    <p><strong>Min Lifespan:</strong> ${low} years</p>
    <p><strong>Max Lifespan:</strong> ${high} years</p>
  `;
}

// audio override buttons
function turnOffAudio() {
  if (window.annyang) annyang.abort();
}
function turnOnAudio() {
  if (window.annyang) annyang.start();
}
