-- Keep a single room description without losing either existing text.
-- full_description remains the canonical storage column for compatibility.
update public.rooms
set full_description = case
      when nullif(btrim(short_description), '') is null then full_description
      when nullif(btrim(full_description), '') is null then btrim(short_description)
      when btrim(short_description) = btrim(full_description) then btrim(full_description)
      else btrim(short_description) || E'\n\n' || btrim(full_description)
    end,
    short_description = null
where short_description is not null;
