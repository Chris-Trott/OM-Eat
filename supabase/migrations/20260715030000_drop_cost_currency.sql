-- The destination fixes the country and the country fixes the currency, so
-- a stored currency is redundant. Display derives the symbol from
-- destinations.country.

alter table finds drop column cost_currency;
