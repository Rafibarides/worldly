-- Baseline badge definitions. Safe to re-run (INSERT OR IGNORE).
INSERT OR IGNORE INTO badges (id, name, continent, description, times_required) VALUES
  ('Africa',         'Africa',         'Africa',         'Score 100% on Africa three times.',         3),
  ('Asia',           'Asia',           'Asia',           'Score 100% on Asia three times.',           3),
  ('Europe',         'Europe',         'Europe',         'Score 100% on Europe three times.',         3),
  ('North America',  'North America',  'North America',  'Score 100% on North America three times.',  3),
  ('South America',  'South America',  'South America',  'Score 100% on South America three times.',  3),
  ('Oceania',        'Oceania',        'Oceania',        'Score 100% on Oceania three times.',        3),
  ('worldExplorer',  'World Explorer', NULL,             'Guess every country across all six continents.', 1),
  ('speedDemon',     'Speed Demon',    NULL,             'Finish a game exceptionally fast.',         1),
  ('perfectScore',   'Perfect Score',  NULL,             'Achieve a perfect game.',                   1);
