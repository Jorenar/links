let db;

function genTable() {
  const table = document.querySelector("tbody");
  table.textContent = "";

  const txt = document.querySelector("#search").value.toLowerCase();

  let query = "SELECT title, url, description FROM links"
  if (txt != "") {
    query += " WHERE (title LIKE '%" + txt + "%' OR description LIKE '%" + txt + "%')";
  }
  query += " ORDER BY title COLLATE NOCASE"

  const contents = db.exec(query);

  contents[0]?.values.forEach((link) => {
    const { [0]: title, [1]: url, [2]: desc } = link;

    const row = table.insertRow().insertCell();

    const a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    row.appendChild(a);

    descDiv = document.createElement("div");
    descDiv.className = "desc";
    descDiv.textContent = desc;
    row.appendChild(descDiv);
  });
}

async function init() {
  const response = await fetch("https://raw.githubusercontent.com/Jorengarenar/links/database/links.db");
  const data = await response.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${file}` });

  db = new SQL.Database(new Uint8Array(data));

  document.querySelector("#count").textContent = db.exec("SELECT COUNT(*) FROM links")[0].values[0][0];

  if (window.location.search) {
    document.querySelector("#search").value = window.location.search.substring(1);
  }

  genTable();
}
