from repositories.base_repo import db_fetch_all, db_fetch_one, db_execute


def fetch_utang_piutang_aktif(user_id):
    return db_fetch_all(
        "SELECT * FROM utang_piutang WHERE lunas = FALSE AND user_id = %s ORDER BY id",
        (user_id,),
    )


def fetch_utang_piutang_all(user_id):
    return db_fetch_all(
        """
        SELECT *
        FROM utang_piutang
        WHERE user_id = %s
        ORDER BY lunas ASC, tanggal_jatuh_tempo ASC NULLS LAST, id ASC
        """,
        (user_id,),
    )


def insert_utang_piutang(tipe, deskripsi, pihak_terkait, jumlah_total, tanggal_mulai, user_id):
    db_execute(
        """
        INSERT INTO utang_piutang
        (tipe, deskripsi, pihak_terkait, jumlah_total, jumlah_terbayar, lunas, tanggal_mulai, user_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (tipe, deskripsi, pihak_terkait, jumlah_total, 0.0, False, tanggal_mulai, user_id),
    )


def find_utang_piutang_aktif(tipe, pihak_terkait, user_id):
    return db_fetch_one(
        """
        SELECT *
        FROM utang_piutang
        WHERE tipe = %s AND pihak_terkait = %s AND lunas = FALSE AND user_id = %s
        ORDER BY id
        LIMIT 1
        """,
        (tipe, pihak_terkait, user_id),
    )


def get_utang_piutang_by_id(item_id, user_id):
    return db_fetch_one(
        "SELECT * FROM utang_piutang WHERE id = %s AND user_id = %s",
        (item_id, user_id),
    )


def update_pembayaran_utang_piutang(item_id, jumlah_terbayar, lunas, user_id):
    db_execute(
        """
        UPDATE utang_piutang
        SET jumlah_terbayar = %s, lunas = %s
        WHERE id = %s AND user_id = %s
        """,
        (jumlah_terbayar, lunas, item_id, user_id),
    )


def delete_utang_piutang(item_id, user_id):
    db_execute(
        "DELETE FROM utang_piutang WHERE id = %s AND user_id = %s",
        (item_id, user_id),
    )