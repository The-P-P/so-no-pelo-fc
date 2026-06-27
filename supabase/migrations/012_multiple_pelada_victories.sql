-- Permite várias vitórias por jogador na mesma pelada (ex.: vários jogos de 7 min).

ALTER TABLE pelada_victories
  DROP CONSTRAINT IF EXISTS pelada_victories_season_id_pelada_id_user_id_key;
