--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.utang_piutang DROP CONSTRAINT IF EXISTS utang_piutang_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaksi DROP CONSTRAINT IF EXISTS transaksi_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tabungan DROP CONSTRAINT IF EXISTS tabungan_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rekening DROP CONSTRAINT IF EXISTS rekening_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pengaturan DROP CONSTRAINT IF EXISTS pengaturan_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.anggaran DROP CONSTRAINT IF EXISTS anggaran_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utang_piutang DROP CONSTRAINT IF EXISTS utang_piutang_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.transaksi DROP CONSTRAINT IF EXISTS transaksi_pkey;
ALTER TABLE IF EXISTS ONLY public.tabungan DROP CONSTRAINT IF EXISTS tabungan_pkey;
ALTER TABLE IF EXISTS ONLY public.tabungan DROP CONSTRAINT IF EXISTS tabungan_nama_key;
ALTER TABLE IF EXISTS ONLY public.rekening DROP CONSTRAINT IF EXISTS rekening_pkey;
ALTER TABLE IF EXISTS ONLY public.pengaturan DROP CONSTRAINT IF EXISTS pengaturan_pkey;
ALTER TABLE IF EXISTS ONLY public.pengaturan DROP CONSTRAINT IF EXISTS pengaturan_kunci_user_unique;
ALTER TABLE IF EXISTS ONLY public.anggaran DROP CONSTRAINT IF EXISTS anggaran_pkey;
ALTER TABLE IF EXISTS public.utang_piutang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transaksi ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tabungan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rekening ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pengaturan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.anggaran ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.utang_piutang_id_seq;
DROP TABLE IF EXISTS public.utang_piutang;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.transaksi_id_seq;
DROP TABLE IF EXISTS public.transaksi;
DROP SEQUENCE IF EXISTS public.tabungan_id_seq;
DROP TABLE IF EXISTS public.tabungan;
DROP SEQUENCE IF EXISTS public.rekening_id_seq;
DROP TABLE IF EXISTS public.rekening;
DROP SEQUENCE IF EXISTS public.pengaturan_id_seq;
DROP TABLE IF EXISTS public.pengaturan;
DROP SEQUENCE IF EXISTS public.anggaran_id_seq;
DROP TABLE IF EXISTS public.anggaran;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anggaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anggaran (
    id integer NOT NULL,
    kategori character varying(100) NOT NULL,
    batas numeric NOT NULL,
    bulan integer NOT NULL,
    tahun integer NOT NULL,
    user_id integer
);


--
-- Name: anggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.anggaran_id_seq OWNED BY public.anggaran.id;


--
-- Name: pengaturan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengaturan (
    id integer NOT NULL,
    kunci character varying(100) NOT NULL,
    nilai text NOT NULL,
    user_id integer
);


--
-- Name: pengaturan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pengaturan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pengaturan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pengaturan_id_seq OWNED BY public.pengaturan.id;


--
-- Name: rekening; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rekening (
    id integer NOT NULL,
    nama_rekening character varying(100) NOT NULL,
    jenis_rekening character varying(100),
    saldo_awal numeric DEFAULT 0,
    user_id integer
);


--
-- Name: rekening_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rekening_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rekening_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rekening_id_seq OWNED BY public.rekening.id;


--
-- Name: tabungan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tabungan (
    id integer NOT NULL,
    nama character varying(100) NOT NULL,
    target numeric DEFAULT 0 NOT NULL,
    terkumpul numeric DEFAULT 0 NOT NULL,
    tenggat date,
    user_id integer
);


--
-- Name: tabungan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tabungan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tabungan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tabungan_id_seq OWNED BY public.tabungan.id;


--
-- Name: transaksi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaksi (
    id integer NOT NULL,
    deskripsi text,
    jumlah integer NOT NULL,
    tipe character varying(50) NOT NULL,
    kategori character varying(100),
    tanggal timestamp without time zone NOT NULL,
    rekening_id integer,
    user_id integer
);


