#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import json
import sqlite3

conn = sqlite3.connect("links.db")
c = conn.cursor()

c.execute("PRAGMA foreign_keys = ON")

with open("entry.json") as f:
    entry = json.load(f)

type = entry["type"]
c.execute("SELECT id FROM types WHERE type = ?", (type,))
type_id = c.fetchone()
if type_id is None:
    c.execute("INSERT INTO types (type) VALUES (?)", (type,))
    c.execute("SELECT id FROM types WHERE type = ?", (type,))
    type_id = c.fetchone()
type_id = type_id[0]

c.execute("INSERT INTO links (title, url, description, typeID) VALUES (?,?,?,?)",
        (entry["title"], entry["url"], entry["desc"], type_id))

c.execute("SELECT id FROM links WHERE url = ?", (entry["url"],))
link_id = c.fetchone()[0]

for tag in entry["tags"]:
    c.execute("SELECT id FROM tags WHERE tag = ?", (tag,))
    tag_id = c.fetchone()
    if tag_id is None:
        c.execute("INSERT INTO tags (tag) VALUES (?)", (tag,))
        c.execute("SELECT id FROM tags WHERE tag = ?", (tag,))
        tag_id = c.fetchone()
    c.execute("INSERT INTO taggings VALUES (?,?)", (link_id, tag_id[0]))

for lang in entry["langs"]:
    c.execute("INSERT INTO langs VALUES (?,?)", (link_id, lang))

conn.commit()
conn.close()
