--
-- PostgreSQL database dump
--

\restrict NPHmsTr8o7IUc7BvZ8N05aTgpTsV4BEH8WkBEh4TnF2bmpwN9DlexFmpKjeCLnW

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

--
-- Data for Name: duenos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.duenos (id, owner_id, nombre, token, activo, fecha_creacion) FROM stdin;
1	hector	Hector (Pruebas)	hct_7f3a9b2e1d4c8f6a5b0e9d2c1a8f7e6b	t	2026-07-15 13:02:57.934794
2	nini	Nini	nin_3d8e1f4a7b2c9e6d0f5a8b3c1e7d4f9a	t	2026-07-15 13:07:18.352948
3	aguita	Aguita	agu_9c2e5f8a1b4d7e0f3c6a9b2e5f8d1c4e	t	2026-07-15 13:07:18.352948
4	cliente_prueba	Raul Mercedes	437395ef1cf628a0a27f5993b8a88b84	t	2026-07-17 23:58:49.833802
5	juan_perez	Juan Perez	JUAN01	t	2026-07-19 06:15:33.364432
11	pedro_martinez	Pedro Martinez	PEDRO01	t	2026-07-19 21:59:26.005305
\.


--
-- Data for Name: camiones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.camiones (id, owner_id, imei, ficha, marca, modelo, ano, kilometraje, estado, latitud, longitud, velocidad, fecha_vencimiento_seguro) FROM stdin;
1	hector	352812345678901	HG-01	Mack	Pinnacle	2011	50,000 km	Disponible	18.43539	-70.02613	0	\N
2	cliente_prueba	123456789012345	A123456	Freightliner	Cascadia	2020	\N	activo	18.4861	-69.9312	45	\N
3	cliente_prueba	111111111111111	B111111	Mack	Pinnacle	2021	\N	activo	18.5001	-69.95	60	\N
4	cliente_prueba	222222222222222	B222222	Kenworth	T680	2021	\N	activo	18.47	-69.91	35	\N
5	cliente_prueba	333333333333333	B333333	Mack	Vision	2021	\N	activo	18.455	-69.97	0	\N
6	pedro_martinez	444444444444444	C444444	Volvo	VNL	2022	\N	activo	\N	\N	0	\N
7	pedro_martinez	555555555555555	C555555	Volvo	VNL	2023	\N	activo	\N	\N	0	\N
\.


--
-- Name: camiones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.camiones_id_seq', 7, true);


--
-- Name: duenos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.duenos_id_seq', 11, true);


--
-- PostgreSQL database dump complete
--

\unrestrict NPHmsTr8o7IUc7BvZ8N05aTgpTsV4BEH8WkBEh4TnF2bmpwN9DlexFmpKjeCLnW

