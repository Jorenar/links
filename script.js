let DB;

function genTable() {
  const main = document.querySelector("main");
  main.textContent = "";

  const txt = document.querySelector("#search").value.toLowerCase();

  let query = "SELECT title, url, description FROM links";
  if (txt !== "") {
    query += " WHERE (title LIKE '%" + txt + "%' OR description LIKE '%" + txt + "%')";
  }
  query += " ORDER BY title COLLATE NOCASE";

  const contents = DB.exec(query);

  contents[0]?.values.forEach((link) => {
    const { [0]: title, [1]: url, [2]: desc } = link;

    const linkDiv = document.createElement("div");
    main.appendChild(linkDiv);

    const a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    linkDiv.appendChild(a);

    const descDiv = document.createElement("div");
    descDiv.className = "desc";
    descDiv.textContent = desc;
    linkDiv.appendChild(descDiv);
  });
}

async function init() {
  const links = await fetch("https://raw.githubusercontent.com/Jorengarenar/links/database/links.sql")
  const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${file}` });

  DB = new SQL.Database();
  DB.exec(await links.text());

  document.querySelector("#count").textContent = DB.exec("SELECT COUNT(*) FROM links")[0].values[0][0];

  if (window.location.search) {
    document.querySelector("#search").value = window.location.search.substring(1);
  }

  genTable();
}
