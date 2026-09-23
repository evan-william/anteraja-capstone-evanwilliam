-- Hash-only demo activation codes. Apply AFTER account_roles migration.
-- Codes are one-use and expire 30 days after this seed is applied.
insert into public.admin_activation_codes (code_hash, expires_at) values
  ('51f60cedf94eba8e8d59d66d56cc4cc5b041cd4eda396800b507e1b313253fec', now() + interval '30 days'),
  ('b72bd8246fa69878b1f0b4545ed0177e8ecb0e5e9309950080a51b52143ce41e', now() + interval '30 days'),
  ('3486acb3e4f53e6f998095256623810f47a0595d574e0230f32198258a8430af', now() + interval '30 days'),
  ('6be3cca1724c9ead6621861fa44404456c572cf3466c3fc0ad85b1183ad57944', now() + interval '30 days'),
  ('06b27b818d3c08c1367e0018d7ccfbb43350f4fb9fe7c5149fecac15d6c9d83f', now() + interval '30 days'),
  ('40d9aa529c0ce1fd506ac8db0d6f0e0f8882956c88b873c2b5e30aa60859a179', now() + interval '30 days'),
  ('2ce4f372528f1c157c7b4479481692a099faf8c07c63d8e6d1cf7bf7b3657bdf', now() + interval '30 days'),
  ('08bffdffe40628e2286c1880d0fb222e3f467b08e4fcd4acf11f2988bf6a7ddd', now() + interval '30 days'),
  ('9323e0c8c72a179d2237b5f9c277ccc61c83c3fc25682455a726c4995dc4b5b2', now() + interval '30 days'),
  ('3fb195d56ab34e0ac44872a1f455b4908b39e235bb9f9b1165c24cde0aee7b08', now() + interval '30 days')
on conflict (code_hash) do nothing;