--
-- Name: transaksi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaksi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaksi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaksi_id_seq OWNED BY public.transaksi.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    nama_lengkap character varying(150),
    tanggal_lahir date,
    no_wa character varying(30),
    jenis_kelamin character varying(20)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: utang_piutang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utang_piutang (
    id integer NOT NULL,
    tipe character varying(50) NOT NULL,
    deskripsi text,
    pihak_terkait character varying(100),
    jumlah_total numeric DEFAULT 0 NOT NULL,
    jumlah_terbayar numeric DEFAULT 0 NOT NULL,
    lunas boolean DEFAULT false,
    tanggal_mulai date,
    tanggal_jatuh_tempo date,
    user_id integer
);


--
-- Name: utang_piutang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utang_piutang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utang_piutang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utang_piutang_id_seq OWNED BY public.utang_piutang.id;


--
-- Name: anggaran id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anggaran ALTER COLUMN id SET DEFAULT nextval('public.anggaran_id_seq'::regclass);


--
-- Name: pengaturan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengaturan ALTER COLUMN id SET DEFAULT nextval('public.pengaturan_id_seq'::regclass);


--
-- Name: rekening id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekening ALTER COLUMN id SET DEFAULT nextval('public.rekening_id_seq'::regclass);


--
-- Name: tabungan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabungan ALTER COLUMN id SET DEFAULT nextval('public.tabungan_id_seq'::regclass);


--
-- Name: transaksi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi ALTER COLUMN id SET DEFAULT nextval('public.transaksi_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: utang_piutang id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utang_piutang ALTER COLUMN id SET DEFAULT nextval('public.utang_piutang_id_seq'::regclass);


--
-- Data for Name: anggaran; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anggaran (id, kategori, batas, bulan, tahun, user_id) FROM stdin;
\.


--
-- Data for Name: pengaturan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pengaturan (id, kunci, nilai, user_id) FROM stdin;
1	gaji	5000000	5
3	gaji	4000000	2
\.


--
-- Data for Name: rekening; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rekening (id, nama_rekening, jenis_rekening, saldo_awal, user_id) FROM stdin;
1	BCA	Bank	0	2
2	BNI	Bank	0	3
3	BCA	Bank	0	5
4	BNI	Bank	0	5
5	Seabank	Bank	0	5
6	Dompet	Tunai	0	5
\.


--
-- Data for Name: tabungan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tabungan (id, nama, target, terkumpul, tenggat, user_id) FROM stdin;
1	Dana Darurat	15000000	0.0	2036-05-19	5
\.


--
-- Data for Name: transaksi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaksi (id, deskripsi, jumlah, tipe, kategori, tanggal, rekening_id, user_id) FROM stdin;
2	Uang jajan	200000	pemasukan	Gaji	2026-05-22 08:29:00	1	\N
7	Uang saku magang	3700000	pemasukan	Gaji	2026-05-25 16:00:00	4	5
10	Simpan uang	700000	pengeluaran	Transfer	2026-05-25 18:46:00	4	5
11	Simpan uang	700000	pemasukan	Transfer	2026-05-25 18:46:00	5	5
12	TF Pedagang telor (Ngikut TF Mamah)	360000	pengeluaran	Transfer	2026-05-25 19:00:00	5	5
13	Ganti TF untu pedangang telor	360000	pemasukan	Lainnya	2026-05-25 19:03:00	6	5
14	Ribsgold celana panjang	157307	pengeluaran	Belanja	2026-05-26 06:27:00	4	5
15	COZYCLUB long sleeve (Kemaja)	112958	pengeluaran	Belanja	2026-05-26 06:39:00	4	5
16	Tiket Kereta TSM - BDG - 2 Orang (Sangkuriang)	200000	pengeluaran	Transportasi	2026-05-26 09:05:00	4	5
17	Tiket Kerta BDG - JKT - 2 Orang (Prahiangan)	390000	pengeluaran	Transportasi	2026-05-26 09:06:00	4	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, role, created_at, status, nama_lengkap, tanggal_lahir, no_wa, jenis_kelamin) FROM stdin;
2	admin@gmail.com	scrypt:32768:8:1$rQVcgLaDe4ogDXad$1b7a66fa4633e54bb1faab503fe6f35900f1ff70b8eaa761cdb80f17dcf9ed14cc2d5c6c9fd79fcdcfce33cfd6c9c8dc42f41ff6255f63334ef9ecec6d1617d0	admin	2026-05-21 22:28:27.986224	active	\N	\N	\N	\N
3	dinannadifah@gmail.com	scrypt:32768:8:1$2k3ZGOF9W35TrFyD$9894a7c31c55f918e50265ee5035667cc3836fdc4370e385664b5aa6f193681dff2b940b768cea1dec41e2a483f810c6ae0255f6babfe5efb15e83efd89a85a2	user	2026-05-22 08:21:35.367112	active	\N	\N	\N	\N
5	lutfijulpian@gmail.com	scrypt:32768:8:1$k5tHPnN5lzI1KmGl$5fe4931758b48b6f5702f4b36828ce9eaaf443b413628d66b62a13d089ed39a6227431c3b9def73d2cdd3bdae4e7b173c1b158397bf75b41b70aad86092bd454	user	2026-05-22 08:31:23.509281	active	\N	\N	\N	\N
7	julpian@gmail.com	scrypt:32768:8:1$PiGo2vOMTNPcLEeU$c882b7635d02c7c6245e28ac76be05f2e1f27c7561a4e362407dc117dc2aa0d593a382fec3e399088c876db664aea2f2b0a429e6219f40223e9c22de0ce9f261	user	2026-05-25 06:03:11.446655	pending	Kevin Julian	2001-06-19	085705007752	Laki-laki
\.


