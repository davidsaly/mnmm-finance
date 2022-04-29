import { getFirestore, collection, getDocs, query, orderBy, limit, where, DocumentSnapshot, DocumentData } from "firebase/firestore";
import { multiply, divide, round } from 'mathjs';

const db = getFirestore();

export async function convert(amount, fromCcy, toCcy, date) {
    const pair1 = { from: '', to: '', invert: false };
    const pair2 = { from: '', to: '', invert: false, used: false };
    let rate1;
    let rate2 = 1;
    if (fromCcy === 'EUR' || fromCcy === 'USD') {
        pair1.from = fromCcy;
        pair1.to = toCcy
    } else if (toCcy === 'EUR' || toCcy === 'USD') {
        pair1.from = toCcy;
        pair1.to = fromCcy;
        pair1.invert = true;
    } else {
        pair1.from = 'EUR';
        pair1.to = fromCcy;
        pair1.invert = true;
        pair2.from = 'EUR';
        pair2.to = toCcy;
        pair2.used = true;
    }
    const rate1Ref = collection(db, 'exchange_rates', pair1.from, pair1.to);
    const rate2Ref = collection(db, 'exchange_rates', pair2.from, pair2.to);
    const q1 = query(rate1Ref, orderBy('date', 'desc'), where('date', '<=', date), limit(1));
    const q2 = query(rate2Ref, orderBy('date', 'desc'), where('date', '<=', date), limit(1));
    try {
        const values = await getDocs(q1);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data() }];
        });
        rate1 = docs.length? docs[0].rate : 1;
    } catch (e) {
        console.error('Error rate 1', e);
    }
    if (pair2.used) {
        try {
            const values = await getDocs(q2);
            let docs: DocumentData[] = [];
            values.forEach(doc => {
                docs = [...docs, { ...doc.data() }];
            });
            rate2 = docs.length? docs[0].rate : 1;
        } catch (e) {
            console.error('Error rate 2', e);
        }
    }
    const multiplier1 = pair1.invert ? divide(1, rate1) : rate1;
    const multiplier2 = pair2.used ? (pair2.invert ? divide(1, rate2) : rate2) : 1;
    const result = round(multiply(amount, multiplier1, multiplier2), 0);
    return result;
}