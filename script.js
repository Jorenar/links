var table = document.createElement("table");
var list;
var allTags = new Set();
var filterTags = [];

function genTable(firstRun) {
  table.innerHTML = "";
  let skipFilters = firstRun || filterTags.length == 0;

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

}

function filterByTags() {
  let boxes = document.querySelectorAll("ul#filters > li > label > input");
  filterTags = [];
  for (let box of boxes) {
    if (box.checked) {
      filterTags.push(box.value);
    }
  }
  genTable(0);
}

function init() {
  fetch('https://api.github.com/gists/5864eaba80491581d73ed49e9f2812a2')
    .then(response => response.json())
    .then(data => {
      list = JSON.parse(data.files["resources.json"].content);
      list = list.sort((a, b) => {
        return a["name"].toLowerCase().localeCompare(b["name"].toLowerCase());
      });

      let main = document.querySelector("main");

      let filters = document.querySelector("ul#filters");

      document.getElementById('count').innerText = list.length;

      genTable(1);

      main.appendChild(table);

      allTags = [...allTags].sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      for (let tag of allTags) {
        let box = document.createElement("input");
        box.type = "checkbox";
        box.value = tag;

        let label = document.createElement("label");
        label.innerText = tag;
        label.prepend(box);

        let li = document.createElement("li");
        li.appendChild(label);

        filters.appendChild(li);
      }

    })
}
