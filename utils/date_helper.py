from datetime import datetime, date


def parse_datetime_value(value):
    if isinstance(value, datetime):
        return value

    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    return None


def format_datetime(value, format="%Y-%m-%d"):
    parsed = parse_datetime_value(value)

    if parsed:
        return parsed.strftime(format)

    return value