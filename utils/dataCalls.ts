import { collection, getDocs, DocumentData, query, orderBy, limit, DocumentSnapshot } from "firebase/firestore";

export async function getPortfolios(db: any, auth: any) {
    const user = auth.currentUser;
    console.log('getting portfolios');
    const uid: string = user?.uid.toString() || '';
    const portfolioRef = collection(db, 'users', uid, 'portfolios');
    try {
        const portfolios = await getDocs(portfolioRef);
        let docs: DocumentData[] = [];
        portfolios.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id } }];
        });
        //   setData(docs);
        return docs;
    } catch (e) {
        console.error('Error fetching portfolios for user', e);
    }
};

export async function getAccountsForPortfolio(db: any, auth: any, pf: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const accountsRef = collection(db, 'users', uid, 'portfolios', pf.id, 'accounts');
    try {
        const accounts = await getDocs(accountsRef);
        let docs: DocumentData[] = [];
        accounts.forEach(doc => {
            docs = [...docs, { ...doc.data(), ...{ id: doc.id }, ...{ pf } }];
        });
        return docs;
    } catch (e) {
        console.error('Error fetching accounts for portfolio', e);
    }
}

export async function getAccounts(db: any, auth: any, portfolios: any) {
    let docs: DocumentData[] = [];
    for (let index = 0; index < portfolios.length; index++) {
        const accounts: DocumentData[] | undefined = await getAccountsForPortfolio(db, auth, portfolios[index]);
        docs = [...docs, ...accounts];
    }
    for (let index = 0; index < docs.length; index++) {
        const acc = docs[index];
        const value = await getLatestAccountValue(db, auth, acc.pf.id, acc.id);
        const defaultValue = [{ amount: "0", currency: acc.currency }]
        const v = value && value.length ? value : defaultValue;
        acc.value = v;
    }
    return docs;
}

export async function getValuesForAccount(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const valuesRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'values');
    const q = query(valuesRef, orderBy('date', 'desc'));
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

export async function getLatestAccountValue(db: any, auth: any, pfId: any, accId: any) {
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const valuesRef = collection(db, 'users', uid, 'portfolios', pfId, 'accounts', accId, 'values');
    const q = query(valuesRef, orderBy('date', 'desc'), limit(1))
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