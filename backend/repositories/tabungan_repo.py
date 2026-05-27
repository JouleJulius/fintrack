from repositories.base_repo import db_fetch_all, db_fetch_one, db_execute


def fetch_tabungan(user_id):
    return db_fetch_all(
        "SELECT * FROM tabungan WHERE user_id = %s ORDER BY id",
        (user_id,),
    )


def fetch_tabungan_non_dana_darurat(user_id):
    return db_fetch_all(
        "SELECT id, nama FROM tabungan WHERE user_id = %s AND nama <> %s ORDER BY id",
        (user_id, "Dana Darurat"),
    )


def get_dana_darurat(user_id):
    return db_fetch_one(
        "SELECT id FROM tabungan WHERE nama = %s AND user_id = %s",
        ("Dana Darurat", user_id),
    )


def update_target_dana_darurat(target, user_id):
    db_execute(
        "UPDATE tabungan SET target = %s WHERE nama = %s AND user_id = %s",
        (target, "Dana Darurat", user_id),
    )


def insert_dana_darurat(target, tenggat, user_id):
    db_execute(
        """
        INSERT INTO tabungan (nama, target, terkumpul, tenggat, user_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        ("Dana Darurat", target, 0.0, tenggat, user_id),
    )


def insert_tabungan(nama, target, terkumpul, tenggat, user_id):
    db_execute(
        """
        INSERT INTO tabungan (nama, target, terkumpul, tenggat, user_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (nama, target, terkumpul, tenggat, user_id),
    )


def get_tabungan_terkumpul(tabungan_id, user_id):
    return db_fetch_one(
        "SELECT terkumpul FROM tabungan WHERE id = %s AND user_id = %s",
        (tabungan_id, user_id),
    )


def update_tabungan_terkumpul(tabungan_id, terkumpul, user_id):
    db_execute(
        "UPDATE tabungan SET terkumpul = %s WHERE id = %s AND user_id = %s",
        (terkumpul, tabungan_id, user_id),
    )