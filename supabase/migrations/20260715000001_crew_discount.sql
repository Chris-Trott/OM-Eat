-- Crew discount marker on a Find. Curator-set in /admin only; deliberately
-- not rendered on the public site yet.

alter table finds add column crew_discount boolean not null default false;
