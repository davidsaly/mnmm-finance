import { difference, find, findIndex } from 'lodash';

export const orderSeriesFromDate = (series: any[]) => {
    if (series.length === 0 || series.length === 1) {
        return series;
    }
    const previous = series.map(s => s.previousRef.id);
    const ids = series.map(s => s.id);
    const diff = difference(previous, ids);
    const first = find(series, item => item.previousRef.id === diff[0]);
    const res: any[] = [];
    res.push(first);
    for (let index = 0; index < series.length - 1; index++) {
        const next = res[res.length - 1].nextRef.id;
        const toPush = find(series, item => item.id === next);
        res.push(toPush);
    }
    return res;
}