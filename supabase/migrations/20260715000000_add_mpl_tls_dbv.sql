-- MPL, TLS and DBV added to the BAEF network from LGW.

insert into destinations (iata, city, country, slug) values
  ('MPL', 'Montpellier', 'France', 'montpellier'),
  ('TLS', 'Toulouse', 'France', 'toulouse'),
  ('DBV', 'Dubrovnik', 'Croatia', 'dubrovnik')
on conflict (iata) do nothing;
