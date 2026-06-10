#!/usr/bin/env python3
"""
Build data files for the Chicago Train Proximity map.

Outputs (written next to this script):
  - tracts.geojson : Chicago 2020 census tracts w/ population, community area,
                     drive-to-work share, precomputed centroid
  - data.json      : CTA stations (+ planned Red Line Extension), community-area
                     commute stats, citywide aggregates, metadata
  - lines.geojson  : CTA rail line geometry + planned RLE alignment

Sources (all fetched from public GitHub mirrors; see SOURCES below):
  - CTA 'L' stops: City of Chicago data portal export (8pix-ypme), 2025-06-27
  - CTA rail lines: City of Chicago "CTA - 'L' (Rail) Lines" GeoJSON (2023)
  - Tract boundaries: Census cartographic boundary files, 2020, 500k, Illinois
  - Tract population: Cook County DPH ACS 5-yr age/sex by tract (2016-2020,
    2020 tract vintage) - males + females summed
  - Community areas: Chicago community area boundaries (77 areas)
  - Commute mode / vehicles: CMAP Community Data Snapshots 2023 (ACS 5-yr)

Run: python3 build_data.py   (downloads sources to .cache/ on first run)
"""
import csv
import json
import math
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')

SOURCES = {
    'stops.csv': 'https://raw.githubusercontent.com/smblackwll/MachineLearningProject/ebcd28a83afbbb6e79e4e627fbc04f6e357fe87b/CTA_-_System_Information_-_List_of__L__Stops_20250627.csv',
    'lines.geojson': 'https://raw.githubusercontent.com/declankra/chitrack-api-web/main/public/cta_lines_detailed.geojson',
    'il_tracts.json': 'https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2020/17/tract.json',
    'agesex.csv': 'https://raw.githubusercontent.com/Cook-County-Department-of-Public-Health/ccdph-data-sets/main/acs/acs-5yr-age-sex-by-tract.csv',
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


def ring_centroid_area(ring):
    """Signed area (deg^2) and centroid of one linear ring [[lng,lat],...]."""
    a = cx = cy = 0.0
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]
        x1, y1 = ring[i + 1]
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    a /= 2.0
    if abs(a) < 1e-12:
        return 0.0, ring[0][0], ring[0][1]
    return a, cx / (6 * a), cy / (6 * a)


def geom_centroid(geom):
    """Area-weighted centroid of a Polygon/MultiPolygon (holes subtract)."""
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    tot = cx = cy = 0.0
    for poly in polys:
        for ring in poly:
            a, x, y = ring_centroid_area(ring)
            tot += a
            cx += x * a
            cy += y * a
    if tot == 0:
        ring = polys[0][0]
        return ring[0][0], ring[0][1]
    return cx / tot, cy / tot


def point_in_geom(lng, lat, geom):
    """Even-odd ray cast over every ring (holes handled by parity)."""
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    inside = False
    for poly in polys:
        for ring in poly:
            for i in range(len(ring) - 1):
                x0, y0 = ring[i]
                x1, y1 = ring[i + 1]
                if (y0 > lat) != (y1 > lat):
                    xint = x0 + (lat - y0) * (x1 - x0) / (y1 - y0)
                    if xint > lng:
                        inside = not inside
    return inside


def round_coords(obj, nd=5):
    if isinstance(obj, float):
        return round(obj, nd)
    if isinstance(obj, list):
        return [round_coords(v, nd) for v in obj]
    return obj


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
            'drive': (float(r['DROVE_AL']) + float(r['CARPOOL'])) / tot_comm,
            'transit': float(r['TRANSIT']) / tot_comm,
            'walkBike': float(r['WALK_BIKE']) / tot_comm,
            'wfh': float(r['WORK_AT_HOME']) / float(r['TOT_WRKR16OV']),
            'noVeh': float(r['NO_VEH']) / tot_hh,
        }
    ca_stats = {}
    for f in cas:
        key = f['properties']['community'].upper()
        ca_stats[key] = cmap[name_fix.get(key, key)]

    # ---- tract population ---------------------------------------------------
    pop = {}
    for r in csv.DictReader(open(fetch('agesex.csv'))):
        g = r['GEOID_tract'].strip('"')
        pop[g] = pop.get(g, 0) + int(r['Total'])

    # ---- tracts: filter Cook -> Chicago (centroid in a community area) ------
    il = json.load(open(fetch('il_tracts.json')))['features']
    out_feats = []
    city_pop = 0
    for f in il:
        p = f['properties']
        if p['COUNTYFP'] != '031':
            continue
        lng, lat = geom_centroid(f['geometry'])
        ca_name = None
        for ca in cas:
            if point_in_geom(lng, lat, ca['geometry']):
                ca_name = ca['properties']['community'].upper()
                break
        if ca_name is None:
            continue  # Cook County tract outside Chicago
        tract_pop = pop.get(p['GEOID'], 0)
        city_pop += tract_pop
        st = ca_stats[ca_name]
        out_feats.append({
            'type': 'Feature',
            'properties': {
                'id': p['GEOID'],
                'name': p['NAMELSAD'],
                'pop': tract_pop,
                'ca': st['name'],
                'drive': round(st['drive'], 4),
                'transit': round(st['transit'], 4),
                'noVeh': round(st['noVeh'], 4),
                'sqmi': round(p['ALAND'] / 2589988.11, 4),
                'cLat': round(lat, 6),
                'cLng': round(lng, 6),
            },
            'geometry': {'type': f['geometry']['type'],
                         'coordinates': round_coords(f['geometry']['coordinates'])},
        })
    print('Chicago tracts:', len(out_feats), 'population:', city_pop)

    with open(os.path.join(HERE, 'tracts.geojson'), 'w') as fh:
        json.dump({'type': 'FeatureCollection', 'features': out_feats}, fh,
                  separators=(',', ':'))

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
        'nTracts': len(out_feats),
        'stations': station_list,
        'commAreas': {v['name']: {k: (round(val, 4) if isinstance(val, float) else val)
                                  for k, val in v.items() if k != 'name'}
                      for v in ca_stats.values()},
        'sources': SOURCES,
        'notes': {
            'population': 'ACS 2016-2020 5-yr totals per 2020 census tract (Cook County DPH), male+female summed.',
            'commute': 'CMAP Community Data Snapshots 2023 (ACS 5-yr) per community area. drive = (drove alone + carpool) / total commuters.',
            'rle': 'Red Line Extension station coordinates approximate, from CTA preferred-alignment maps. Target opening ~2030.',
            'method': 'Tracts assigned to Chicago / community areas by polygon centroid. Distances are tract-centroid to station, straight line.',
        },
    }
    with open(os.path.join(HERE, 'data.json'), 'w') as fh:
        json.dump(data, fh, separators=(',', ':'))
    print('wrote tracts.geojson, lines.geojson, data.json')


if __name__ == '__main__':
    main()
