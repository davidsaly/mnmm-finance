import { collection, getDocs, DocumentData, query, orderBy, limit, DocumentSnapshot, getFirestore, doc, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { convert } from '../utils/exchangeCurrency';
import { add, round, divide, subtract, multiply } from 'mathjs';
import { auth } from '../utils/hooks/useAuthentication';
import {
    useQuery,
} from 'react-query'
import { get } from 'lodash';

const db = getFirestore();

export async function getData() {
    console.log('getting data series');

    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const userRef = doc(db, 'users', uid);

    // user currency
    let currency;
    try {
        const user = await getDoc(userRef);
        const data = user.data();
        currency = data.currency;
    } catch (e) {
        console.error('Error fetching user settings', e);
    }

    // user portfolios
    const portfolioRef = collection(db, 'users', uid, 'portfolios');
    let totalValue = 0;
    try {
        const portfolios = await getDocs(portfolioRef);
        let docs: DocumentData[] = [];
        let accs: DocumentData[] = [];
        portfolios.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        // portfolio series and accounts
        for (let index = 0; index < docs.length; index++) {
            const pf = docs[index];
            const pfSeries = await getLatestPortfolioSeries(db, auth, docs[index].id);
            const accounts = await getAccountsForPortfolio(db, auth, docs[index], currency, pf.type);
            pf.value = round(get(pfSeries, `[0].amount[${currency}]`, 0), 0);
            if (pf.type === 'nonperforming') {
                pf.income = round(get(pfSeries, `[0].income[${currency}]`, 0), 0)
                pf.spending = round(get(pfSeries, `[0].spending[${currency}]`, 0), 0)
            } else if (pf.type === 'performing') {
                pf.inflows = round(get(pfSeries, `[0].inflows.index[${currency}]`, 0), 0)
                pf.outflows = round(get(pfSeries, `[0].outflows.index[${currency}]`, 0), 0)
                const startPerformance = 100
                pf.performance = round(
                    multiply(
                        subtract(
                            divide(
                                get(pfSeries, `[0].performance[${currency}]`, 100),
                                startPerformance),
                            1),
                        100), 2);
                pf.pl = subtract(pf.value, add(pf.inflows, pf.outflows));
            }
            totalValue = add(totalValue, pf.value);
            accs = [...accs, ...accounts];
        }
        return { docs, totalValue, accs, currency };
    } catch (e) {
        console.error('Error fetching portfolios for user', e);
    }
};

export async function getAccountsForPortfolio(db: any, auth: any, pf: any, currency: any, pfType: string) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const accountsRef = collection(db, 'users', uid, 'portfolios', pf.id, 'accounts');
    try {
        const accounts = await getDocs(accountsRef);
        let docs: DocumentData[] = [];
        accounts.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id }, ...{ pf } }];
        });
        for (let index = 0; index < docs.length; index++) {
            const acc = docs[index];
            const series = await getLatestAccountSeries(db, auth, acc.pf.id, acc.id);
            acc.pfType = pfType;
            acc.value = [{ amount: round(get(series,`[0].amount[${acc.currency}]`, 0), 2), currency: acc.currency }];
            acc.valueBase = [{ amount: round(get(series,`[0].amount[${currency}]`, 0), 2), currency }];
            if (pfType === 'nonperforming') {
                acc.income = round(get(series, `[0].income[${currency}]`, 0), 0)
                acc.spending = round(get(series, `[0].spending[${currency}]`, 0), 0)
            } else if (pfType === 'performing') {
                acc.inflows = round(get(series, `[0].inflows.index[${currency}]`, 0), 0)
                acc.outflows = round(get(series, `[0].outflows.index[${currency}]`, 0), 0)
                const startPerformance = 100
                acc.performance = round(
                    multiply(
                        subtract(
                            divide(
                                get(series, `[0].performance[${currency}]`, 100),
                                startPerformance),
                            1),
                        100), 2);
                acc.pl = round(subtract(acc.valueBase[0].amount, add(acc.inflows, acc.outflows)),0);
            }
            acc.date = get(series,`[0].date`, 'na');
        }
        return docs;
    } catch (e) {
        console.error('Error fetching accounts for portfolio', e);
    }
}

export async function getAccounts(db: any, auth: any, portfolios: any, currency: any) {
    let docs: DocumentData[] = [];
    for (let index = 0; index < portfolios.length; index++) {
        const accounts = await getAccountsForPortfolio(db, auth, portfolios[index], currency); // : DocumentData[] | undefined
        docs = [...docs, ...accounts.docs];
    }
    return docs;
}

export async function getValuesForAccount(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const valuesRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'values');
    const q = query(valuesRef, orderBy('date', 'desc'), orderBy('created', 'desc'));
    // const q = query(valuesRef, orderBy('date', 'desc'));
    try {
        const values = await getDocs(q);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching values for account', e);
    }
}

export async function getLatestAccountSeries(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const seriesRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'series');
    const q = query(seriesRef, orderBy('date', 'desc'), orderBy('created', 'desc'), limit(1))
    // const q = query(valuesRef, orderBy('date', 'desc'), limit(1))
    try {
        const series = await getDocs(q);
        let docs: DocumentData[] = [];
        series.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching latest series for account', e);
    }
}

export async function getLatestPortfolioSeries(db: any, auth: any, pfId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const seriesRef = collection(db, 'users', uid, 'portfolios', pfId, 'series');
    const q = query(seriesRef, orderBy('date', 'desc'), orderBy('created', 'desc'), limit(1))
    // const q = query(seriesRef, orderBy('date', 'desc'), limit(1))
    try {
        const series = await getDocs(q);
        let docs: DocumentData[] = [];
        series.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching latest portfolio series for account', e);
    }
}

export async function getTransactionsForAccount(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const transactionsRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    try {
        const values = await getDocs(q);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching values for account', e);
    }
}

export const loadTransactions = (acc) => useQuery(['loadTransactions', acc], async () => {
    console.log('loading transactions');
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const transactionsRef = collection(db, 'users', uid, 'portfolios', acc.variables.pfId, 'accounts', acc.variables.accId, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    try {
        const values = await getDocs(q);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching values for account', e);
    }
}, {
    placeholderData: [],
})

export async function loadCurrencyList() {
    console.log('getting currencies');
    const currenciesRef = collection(db, 'currencies');
    try {
        const currencies = await getDocs(currenciesRef);
        let docs: [] = [];
        currencies.forEach(ccy => {
            docs = [...docs, { ...ccy.data() }];
        });
        console.log('loaded currencies');
        return docs;
    } catch (e) {
        console.error('Error fetching currency list', e);
    }
}