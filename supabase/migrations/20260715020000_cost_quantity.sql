-- Free-text cost made currency symbols unplaceable ("6 for 11.50" vs
-- "11.50 for 6"). Structure it instead: cost_amount returns to a plain
-- number and cost_qty records how many items that price buys.
-- Display: qty 1 -> "€11.50", qty > 1 -> "€11.50 for 6".

alter table finds add column cost_qty smallint not null default 1
  check (cost_qty between 1 and 99);

-- Best-effort parse of existing free-text values: "11.50 for 6" and the like.
update finds
set cost_qty = least(greatest((substring(cost_amount from 'for (\d+)'))::smallint, 1), 99)
where cost_amount ~ 'for \d+';

alter table finds
  alter column cost_amount type numeric(10, 2)
  using nullif(replace(substring(cost_amount from '\d+(?:[.,]\d+)?'), ',', '.'), '')::numeric(10, 2);
