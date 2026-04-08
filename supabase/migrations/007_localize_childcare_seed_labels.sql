update cms_childcare_centers
set name = case id
  when '11111111-1111-1111-1111-111111111111' then '별꽃 어린이집'
  when '22222222-2222-2222-2222-222222222222' then '강변 키즈 어린이집'
  else name
end
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

update cms_childcare_classes
set name = case id
  when '11111111-aaaa-1111-aaaa-111111111111' then '해님반'
  when '11111111-bbbb-1111-bbbb-111111111111' then '달님반'
  when '22222222-aaaa-2222-aaaa-222222222222' then '별님반'
  else name
end
where id in (
  '11111111-aaaa-1111-aaaa-111111111111',
  '11111111-bbbb-1111-bbbb-111111111111',
  '22222222-aaaa-2222-aaaa-222222222222'
);
