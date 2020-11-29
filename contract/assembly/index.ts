import {Context, logging, storage, PersistentMap} from 'near-sdk-as'

const defaultState = "not found"
let balances = new PersistentMap<string, i32>("b:");
let approves = new PersistentMap<string, i32>("a:");

let TOTAL_SUPPLY: i32 = 10000000;

export function totalSupply(): string {
    return TOTAL_SUPPLY.toString();
}

export function newBet(bet: i32, gameState: string): void {
    approves.delete(Context.sender + ':' + 'seadox3.testnet')
    transfer('seadox3.testnet', bet)
    setGameState(gameState)
}

export function setGameState(gameState: string): void {
    const account_id = Context.sender
    storage.set<string>(account_id, gameState)
}

export function getGameState(account_id: string): string | null {
    return storage.get<string>(account_id, defaultState)
}

export function endGame(playerWon: i32): void {
    storage.delete(Context.sender)
    if (playerWon === 1) {
        transferFrom('seadox3.testnet', Context.sender, 10)
        logging.log('transfering 2*bet to ' + Context.sender)
    }
}

export function init(): void {
    logging.log("initialOwner: " + Context.sender);
    assert(storage.get<string>("init") == null, "Already initialized token supply");
    balances.set(Context.sender, TOTAL_SUPPLY);
    storage.set<string>("init", "done");
}


export function balanceOf(tokenOwner: string): i32 {
    logging.log("balanceOf: " + tokenOwner);
    if (!balances.contains(tokenOwner)) {
        return 0;
    }
    let result = balances.getSome(tokenOwner);
    return result;
}

export function transfer(to: string, tokens: i32): boolean {
    logging.log("transfer from: " + Context.sender + " to: " + to + " tokens: " + tokens.toString());
    let fromAmount = balanceOf(Context.sender);
    assert(fromAmount >= tokens, "not enough tokens on account");
    balances.set(Context.sender, fromAmount - tokens);
    balances.set(to, balanceOf(to) + tokens);
    return true;
}

export function allowance(tokenOwner: string, spender: string): i32 {
    const key = tokenOwner + ":" + spender;
    if (!approves.contains(key)) {
        return 0;
    }
    return approves.getSome(key);
}

function getBalance(owner: string): i32 {
    return balances.contains(owner) ? balances.getSome(owner) : 0;
}

function transferFrom(from: string, to: string, tokens: i32): boolean {
    const fromAmount = getBalance(from);
    logging.log('from amount: ' + fromAmount.toString())
    logging.log(tokens.toString())
    assert(fromAmount >= tokens, "not enough tokens on account");
    assert(getBalance(to) <= getBalance(to) + tokens, "overflow at the receiver side");
    balances.set(from, fromAmount - tokens);
    balances.set(to, getBalance(to) + tokens);
    logging.log('Transfered:' + tokens.toString() + ' tokens to winner!')
    return true;
}
