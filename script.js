var db;

function genTableRow(table, link) {
  const { [0]: id, [1]: title, [2]: url, [3]: desc } = link;

  const row = table.insertRow().insertCell();

  // the link
  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;
  row.appendChild(a);

  // description
  if (desc) {
    descDiv = document.createElement("div");
    descDiv.className = "desc";
    descDiv.textContent = desc;
    row.appendChild(descDiv);
  }

  // tags
  const tags = db.exec(`SELECT tag FROM tags
                        JOIN taggings ON taggings.tagID = tags.id
                        WHERE taggings.linkID = ${id};`);

  const tagsDiv = document.createElement("span");
  tagsDiv.className = "tags";
  tags[0]?.values.forEach((x) => {
    const t = document.createElement("span");
    t.textContent = x[0];
    tagsDiv.appendChild(t);
  });
  row.prepend(tagsDiv);
}

function genTable(filters = {}) {
  let n = Object.entries(filters).reduce((c, a) => c + (a[1].length > 0), 0);
  n -= (filters.text && filters.text[0] === ""); // count of types of applied filters

  let query = "SELECT id, title, url, description, typeID FROM links";
  if (n) {
    query += " WHERE";

    const append = (sql) => { query += sql + (--n ? " AND " : ""); };

    const { text, tags } = filters;

    if (text[0] !== "") {
      const txt = text[0].replaceAll("'", "''");
      append(" (title LIKE '%" + txt + "%' OR description LIKE '%" + txt + "%')");
    }

    if (tags.length) {
      append(` id IN (SELECT linkID FROM taggings
                      WHERE tagID IN (` + tags.join(",") + `)
                      GROUP BY linkID
                      HAVING(COUNT(*) >= ` + tags.length + "))");
    }
  }
  query += " ORDER BY title COLLATE NOCASE";

  const contents = db.exec(query);

  const table = document.querySelector("tbody");
  table.textContent = "";

  contents[0]?.values.forEach((l) => genTableRow(table, l));
}

function filter() {
  genTable({
    text: [ document.querySelector("#search").value.toLowerCase() ],
    tags: Array.from(document.querySelectorAll("#tagFilters input")).filter((x) => x.checked).map((x) => x.value)
  });
}

async function init() {
  const response = await fetch("https://raw.githubusercontent.com/Jorengarenar/resources/database/links.db");
  const data = await response.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${file}` });

  db = new SQL.Database(new Uint8Array(data));

  document.querySelector("#count").textContent = db.exec("SELECT COUNT(*) FROM links")[0].values[0][0];


  const makeCheckbox = (val) => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = `"${val}"`;
    box.onclick = filter;
    return box;
  };

  const tags = db.exec(`SELECT DISTINCT * FROM tags ORDER BY tag COLLATE NOCASE`);

  const tagsDiv = document.querySelector("#tagFilters");
  tags[0]?.values.forEach((t) => {
    const box = makeCheckbox(t[0]);
    box.id = t[1];

    const label = document.createElement("label");
    label.textContent = t[1];
    label.setAttribute("for", box.id);

    tagsDiv.appendChild(box);
    tagsDiv.appendChild(label);
  });

  if (window.location.search) {
    document.querySelector("#search").value = window.location.search.substring(1);
  }

  filter(); // generate table
}
