var db;

function genTable(filters = {}) {
  let query = "SELECT * FROM links";

  let n = Object.entries(filters).reduce((c, a) => c + (a[1].length > 0), 0);
  n -= (filters.text && filters.text[0] === ""); // count of types of applied filters

  if (n) {
    query += " WHERE";

    const append = (sql) => { query += sql + (--n ? " AND " : ""); };

    const { text, types, languages, tags } = filters;

    if (text[0] !== "") {
      let txt = text[0].replaceAll("'", "''");
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

  let contents = db.exec(query);

  let table = document.querySelector("tbody");
  table.innerHTML = "";

  contents[0]?.values.forEach((link) => {
    let type = db.exec("SELECT * FROM types WHERE id = " + link[4]);

    let tags = db.exec(`SELECT tag FROM tags
                        JOIN taggings ON taggings.tagID = tags.id
                        WHERE taggings.linkID = ` + link[0]);

    let langs = db.exec("SELECT lang FROM langs WHERE linkID = " + link[0]);

    let r = table.insertRow();
    const newCell = r.insertCell.bind(r);

    let url = document.createElement("a");
    url.setAttribute("href", link[2]);
    url.innerText = link[1];
    newCell().appendChild(url);

    const token = (arr) => {
      let c = newCell();
      arr[0]?.values.forEach((x) => {
        let t = document.createElement("span");
        t.className = "token";
        t.innerText = x[0];
        c.appendChild(t);
      });
    };

    /* type */        newCell().innerText = type[0]?.values[0][1] || "";
    /* tags */        token(tags);
    /* language */    token(langs);
    /* description */ newCell().innerText = link[3];

  });
}

function filter() {
  const checked = (selector) => {
    let c = document.querySelectorAll("#filters " + selector + " input");
    return Array.from(c).filter(x => x.checked).map(x => x.value);
  };
  genTable({
    text: [ document.querySelector("#search").value.toLowerCase() ],
    types: checked("#types"),
    languages: checked("#languages"),
    tags: checked("#tags"),
  });
}

async function init() {
  const response = await fetch("https://raw.githubusercontent.com/Jorengarenar/resources/database/links.db")
  const data = await response.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${file}` });

  db = new SQL.Database(new Uint8Array(data));

  document.querySelector("#count").innerText = db.exec("SELECT COUNT(*) FROM links")[0].values[0][0];

  let filters = document.querySelector("#filters");

  const makeCheckbox = (val) => {
    let box = document.createElement("input");
    box.type = "checkbox";
    box.value = val;
    box.onclick = filter;
    return box;
  };

  const makeLi = (label, selector) => {
    filters.querySelector(selector)
      .appendChild(document.createElement("li"))
      .appendChild(label);
  };

  const mkFilters = (query, selector, col) => {
    let rows = db.exec(query);
    let languageNames = new Intl.DisplayNames(['en'], {type: 'language'});
    rows[0]?.values.forEach((row) => {
      let box = makeCheckbox(row[0]);

      let label = document.createElement("label");
      if (col == 0) {
        label.innerText = languageNames.of(row[col]);
      } else {
        label.innerText = row[col];
      }
      label.prepend(box);

      makeLi(label, selector);
    });
  }

  mkFilters("SELECT DISTINCT    * FROM types ORDER BY type COLLATE NOCASE", "#types",     1);
  mkFilters("SELECT DISTINCT lang FROM langs ORDER BY lang COLLATE NOCASE", "#languages", 0);

  let tags = db.exec("SELECT * FROM tags ORDER BY tag COLLATE NOCASE");
  if (tags[0]) {
    let tagsDiv = filters.querySelector("#tags");
    tags[0].values.forEach((tag) => {
      let box = makeCheckbox(tag[0]);
      box.id = "tag_" + tag[1];

      let label = document.createElement("label");
      label.innerText = tag[1];
      label.setAttribute("for", box.id);

      tagsDiv.appendChild(box);
      tagsDiv.appendChild(label);
    });
  }

  genTable();
}
