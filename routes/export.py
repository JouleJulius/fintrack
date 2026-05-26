from flask import Blueprint, send_file, Response, redirect, url_for, session
from io import BytesIO
from fpdf import FPDF
import pandas as pd

from utils.decorators import login_required
from utils.date_helper import parse_datetime_value
from repositories.transaksi_repo import fetch_all_transaksi


export_bp = Blueprint("export", __name__)


def current_user_id():
    return session["user"]["id"]


class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Laporan Keuangan Pribadi", 0, 1, "C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Halaman {self.page_no()}", 0, 0, "C")

    def chapter_title(self, title):
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, title, 0, 1, "L")
        self.ln(5)

    def fancy_table(self, header, data):
        self.set_fill_color(230, 230, 230)
        self.set_text_color(0)
        self.set_draw_color(128)
        self.set_line_width(0.3)
        self.set_font("Arial", "B", 10)

        col_widths = {
            "Tanggal": 25,
            "Deskripsi": 120,
            "Jumlah": 40,
            "Tipe": 30,
            "Kategori": 40,
        }

        for col_name in header:
            self.cell(
                col_widths[col_name],
                8,
                col_name,
                1,
                0,
                "C",
                1
            )
        self.ln()

        self.set_font("Arial", "", 9)
        fill = False

        for row in data:
            start_y = self.get_y()

            tanggal_obj = parse_datetime_value(row.get("tanggal", ""))
            tanggal_str = (
                tanggal_obj.strftime("%d-%m-%Y")
                if tanggal_obj
                else str(row.get("tanggal", ""))
            )

            deskripsi_str = str(row.get("deskripsi", ""))
            jumlah_str = "Rp {:,.0f}".format(
                float(row.get("jumlah", 0.0))
            ).replace(",", ".")

            tipe_str = str(row.get("tipe", ""))
            kategori_str = str(row.get("kategori", ""))

            x_pos = self.get_x()

            self.cell(
                col_widths["Tanggal"],
                6,
                tanggal_str,
                "LR",
                0,
                "L",
                fill
            )

            y_pos_after_first_cell = self.get_y()
            self.set_x(x_pos + col_widths["Tanggal"])

            self.multi_cell(
                col_widths["Deskripsi"],
                6,
                deskripsi_str,
                "LR",
                "L",
                fill
            )

            y_pos_after_multicell = self.get_y()
            row_height = max(
                y_pos_after_multicell - y_pos_after_first_cell,
                6
            )

            self.set_y(start_y)
            self.set_x(
                x_pos
                + col_widths["Tanggal"]
                + col_widths["Deskripsi"]
            )

            self.cell(
                col_widths["Jumlah"],
                row_height,
                jumlah_str,
                "LR",
                0,
                "R",
                fill
            )
            self.cell(
                col_widths["Tipe"],
                row_height,
                tipe_str,
                "LR",
                0,
                "L",
                fill
            )
            self.cell(
                col_widths["Kategori"],
                row_height,
                kategori_str,
                "LR",
                0,
                "L",
                fill
            )

            self.ln(row_height)
            fill = not fill

        self.cell(sum(col_widths.values()), 0, "", "T")

    def summary_section(
        self,
        total_pemasukan,
        total_pengeluaran,
        sisa_uang
    ):
        self.add_page()
        self.chapter_title("Ringkasan Keuangan")

        self.set_font("Arial", "", 12)
        self.cell(50, 10, "Total Pemasukan:", 0, 0)
        self.set_font("", "B")
        self.cell(0, 10, "Rp {:,.2f}".format(total_pemasukan), 0, 1)

        self.set_font("")
        self.cell(50, 10, "Total Pengeluaran:", 0, 0)
        self.set_font("", "B")
        self.cell(0, 10, "Rp {:,.2f}".format(total_pengeluaran), 0, 1)

        self.set_font("")
        self.line(
            self.get_x(),
            self.get_y(),
            self.get_x() + 100,
            self.get_y()
        )

        self.ln(5)

        self.cell(50, 10, "Sisa Uang:", 0, 0)
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, "Rp {:,.2f}".format(sisa_uang), 0, 1)


