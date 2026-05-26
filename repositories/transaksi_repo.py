from repositories.base_repo import db_fetch_all, db_fetch_one, db_execute


def fetch_all_transaksi(user_id):
    return db_fetch_all(
        "SELECT * FROM transaksi WHERE user_id = %s ORDER BY tanggal DESC",
        (user_id,),
    )


def insert_transaksi(data, user_id):
    db_execute(
        """
        INSERT INTO transaksi
        (deskripsi, jumlah, tipe, kategori, tanggal, rekening_id, user_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            data.get("deskripsi"),
            data.get("jumlah"),
            data.get("tipe"),
            data.get("kategori"),
            data.get("tanggal"),
            data.get("rekening_id"),
            user_id,
        ),
    )


def insert_many_transaksi(rows, user_id):
    for row in rows:
        insert_transaksi(row, user_id)


def delete_transaksi_by_id(transaksi_id, user_id):
    db_execute(
        "DELETE FROM transaksi WHERE id = %s AND user_id = %s",
        (transaksi_id, user_id),
    )


def count_all_transaksi(user_id):
    result = db_fetch_one(
        "SELECT COUNT(*) AS total FROM transaksi WHERE user_id = %s",
        (user_id,),
    )
    return result.get("total", 0) if result else 0


def fetch_transaksi_paginated(limit, offset, user_id):
    return db_fetch_all(
        """
        SELECT *
        FROM transaksi
        WHERE user_id = %s
        ORDER BY tanggal DESC
        LIMIT %s OFFSET %s
        """,
        (user_id, limit, offset),
    )