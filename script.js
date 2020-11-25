var db = {};
var tables = {};
var tablesDiv;
var allTags = new Set();
var filterTags = [];

function genTables(firstRun) {
  tablesDiv.innerHTML = "";

  for (let foo of Object.keys(db)) {
    let tableContainer = tables[foo];
    tableContainer.innerHTML = "";

    let bar = document.createElement("summary");
    bar.innerHTML = "<b>" + foo + "</b>";
    tableContainer.appendChild(bar);

    let table = document.createElement("table");
    tableContainer.appendChild(table);

    let skipFilters = firstRun || filterTags.length == 0;

    let list = db[foo];

    // Add JSON data to the table as rows
    for (let l of list) {
      if (skipFilters || filterTags.every(v => l["tags"].includes(v))) {
        let tr = table.insertRow(-1);

        let name = tr.insertCell(-1);
        let name_a = document.createElement("a");
        name_a.href = l["url"];
        name_a.innerHTML = l["name"];
        name.appendChild(name_a);
        name.className = "name";

        let lang = tr.insertCell(-1);
        lang.innerText = l["lang"];

        let tags = tr.insertCell(-1);
        if (firstRun) {
          l["tags"].forEach(allTags.add, allTags)
        }
        tags.innerText = l["tags"].sort().join(', ');
        tags.className = "tags";

        let description = tr.insertCell(-1);
        description.innerText = l["desc"];
        description.className = "desc";
      }
    }

    if (table.rows.length > 0) {
      tablesDiv.appendChild(tableContainer);
    }

  }

}

function filterByTags() {
  let boxes = document.querySelectorAll("ul#filters > li > label > input");
  filterTags = [];
  for (let box of boxes) {
    if (box.checked) {
      filterTags.push(box.value);
    }
  }
  genTables(0);
}

function init() {
  fetch('https://api.github.com/gists/5864eaba80491581d73ed49e9f2812a2')
    .then(response => response.json())
    .then(data => {
      let main = document.querySelector("main");
      let filters = document.querySelector("ul#filters");
      let count = 0;

      tablesDiv = document.querySelector("div#tables");

      let order = JSON.parse(data.files["order.json"].content);
      for (let list of Object.keys(order)) {
        tables[list] = document.createElement("details");
        db[list] = JSON.parse(data.files[order[list]].content);
        count += db[list].length;
      }

      document.getElementById('count').innerText = count;

      genTables(1);

      allTags = [...allTags].sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      for (let tag of allTags) {
        let box = document.createElement("input");
        box.type = "checkbox";
        box.value = tag;
        box.onclick = filterByTags;

        let label = document.createElement("label");
        label.innerText = tag;
        label.prepend(box);

        let li = document.createElement("li");
        li.appendChild(label);

        filters.appendChild(li);
      }

    })
}
