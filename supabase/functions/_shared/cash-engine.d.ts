// Server-only state; never expose this type's data field in an API response.
export type CashState={model:string;game:string;kind:string;phase:'open'|'settled';stake_minor:number;returned_minor:number;data:Record<string,unknown>};
export const CASH_MODEL:string;
export function newCashRound(game:string,input:Record<string,unknown>):CashState;
export function nextCashRound(state:CashState,command:{action:string;seats?:number[];to?:number}):CashState;
export function publicCash(state:CashState):Record<string,unknown>;
