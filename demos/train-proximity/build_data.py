#!/usr/bin/env python3
"""
Build data files for the Chicago Train Proximity map.

Outputs (written next to this script):
  - blocks.json  : every populated 2020 census block in Chicago
                   [lat, lng, pop, communityAreaIndex] + community-area stats
  - data.json    : CTA stations (+ planned Red Line Extension), citywide
                   totals, metadata
  - lines.geojson: CTA rail line geometry + planned RLE alignment

Sources (all fetched from public GitHub mirrors; see SOURCES below):
  - Block population: official PL 94-171 2020 redistricting file for Illinois
    (City of Chicago's Census2020-redistricting repo). Blocks are selected by
    PLACE == 14000 (City of Chicago), so membership is exact, and each block
    carries its Census internal point (INTPTLAT/INTPTLON). Sums to 2,746,388.
  - CTA 'L' stops: City of Chicago data portal export (8pix-ypme), 2025-06-27
  - CTA rail lines: City of Chicago "CTA - 'L' (Rail) Lines" GeoJSON (2023)
  - Community areas: Chicago community area boundaries (77 areas)
  - Commute mode / vehicles: CMAP Community Data Snapshots 2023 (ACS 5-yr)

Run: python3 build_data.py   (downloads sources to .cache/ on first run;
the block file is a 25 MB gzip)
"""
import csv
import gzip
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')

SOURCES = {
    'stops.csv': 'https://raw.githubusercontent.com/smblackwll/MachineLearningProject/ebcd28a83afbbb6e79e4e627fbc04f6e357fe87b/CTA_-_System_Information_-_List_of__L__Stops_20250627.csv',
    'lines.geojson': 'https://raw.githubusercontent.com/declankra/chitrack-api-web/main/public/cta_lines_detailed.geojson',
    'il_blocks.csv.gz': 'https://raw.githubusercontent.com/Chicago/Census2020-redistricting/main/data/il2020.pl_COMBINED_BLOCK.csv.gz',
    'comm_areas.geojson': 'https://raw.githubusercontent.com/Crains-Chicago/where-to-buy/master/data/final/community_areas.geojson',
    'cmap_ca.csv': 'https://raw.githubusercontent.com/annacobb412/TNC-EV-Incentive-Analysis/main/Community_Area_profiles_2023.csv',
}

# Planned Red Line Extension stations (95th -> 130th, ~2030).
# Coordinates approximate, read off the CTA RLE preferred-alignment maps.
RLE_STATIONS = [
    {'id': 'rle-103', 'name': '103rd Street (planned)', 'lat': 41.7068, 'lng': -87.6350},
    {'id': 'rle-111', 'name': '111th Street (planned)', 'lat': 41.6922, 'lng': -87.6348},
    {'id': 'rle-michigan', 'name': 'Michigan Avenue (planned)', 'lat': 41.6814, 'lng': -87.6213},
    {'id': 'rle-130', 'name': '130th Street (planned)', 'lat': 41.6580, 'lng': -87.6088},
]
DAN_RYAN_95TH = (41.722377, -87.624342)


