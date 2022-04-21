#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

import json
import sqlite3

conn = sqlite3.connect("links.db")
c = conn.cursor()

entries = "entries.json"

c.execute("PRAGMA foreign_keys = ON")

with open(entries) as f:
    for entry in json.load(f):
        if not entry["url"]:
            continue

        type = entry["type"]
        if type == "":
            type_id = None
        else:
            c.execute("SELECT id FROM types WHERE type = ?", (type,))
            type_id = c.fetchone()
            if type_id is None:
                c.execute("INSERT OR IGNORE INTO types (type) VALUES (?)", (type,))
                c.execute("SELECT id FROM types WHERE type = ?", (type,))
                type_id = c.fetchone()
            type_id = type_id[0]

        c.execute("INSERT OR IGNORE INTO links (title, url, description, typeID) VALUES (?,?,?,?)",
                (entry["title"], entry["url"], entry["desc"], type_id))

        c.execute("SELECT id FROM links WHERE url = ?", (entry["url"],))
        link_id = c.fetchone()[0]

        for tag in entry["tags"]:
            c.execute("SELECT id FROM tags WHERE tag = ?", (tag,))
            tag_id = c.fetchone()
            if tag_id is None:
                c.execute("INSERT OR IGNORE INTO tags (tag) VALUES (?)", (tag,))
                c.execute("SELECT id FROM tags WHERE tag = ?", (tag,))
                tag_id = c.fetchone()

            c.execute("INSERT OR IGNORE INTO taggings VALUES (?,?)", (link_id, tag_id[0]))

        for lang in entry["langs"]:
            c.execute("INSERT OR IGNORE INTO langs VALUES (?,?)", (link_id, lang))

conn.commit()
conn.close()

with open(entries, "w") as f:
    f.write('''[
  {
    "title": "",
    "url":   "",
    "desc":  "",
    "langs": [],
    "type":  "",
    "tags":  []
  }
]
''')
