from db import get_db_connection


def db_fetch_all(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, params or ())
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data


def db_fetch_one(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, params or ())
    data = cur.fetchone()
    cur.close()
    conn.close()
    return data


def db_execute(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, params or ())
    conn.commit()
    cur.close()
    conn.close()