-- KLX added to the BAEF network from LGW.

insert into destinations (iata, city, country, slug) values
  ('KLX', 'Kalamata', 'Greece', 'kalamata')
on conflict (iata) do nothing;
