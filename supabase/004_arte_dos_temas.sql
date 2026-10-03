-- Registro da migration "pasta_arte_dos_temas". Não contém segredos.
-- Pasta pública com as imagens dos temas (só donos enviam, trocam e apagam)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('theme-art', 'theme-art', true, 3145728, array['image/svg+xml','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy theme_art_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'theme-art' and (select private.is_admin()));
create policy theme_art_update_admin on storage.objects for update to authenticated
  using (bucket_id = 'theme-art' and (select private.is_admin()))
  with check (bucket_id = 'theme-art' and (select private.is_admin()));
create policy theme_art_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'theme-art' and (select private.is_admin()));