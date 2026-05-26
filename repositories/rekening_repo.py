from repositories.base_repo import db_fetch_all, db_execute


def fetch_rekening(user_id):
    return db_fetch_all(
        "SELECT * FROM rekening WHERE user_id = %s ORDER BY id",
        (user_id,),
    )


def insert_rekening(nama_rekening, jenis_rekening, saldo_awal, user_id):
    db_execute(
        """
        INSERT INTO rekening (nama_rekening, jenis_rekening, saldo_awal, user_id)
        VALUES (%s, %s, %s, %s)
        """,
        (nama_rekening, jenis_rekening, saldo_awal, user_id),
    )