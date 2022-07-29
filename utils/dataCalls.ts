import { collection, getDocs, DocumentData, query, orderBy, limit, DocumentSnapshot, getFirestore, doc, getDoc } from "firebase/firestore";
import { convert } from '../utils/exchangeCurrency';
import { add } from 'mathjs';
import { auth } from '../utils/hooks/useAuthentication';

const db = getFirestore();

export async function getData() {
    console.log('getting data');

    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const userRef = doc(db, 'users', uid);

    let currency;
    try {
        const user = await getDoc(userRef);
        const data = user.data();
        currency = data.currency;
    } catch (e) {
        console.error('Error fetching user settings', e);
    }

    const portfolioRef = collection(db, 'users', uid, 'portfolios');
    let totalValue = 0;
    try {
        const portfolios = await getDocs(portfolioRef);
        let docs: DocumentData[] = [];
        let accs: DocumentData[] = [];
        portfolios.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        for (let index = 0; index < docs.length; index++) {
            const pf = docs[index];
            const accounts = await getAccountsForPortfolio(db, auth, docs[index], currency);
            pf.value = accounts?.totalValue;
            totalValue = add(totalValue, accounts?.totalValue);
            accs = [...accs, ...accounts.docs];
        }
        return { docs, totalValue, accs, currency };
    } catch (e) {
        console.error('Error fetching portfolios for user', e);
    }
};

export async function getPortfolios(db: any, auth: any, currency = 'EUR') {
    const user = auth.currentUser;
    console.log('getting portfolios');
    const uid: string = user?.uid.toString() || '';
    const portfolioRef = collection(db, 'users', uid, 'portfolios');
    let totalValue = 0;
    try {
        const portfolios = await getDocs(portfolioRef);
        let docs: DocumentData[] = [];
        portfolios.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        for (let index = 0; index < docs.length; index++) {
            const pf = docs[index];
            const accounts = await getAccountsForPortfolio(db, auth, docs[index], currency);
            pf.value = accounts?.totalValue;
            totalValue = add(totalValue, accounts?.totalValue);
        }
        return { docs, totalValue };
    } catch (e) {
        console.error('Error fetching portfolios for user', e);
    }
};

export async function getAccountsForPortfolio(db: any, auth: any, pf: any, currency: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const accountsRef = collection(db, 'users', uid, 'portfolios', pf.id, 'accounts');
    try {
        const accounts = await getDocs(accountsRef);
        let docs: DocumentData[] = [];
        let totalValue = 0
        accounts.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id }, ...{ pf } }];
        });
        for (let index = 0; index < docs.length; index++) {
            const acc = docs[index];
            const value = await getLatestAccountValue(db, auth, acc.pf.id, acc.id);
            const defaultValue = [{ amount: "0", currency: acc.currency }]
            const v = value && value.length ? value : defaultValue;
            acc.value = v;
            // EUR value
            const valueEur = await convert(v[0].amount, v[0].currency, currency, '2022-04-27');
            acc.valueEur = [{ amount: valueEur, currency }];
            totalValue = add(totalValue, valueEur);
        }
        return { docs, totalValue };
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
            docs = [...docs, { ...doc.data(), ...{ id: doc.id, ref: doc.ref.path } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching values for account', e);
    }
}

export async function getLatestAccountValue(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const valuesRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'values');
    const q = query(valuesRef, orderBy('date', 'desc'), orderBy('created', 'desc'), limit(1))
    // const q = query(valuesRef, orderBy('date', 'desc'), limit(1))
    try {
        const values = await getDocs(q);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching latest value for account', e);
    }
}

export async function getTransactionsForAccount(db: any, auth: any, pfId: any, accId: any) {
    console.log('getting transactions');
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const transactionsRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    try {
        const values = await getDocs(q);
        let docs: DocumentData[] = [];
        values.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id, ref: doc.ref.path } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching values for account', e);
    }
}

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