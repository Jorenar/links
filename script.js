var db;

function genTableRow(table, link) {
  const { [0]: id, [1]: title, [2]: url, [3]: desc, [4]: typeID } = link;

  const type = db.exec(`SELECT type FROM types WHERE id = ${typeID}`);

  const tags = db.exec(`SELECT tag FROM tags
                        JOIN taggings ON taggings.tagID = tags.id
                        WHERE taggings.linkID = ${id};`);

  const langs = db.exec(`SELECT lang FROM langs WHERE linkID = ${id};`);

  const r = table.insertRow();
  const newCell = r.insertCell.bind(r);

  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;
  newCell().appendChild(a);

  const tokenize = (tokens) => {
    const c = newCell();
    Object.keys(tokens).forEach((cl) => {
      tokens[cl][0]?.values.forEach((x) => {
        const t = document.createElement("span");
        t.className = `token ${cl}`;
        t.textContent = x[0];
        c.appendChild(t);
      });
    });
  };

  /* type + tags */ tokenize({ "type": type, "tag": tags });
  /* language */    tokenize({ "lang": langs });
  /* description */ newCell().textContent = desc;
}

function genTable(filters = {}) {
  let n = Object.entries(filters).reduce((c, a) => c + (a[1].length > 0), 0);
  n -= (filters.text && filters.text[0] === ""); // count of types of applied filters

  let query = "SELECT id, title, url, description, typeID FROM links";
  if (n) {
    query += " WHERE";

    const append = (sql) => { query += sql + (--n ? " AND " : ""); };

    const { text, types, languages, tags } = filters;

    if (text[0] !== "") {
      const txt = text[0].replaceAll("'", "''");
      append(" (title LIKE '%" + txt + "%' OR description LIKE '%" + txt + "%')");
    }

    if (types.length) {
      append(" typeID IN (" + types.join(",") + ")");
    }

    if (languages.length) {
      append(` id IN (SELECT linkID FROM langs
                      WHERE lang IN (` + languages.join(",") + "))");
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
  const checked = (selector) => {
    const c = document.querySelectorAll("#filters " + selector + " input");
    return Array.from(c).filter((x) => x.checked).map((x) => x.value);
  };
  genTable({
    text: [ document.querySelector("#search").value.toLowerCase() ],
    types: checked("#types"),
    languages: checked("#languages"),
    tags: checked("#tags"),
  });
}

async function init() {
  const response = await fetch("https://raw.githubusercontent.com/Jorengarenar/resources/database/links.db");
  const data = await response.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${file}` });

  db = new SQL.Database(new Uint8Array(data));

  document.querySelector("#count").textContent = db.exec("SELECT COUNT(*) FROM links")[0].values[0][0];

  const filters = document.querySelector("#filters");

  const makeCheckbox = (val) => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = `"${val}"`;
    box.onclick = filter;
    return box;
  };

  const makeLi = (label, selector) => {
    filters.querySelector(selector)
      .appendChild(document.createElement("li"))
      .appendChild(label);
  };

  const getRows = (s,t,o) => db.exec(`SELECT DISTINCT ${s} FROM ${t}
                                      ORDER BY ${o} COLLATE NOCASE`);

  const langs = getRows("lang", "langs", "lang");
  const ln = new Intl.DisplayNames(["en"], {type: "language"});
  langs[0]?.values?.forEach((row) => {
    const label = document.createElement("label");
    label.textContent = ln.of(row[0]);
    label.prepend(makeCheckbox(row[0]));
    makeLi(label, "#languages");
  });

  const makeTags = (rows, selector) => {
    const tagsDiv = filters.querySelector(selector);
    rows[0]?.values.forEach((t) => {
      const box = makeCheckbox(t[0]);
      box.id = t[1];

      const label = document.createElement("label");
      label.textContent = t[1];
      label.setAttribute("for", box.id);

      tagsDiv.appendChild(box);
      tagsDiv.appendChild(label);
    });
  }

  makeTags(getRows("*", "types", "type"), "#types");
  makeTags(getRows("*", "tags", "tag"), "#tags");

  if (window.location.search) {
    document.querySelector("#search").value = window.location.search.substring(1);
  }

  filter(); // generate table
}
