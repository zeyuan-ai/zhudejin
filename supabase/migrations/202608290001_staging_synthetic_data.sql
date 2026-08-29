alter table public.listings
  add column if not exists data_origin text not null default 'real'
    check (data_origin in ('real', 'synthetic')),
  add column if not exists test_region text
    check (test_region is null or test_region in ('hongqiao', 'lujiazui', 'peoples-square', 'xujiahui', 'zhangjiang')),
  add column if not exists scenario_tags jsonb not null default '[]'::jsonb;

create index if not exists listings_origin_region_idx
  on public.listings (data_origin, test_region, status);

comment on column public.listings.data_origin is 'real=可进入正式数据集，synthetic=仅限内测且禁止迁移到生产';
comment on column public.listings.test_region is '内测预置办公区域；真实房源可为空';

delete from public.listings where data_origin = 'synthetic';

with regions(region_id, region_name, district_name, station_name, latitude, longitude) as (
  values
    ('hongqiao', '虹桥', '闵行 · 虹桥', '虹桥火车站', 31.1979::double precision, 121.3211::double precision),
    ('lujiazui', '陆家嘴', '浦东 · 陆家嘴', '陆家嘴站', 31.2397::double precision, 121.4998::double precision),
    ('peoples-square', '人民广场', '黄浦 · 人民广场', '人民广场站', 31.2304::double precision, 121.4737::double precision),
    ('xujiahui', '徐家汇', '徐汇 · 徐家汇', '徐家汇站', 31.1885::double precision, 121.4365::double precision),
    ('zhangjiang', '张江', '浦东 · 张江', '张江高科站', 31.2036::double precision, 121.6014::double precision)
), profiles(n, rent, rental_type, bedroom_count, bedrooms, area, station_walk, scenario) as (
  values
    (1, 2800, '合租', 1, '一室合租', 22, 5, 'budget-shared'),
    (2, 3400, '合租', 1, '一室合租', 28, 7, 'budget-shared'),
    (3, 3900, '整租', 1, '一室一厅', 35, 9, 'single-entire'),
    (4, 4500, '整租', 1, '一室一厅', 42, 12, 'single-entire'),
    (5, 5200, '整租', 2, '两室一厅', 50, 15, 'family-two-bedroom'),
    (6, 6000, '整租', 2, '两室一厅', 58, 18, 'family-two-bedroom'),
    (7, 7200, '整租', 3, '三室一厅', 68, 6, 'family-three-bedroom'),
    (8, 8500, '整租', 3, '三室两厅', 80, 10, 'family-three-bedroom'),
    (9, 3000, '合租', 1, '一室合租', 25, 20, 'budget-shared'),
    (10, 4100, '整租', 2, '两室一厅', 38, 8, 'least-walk'),
    (11, 5600, '整租', 3, '三室一厅', 62, 14, 'least-transfer'),
    (12, 4800, '整租', 1, '一室一厅', 46, 5, 'metro-nearby')
), seeded as (
  select
    (substr(md5(region_id || '-' || n), 1, 8) || '-' || substr(md5(region_id || '-' || n), 9, 4) || '-4' || substr(md5(region_id || '-' || n), 14, 3) || '-a' || substr(md5(region_id || '-' || n), 18, 3) || '-' || substr(md5(region_id || '-' || n), 21, 12))::uuid as id,
    region_id, region_name, district_name, station_name,
    latitude + (((n % 4) - 1.5) * 0.006) as listing_latitude,
    longitude + (((n % 3) - 1) * 0.008) as listing_longitude,
    n, rent, rental_type, bedroom_count, bedrooms, area, station_walk, scenario
  from regions cross join profiles
)
insert into public.listings (
  id, title, district, address, latitude, longitude, rent, rental_type,
  bedroom_count, bedrooms, area, image_url, station, station_walk_minutes,
  build_year, highlights, tags, description, source_name, source_url,
  source_updated_at, status, data_origin, test_region, scenario_tags
)
select
  id,
  region_name || '内测住区 ' || lpad(n::text, 2, '0'),
  district_name,
  region_name || '测试路 ' || (20 + n * 7)::text || ' 号（模拟）',
  listing_latitude, listing_longitude, rent, rental_type::public.rental_type, bedroom_count, bedrooms,
  area, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=75',
  station_name, station_walk, 2008 + n,
  jsonb_build_array('固定可复现路线', case when station_walk <= 8 then '近地铁' else '覆盖不同步行距离' end),
  jsonb_build_array(rental_type, bedrooms, scenario),
  '用于住得近内部测试的固定合成房源，不代表真实房屋或真实出租状态。',
  '住得近内测模拟', '', current_date, 'active'::public.listing_status, 'synthetic', region_id,
  jsonb_build_array('baseline', scenario, 'all-transports')
from seeded;

do $$
begin
  if (select count(*) from public.listings where data_origin = 'synthetic') <> 60 then
    raise exception 'Synthetic seed validation failed: expected 60 rows';
  end if;
end $$;