def fetch(name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        print('downloading', name)
        urllib.request.urlretrieve(SOURCES[name], path)
    return path


def geom_rings(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for ring in poly:
            yield ring


def geom_bbox(geom):
    xs, ys = [], []
    for ring in geom_rings(geom):
        for x, y in ring:
            xs.append(x)
            ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def point_in_geom(lng, lat, geom):
    """Even-odd ray cast over every ring (holes handled by parity)."""
    inside = False
    for ring in geom_rings(geom):
        for i in range(len(ring) - 1):
            x0, y0 = ring[i]
            x1, y1 = ring[i + 1]
            if (y0 > lat) != (y1 > lat):
                if x0 + (lat - y0) * (x1 - x0) / (y1 - y0) > lng:
                    inside = not inside
    return inside


def main():
    # ---- community areas + CMAP commute stats -------------------------------
    cas = json.load(open(fetch('comm_areas.geojson')))['features']
    name_fix = {'OHARE': "O'HARE", 'LOOP': 'THE LOOP'}  # geojson name -> CMAP name
    cmap = {}
    for r in csv.DictReader(open(fetch('cmap_ca.csv'), encoding='utf-8-sig')):
        tot_comm = float(r['TOT_COMM'])
        tot_hh = sum(float(r[k]) for k in ('NO_VEH', 'ONE_VEH', 'TWO_VEH', 'THREEOM_VEH'))
        cmap[r['GEOG'].upper()] = {
            'name': r['GEOG'],
            'pop2020': int(float(r['2020_POP'])),
            'drive': round((float(r['DROVE_AL']) + float(r['CARPOOL'])) / tot_comm, 4),
            'transit': round(float(r['TRANSIT']) / tot_comm, 4),
            'walkBike': round(float(r['WALK_BIKE']) / tot_comm, 4),
            'wfh': round(float(r['WORK_AT_HOME']) / float(r['TOT_WRKR16OV']), 4),
            'noVeh': round(float(r['NO_VEH']) / tot_hh, 4),
        }
    for ca in cas:
        key = ca['properties']['community'].upper()
        ca['_stats'] = cmap[name_fix.get(key, key)]
        ca['_bbox'] = geom_bbox(ca['geometry'])
        # rough centroid for nearest-CA fallback
        ring = max(geom_rings(ca['geometry']), key=len)
        ca['_cx'] = sum(p[0] for p in ring) / len(ring)
        ca['_cy'] = sum(p[1] for p in ring) / len(ring)
    ca_list = [ca['_stats'] for ca in cas]

    def ca_index(lng, lat):
        for i, ca in enumerate(cas):
            x0, y0, x1, y1 = ca['_bbox']
            if x0 <= lng <= x1 and y0 <= lat <= y1 and point_in_geom(lng, lat, ca['geometry']):
                return i
        # simplified polygons leave slivers along borders: snap to nearest CA
        return min(range(len(cas)),
                   key=lambda i: (cas[i]['_cx'] - lng) ** 2 + (cas[i]['_cy'] - lat) ** 2)

    # ---- blocks: official PL 94-171, PLACE 14000 = City of Chicago ----------
    blocks = []
    city_pop = 0
    n_blocks_total = 0
    with gzip.open(fetch('il_blocks.csv.gz'), 'rt') as fh:
        for r in csv.DictReader(fh):
            if r['PLACE'] != '14000':
                continue
            n_blocks_total += 1
            pop = int(r['POP100'])
            city_pop += pop
            if pop == 0:
                continue  # parks, industry, water: no people, no effect on sums
            lat = float(r['INTPTLAT'])
            lng = float(r['INTPTLON'])
            blocks.append([round(lat, 5), round(lng, 5), pop, ca_index(lng, lat)])
    print(f'Chicago blocks: {n_blocks_total} total, {len(blocks)} populated, pop {city_pop}')

    with open(os.path.join(HERE, 'blocks.json'), 'w') as fh:
        json.dump({'cas': ca_list, 'blocks': blocks}, fh, separators=(',', ':'))

    # ---- stations -----------------------------------------------------------
    stations = {}
    for r in csv.DictReader(open(fetch('stops.csv'))):
        sid = r['MAP_ID']
        loc = r['Location'].strip().strip('()').split(',')
        s = stations.setdefault(sid, {
            'id': sid, 'name': r['STATION_NAME'],
            'lat': round(float(loc[0]), 6), 'lng': round(float(loc[1]), 6),
            'lines': set(), 'ada': False, 'planned': False,
        })
        for k, ln in [('RED', 'Red'), ('BLUE', 'Blue'), ('G', 'Green'),
                      ('BRN', 'Brown'), ('P', 'Purple'), ('Pexp', 'Purple'),
                      ('Y', 'Yellow'), ('Pnk', 'Pink'), ('O', 'Orange')]:
            if r[k].strip().lower() == 'true':
                s['lines'].add(ln)
        if r['ADA'].strip().lower() == 'true':
            s['ada'] = True
    station_list = sorted(stations.values(), key=lambda s: s['name'])
    for s in station_list:
        s['lines'] = sorted(s['lines'])
    for s in RLE_STATIONS:
        station_list.append({**s, 'lines': ['Red'], 'ada': True, 'planned': True})
    print('stations:', len(station_list), '(incl. 4 planned RLE)')

    # ---- rail lines + RLE alignment -----------------------------------------
    lines = json.load(open(fetch('lines.geojson')))
    rle_path = [[DAN_RYAN_95TH[1], DAN_RYAN_95TH[0]]] + \
               [[s['lng'], s['lat']] for s in RLE_STATIONS]
    lines['features'].append({
        'type': 'Feature',
        'properties': {'LINES': 'Red Line Extension (planned)', 'LEGEND': 'RLE'},
        'geometry': {'type': 'LineString', 'coordinates': rle_path},
    })
    with open(os.path.join(HERE, 'lines.geojson'), 'w') as fh:
        json.dump(lines, fh, separators=(',', ':'))

    # ---- data.json ----------------------------------------------------------
    data = {
        'generated': '2026-06-10',
        'cityPop': city_pop,
        'nBlocks': n_blocks_total,
        'nBlocksPopulated': len(blocks),
        'stations': station_list,
        'sources': SOURCES,
        'notes': {
            'population': 'Official 2020 decennial census (PL 94-171) population per block; blocks selected by PLACE=14000 so city membership is exact. People are placed at each block\'s Census internal point.',
            'commute': 'CMAP Community Data Snapshots 2023 (ACS 5-yr) per community area. drive = (drove alone + carpool) / total commuters. Blocks inherit their community area\'s share.',
            'rle': 'Red Line Extension station coordinates approximate, from CTA preferred-alignment maps. Target opening ~2030.',
            'method': 'Distances are block internal point to station, straight line.',
        },
    }
    with open(os.path.join(HERE, 'data.json'), 'w') as fh:
        json.dump(data, fh, separators=(',', ':'))
    print('wrote blocks.json, lines.geojson, data.json')


if __name__ == '__main__':
    main()