--
-- Data for Name: utang_piutang; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utang_piutang (id, tipe, deskripsi, pihak_terkait, jumlah_total, jumlah_terbayar, lunas, tanggal_mulai, tanggal_jatuh_tempo, user_id) FROM stdin;
\.


--
-- Name: anggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anggaran_id_seq', 1, false);


--
-- Name: pengaturan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pengaturan_id_seq', 4, true);


--
-- Name: rekening_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rekening_id_seq', 6, true);


--
-- Name: tabungan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tabungan_id_seq', 3, true);


--
-- Name: transaksi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transaksi_id_seq', 17, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: utang_piutang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utang_piutang_id_seq', 1, false);


--
-- Name: anggaran anggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anggaran
    ADD CONSTRAINT anggaran_pkey PRIMARY KEY (id);


--
-- Name: pengaturan pengaturan_kunci_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengaturan
    ADD CONSTRAINT pengaturan_kunci_user_unique UNIQUE (kunci, user_id);


--
-- Name: pengaturan pengaturan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengaturan
    ADD CONSTRAINT pengaturan_pkey PRIMARY KEY (id);


--
-- Name: rekening rekening_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekening
    ADD CONSTRAINT rekening_pkey PRIMARY KEY (id);


--
-- Name: tabungan tabungan_nama_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabungan
    ADD CONSTRAINT tabungan_nama_key UNIQUE (nama);


--
-- Name: tabungan tabungan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabungan
    ADD CONSTRAINT tabungan_pkey PRIMARY KEY (id);


--
-- Name: transaksi transaksi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi
    ADD CONSTRAINT transaksi_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: utang_piutang utang_piutang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utang_piutang
    ADD CONSTRAINT utang_piutang_pkey PRIMARY KEY (id);


--
-- Name: anggaran anggaran_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anggaran
    ADD CONSTRAINT anggaran_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pengaturan pengaturan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengaturan
    ADD CONSTRAINT pengaturan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rekening rekening_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekening
    ADD CONSTRAINT rekening_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tabungan tabungan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabungan
    ADD CONSTRAINT tabungan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transaksi transaksi_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi
    ADD CONSTRAINT transaksi_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: utang_piutang utang_piutang_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utang_piutang
    ADD CONSTRAINT utang_piutang_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