@export_bp.route("/ekspor_excel")
@login_required
def ekspor_excel():
    try:
        transaksi = fetch_all_transaksi(current_user_id())

        if not transaksi:
            df_empty = pd.DataFrame()
            output = BytesIO()

            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df_empty.to_excel(
                    writer,
                    index=False,
                    sheet_name="Ringkasan"
                )

            output.seek(0)

            return send_file(
                output,
                download_name="laporan_keuangan_kosong.xlsx",
                as_attachment=True
            )

        df = pd.DataFrame(transaksi)
        df["jumlah"] = pd.to_numeric(
            df["jumlah"],
            errors="coerce"
        ).fillna(0)

        df_pemasukan = df[df["tipe"] == "pemasukan"].copy()
        df_pengeluaran = df[df["tipe"] == "pengeluaran"].copy()

        total_pemasukan = df_pemasukan["jumlah"].sum()
        total_pengeluaran = df_pengeluaran["jumlah"].sum()
        sisa_uang = total_pemasukan - total_pengeluaran

        df_summary = pd.DataFrame({
            "Deskripsi": [
                "Total Pemasukan",
                "Total Pengeluaran",
                "Sisa Uang"
            ],
            "Jumlah": [
                total_pemasukan,
                total_pengeluaran,
                sisa_uang
            ],
        })

        output = BytesIO()

        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df_summary.to_excel(
                writer,
                index=False,
                sheet_name="Ringkasan"
            )
            df_pemasukan.to_excel(
                writer,
                index=False,
                sheet_name="Pemasukan"
            )
            df_pengeluaran.to_excel(
                writer,
                index=False,
                sheet_name="Pengeluaran"
            )

        output.seek(0)

        return send_file(
            output,
            download_name="laporan_keuangan.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    except Exception as e:
        print(f"Error exporting to Excel: {e}")
        return redirect(url_for("dashboard.index"))


@export_bp.route("/ekspor_csv")
@login_required
def ekspor_csv():
    try:
        transaksi = fetch_all_transaksi(current_user_id())
        df = pd.DataFrame(transaksi)

        output = BytesIO()
        output.write(
            df.to_csv(index=False, encoding="utf-8").encode("utf-8")
        )
        output.seek(0)

        return Response(
            output,
            mimetype="text/csv",
            headers={
                "Content-Disposition": "attachment;filename=laporan_transaksi.csv"
            }
        )

    except Exception as e:
        print(f"Error exporting to CSV: {e}")
        return redirect(url_for("dashboard.index"))


@export_bp.route("/ekspor_pdf")
@login_required
def ekspor_pdf():
    try:
        transaksi = fetch_all_transaksi(current_user_id())

        pemasukan_data = [
            t for t in transaksi
            if t["tipe"] == "pemasukan"
        ]

        pengeluaran_data = [
            t for t in transaksi
            if t["tipe"] == "pengeluaran"
        ]

        total_pemasukan = sum(
            float(t.get("jumlah", 0))
            for t in pemasukan_data
        )

        total_pengeluaran = sum(
            float(t.get("jumlah", 0))
            for t in pengeluaran_data
        )

        sisa_uang = total_pemasukan - total_pengeluaran

        pdf = PDF("L", "mm", "A4")
        header = [
            "Tanggal",
            "Deskripsi",
            "Jumlah",
            "Tipe",
            "Kategori"
        ]

        pdf.add_page()
        pdf.chapter_title("Laporan Pemasukan")
        pdf.fancy_table(header, pemasukan_data)

        pdf.add_page()
        pdf.chapter_title("Laporan Pengeluaran")
        pdf.fancy_table(header, pengeluaran_data)

        pdf.summary_section(
            total_pemasukan,
            total_pengeluaran,
            sisa_uang
        )

        return Response(
            pdf.output(dest="S").encode("latin-1"),
            mimetype="application/pdf",
            headers={
                "Content-Disposition": "attachment;filename=laporan_keuangan.pdf"
            }
        )

    except Exception as e:
        print(f"Error exporting to PDF: {e}")
        return redirect(url_for("dashboard.index"))