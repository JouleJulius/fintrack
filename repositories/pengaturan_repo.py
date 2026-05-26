from repositories.base_repo import db_fetch_one, db_execute


def get_pengaturan(kunci, user_id, default="0"):
    row = db_fetch_one(
        "SELECT nilai FROM pengaturan WHERE kunci = %s AND user_id = %s",
        (kunci, user_id),
    )
    return row["nilai"] if row else default


def upsert_pengaturan(kunci, nilai, user_id):
    db_execute(
        """
        INSERT INTO pengaturan (kunci, nilai, user_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (kunci, user_id)
        DO UPDATE SET nilai = EXCLUDED.nilai
        """,
        (kunci, nilai, user_id),
    )