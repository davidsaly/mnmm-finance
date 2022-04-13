export type PortfolioType = {
    name: string,
    id: string,
    type: string,
}

export type AccountType = {
    name: string,
    id?: string,
    currency: string,
    portfolio: string,
}

export type ValueType = {
    amount: number,
    currency: string,
    date: string,
}