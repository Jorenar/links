var db;

function genTable(filters = {}) {
  let query = "SELECT * FROM links"

  let n = Object.entries(filters).reduce((c, a) => c + (a[1].length > 0), 0);
  n -= (filters.text && filters.text[0] == "");

  if (n) {
    query += " WHERE";

    const append = (sql) => { query += sql + (--n ? " AND " : "") };

    if (filters.text[0] != "") {
      let text = filters.text[0].replaceAll("'", "''");
      append(" (title LIKE '%" + text + "%' OR description LIKE '%" + text + "%')");
    }

    if (filters.types.length) {
      append(" typeID IN (" + filters.types.join(',') + ")");
    }

    if (filters.languages.length) {
      append(` id IN (SELECT linkID FROM langs
                      WHERE lang IN (` + filters.languages.join(',') + `))`);
    }

    if (filters.tags.length) {
      append(` id IN (SELECT linkID FROM taggings
                      WHERE tagID IN (` + filters.tags.join(',') + `)
                      GROUP BY linkID
                      HAVING(COUNT(*) >= ` + filters.tags.length + `))`);
    }
  }
  query += " ORDER BY title COLLATE NOCASE";

  let contents = db.exec(query);

  let table = document.querySelector("tbody");
  table.innerHTML = "";

  if (!contents[0]) {
    return;
  }

  contents[0].values.forEach((link) => {
    let type = db.exec("SELECT * FROM types WHERE id = " + link[4]);

    let tags = db.exec(`SELECT tag FROM tags
                        JOIN taggings ON taggings.tagID = tags.id
                        WHERE taggings.linkID = ` + link[0]);

    let langs = db.exec("SELECT lang FROM langs WHERE linkID = " + link[0]);

    let r = table.insertRow();
    let row = r.insertCell.bind(r);

    let url = document.createElement("a");
    url.setAttribute("href", link[2]);
    url.innerText = link[1];
    row().appendChild(url);

    /* type */        row().innerText = type[0]  ? type[0].values[0][1] : "";
    /* tags */        row().innerText = tags[0]  ? tags[0].values.map(x => x[0]).join(", ") : "";
    /* language */    row().innerText = langs[0] ? langs[0].values.map(x => x[0]).join(", ") : "";
    /* description */ row().innerText = link[3];

  });
}

function filter() {
  const checked = (selector) => {
    let bar = document.querySelectorAll("#filters " + selector + " input");
    return Array.from(bar).filter(x => x.checked).map(x => x.value);
  };
  genTable({
    text: [ document.querySelector('#search').value.toLowerCase() ],
    types: checked("#types"),
    languages: checked("#languages"),
    tags: checked("#tags"),
  });
}

function init() {
  fetch("https://raw.githubusercontent.com/Jorengarenar/resources/database/links.db")
    .then((response) => response.arrayBuffer())
    .then((data) => {
      initSqlJs({ locateFile: file => `dist/${file}` }).then((SQL) => {
        db = new SQL.Database(new Uint8Array(data));

        document.querySelector("#count").innerText = db.exec("SELECT COUNT(*) FROM links")[0].values[0][0];

        let filters = document.querySelector("#filters");

        const makeCheckbox = (val) => {
          let box = document.createElement("input");
          box.type = "checkbox";
          box.value = val;
          box.onclick = filter;
          return box;
        }

        const makeLi = (label, selector) => {
          let li = document.createElement("li");
          li.appendChild(label);
          filters.querySelector(selector).appendChild(li);
        }

        let types = db.exec("SELECT * FROM types ORDER BY type COLLATE NOCASE");
        if (types[0]) {
          types[0].values.forEach((type) => {
            let box = makeCheckbox(type[0]);

            let label = document.createElement("label");
            label.innerText = type[1];
            label.prepend(box);

            makeLi(label, "#types");
          });
        }

        let languages = db.exec("SELECT DISTINCT lang FROM langs ORDER BY lang COLLATE NOCASE");
        if (languages[0]) {
          languages[0].values.forEach((lang) => {
            let box = makeCheckbox('"' + lang[0] + '"');

            let label = document.createElement("label");
            label.innerText = lang[0];
            label.prepend(box);

            makeLi(label, "#languages");
          });
        }

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
      });
    });
}
