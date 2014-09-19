# -*- coding: utf-8 -*-

import json

from datetime import datetime

epoch = datetime.strptime('20140814 000000.000', '%Y%m%d %H%M%S.%f')

def unix_time(dt):
    delta = dt - epoch
    return delta.total_seconds()


def unix_time_millis(dt):
    return unix_time(dt) * 1000.0

q = []

weeks = ['vika33', 'vika34', 'vika35', 'vika36', 'vika37', 'vika38']

for week in weeks:
    with open(week + '.txt', 'r') as f:
        for index, line in enumerate(f):
            if index == 0:
                continue

            nr = line[0:4].strip()
            dags = line[5:13].strip()
            timi = line[14:24].strip()
            breidd = line[25:33].strip()
            lengd = line[34:43].strip()
            dypi = line[44:50].strip()
            m = line[51:56].strip()
            ml = line[57:62].strip()

            verify = nr.rjust(4, ' ')
            verify += ' ' + dags.rjust(8, ' ')
            verify += ' ' + timi.rjust(10, ' ')
            verify += ' ' + breidd.rjust(8, ' ')
            verify += ' ' + lengd.rjust(9, ' ')
            verify += ' ' + dypi.rjust(6, ' ')
            verify += ' ' + m.rjust(5, ' ')
            verify += ' ' + ml.rjust(5, ' ')

            dt = datetime.strptime(dags + ' ' + timi, '%Y%m%d %H%M%S.%f')
            o = dict()
            o['dags'] = unix_time_millis(dt)
            o['m'] = m
            o['breidd'] = breidd
            o['lengd'] = lengd
            o['dypi'] = dypi

            if o['dags'] >= 0:
                q.append(o)

            if verify != line.replace('\n', ''):
                print u'Úbs, lína passar ekki'

with open('app/data.json', 'w') as f:
    f.write(json.dumps(q))

print u"Vinnslu lokið"