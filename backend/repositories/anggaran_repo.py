from repositories.base_repo import db_fetch_all, db_execute


def fetch_anggaran(bulan, tahun, user_id):
    return db_fetch_all(
        """
        SELECT *
        FROM anggaran
        WHERE bulan = %s AND tahun = %s AND user_id = %s
        ORDER BY id
        """,
        (bulan, tahun, user_id),
    )


def insert_anggaran(kategori, batas, bulan, tahun, user_id):
    db_execute(
        """
        INSERT INTO anggaran (kategori, batas, bulan, tahun, user_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (kategori, batas, bulan, tahun, user_id),
    )