from functools import wraps
from flask import session, flash, redirect, url_for


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            flash("Anda harus login untuk mengakses halaman ini.", "warning")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            flash("Anda harus login untuk mengakses halaman ini.", "warning")
            return redirect(url_for("auth.login"))

        if session["user"].get("role") != "admin":
            flash("Anda tidak memiliki akses ke halaman ini.", "error")
            return redirect(url_for("dashboard.index"))

        return f(*args, **kwargs)
    return decorated_function