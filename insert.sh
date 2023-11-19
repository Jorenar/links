#!/usr/bin/env sh

sqlite3 "$1" << SQL
INSERT INTO "$2" VALUES
$(awk -F'\t' -v t=' ' -v q="'" '
    function esc(s) { gsub(q, q q, s); return s }
    function ltrim(s) { sub(/^[ \t\r\n]+/, "", s); return s }
    function rtrim(s) { sub(/[ \t\r\n]+$/, "", s); return s }
    function trim(s)  { return rtrim(ltrim(s)); }

    BEGIN {OFS = FS} \
    {
        printf "%s (%s, %s, %s)\n", \
                t, \
                q esc(trim($1)) q, \
                q esc(trim($2)) q, \
                q esc(trim($3)) q;
        t=","
    }
');
SQL
