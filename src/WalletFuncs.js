import nacl from 'tweetnacl';
const algosdk =  require('algosdk/dist/cjs');
import Utils from './Utils';
import { panel,  copyable, heading, text, divider } from '@metamask/snaps-ui';
export default class WalletFuncs{
    
    //takes an instance of algowallet on construction
    constructor(algoWallet){
        this.wallet = algoWallet;
        
        this.networkStr = this.wallet.testnet?" (Testnet)":" (Mainnet)"
    }

    #signAndPost(txn, algod){
        const sig = txn.signTxn(this.wallet.sk);
        const txId = txn.txID().toString();
        algod.sendRawTransaction(sig).do();
        return txId
    }

    async #getParams(algod){
        const suggestedParams = await algod.getTransactionParams().do();
        return suggestedParams;
    }

    async getTransactions(){
        const indexerClient = this.wallet.getIndexer();
        const addr = this.wallet.getAddress();
        const transactions =  await indexerClient.lookupAccountTransactions(addr).do();
        return transactions;
    }
    async getAssets(){
        const indexerClient = this.wallet.getIndexer()
        const addr = this.wallet.getAddress();
        const accountAssets = await indexerClient.lookupAccountByID(addr).do();
        if(accountAssets.account === undefined){
            return [];
        }
        if(accountAssets.account.assets === undefined){
            //no assets
            return [];
        }
        let assets = accountAssets.account.assets;
        for(let asset of assets){
            asset['asset'] = (await indexerClient.searchForAssets()
            .index(asset['asset-id']).do()).assets;
        }
        return assets;
    }
    
    async getAssetById(id){
        const indexerClient = this.wallet.getIndexer();
        return (await (indexerClient.searchForAssets()
            .index(id).do())).assets[0];
    }

    async getBalance(){
        const algodClient = this.wallet.getAlgod();
        const addr = this.wallet.getAddress();
        const output = (await algodClient.accountInformation(addr).do())
        const balance = output.amount;
        return balance;
    }

    async getSpendable(){
        const algodClient = this.wallet.getAlgod();
        const addr = this.wallet.getAddress();
        const output = (await algodClient.accountInformation(addr).do())
        let spendable = BigInt(output["amount-without-pending-rewards"])-BigInt(output['min-balance']);
        if(spendable < 0){
            spendable = 0;
        }
        return spendable;
    }

    isValidAddress(address){
        return algosdk.isValidAddress(address);
    }

    async displayMnemonic(){
        const confirm = await Utils.sendConfirmation(
            "confirm", 
            "Are you sure you want to display your mnemonic?",
            "anyone with this mnemonic can spend your funds"
        )

        if(!confirm){
            Utils.throwError(4001, "user rejected Mnemonic Request");
        }

        await Utils.displayPanel(
            panel([
                heading("address"),
                copyable(this.wallet.addr),
                divider(),
                heading("mnemonic"),
                copyable(algosdk.secretKeyToMnemonic(this.wallet.sk))
            ]), "alert"
        )
        
        //metamask requires a value to be returned
        return true;
    }

    async signData(message){

        const confirm = await Utils.sendConfirmation(
            "confirm",
            `Are you sure you want to sign this message:`,
            `${JSON.stringify(message)}`
        )

        if(!confirm){
            Utils.throwError(4001, "user rejected signData Request");
        }
        const sk = new Uint8Array(this.wallet.sk);
        const message_ = new TextEncoder().encode(message);
        const sig = nacl.sign(message_, sk)
        const base64Encoded = Buffer.from(sig).toString('base64');

        await Utils.displayPanel(
            panel([
                heading("Signature is:"),
                copyable(base64Encoded),
            ]), "alert"
        )
        
        // return base64 signature
        return base64Encoded;
    }

    async encryptMessage(message){

        const confirm = await Utils.sendConfirmation(
            "confirm",
            `Are you sure you want to encrypt this message:`,
            `${JSON.stringify(message)}`
        )

        if(!confirm){
            Utils.throwError(4001, "user rejected encryptMessage Request");
        }
        const sk = new Uint8Array(this.wallet.sk);
        const secretKeyUint8Array = sk.slice(0,32);
        const nonce = nacl.randomBytes(24);
        const messageUint8Array = new TextEncoder().encode(message);      
        const encryptedMessage = nacl.secretbox(messageUint8Array, nonce, secretKeyUint8Array);
        const fullMessage = new Uint8Array(nonce.length + encryptedMessage.length);
        fullMessage.set(encryptedMessage);
        fullMessage.set(nonce, encryptedMessage.length);
        const base64Encoded = Buffer.from(fullMessage).toString('base64');
      
        await Utils.displayPanel(
            panel([
                heading("Encrypted message is: "),
                copyable(base64Encoded),
            ]), "alert"
        )
        
        // return base64 signature
        return base64Encoded;
    }

    async decryptMessage(cipher){

        const confirm = await Utils.sendConfirmation(
            "confirm",
            `Are you sure you want to decrypt this message:`,
            `${JSON.stringify(cipher)}`
        )

        if(!confirm){
            Utils.throwError(4001, "user rejected decryptMessage Request");
        }
        const sk = new Uint8Array(this.wallet.sk);
        const secretKeyUint8Array = sk.slice(0,32);
        const cipherUint8Array = new Uint8Array(Buffer.from(cipher, "base64"))
        const nonce = cipherUint8Array.slice(-24); // last 24 bytes are nonce
        const box = cipherUint8Array.slice(0, -24);
        const msg = nacl.secretbox.open(box, nonce, secretKeyUint8Array);

        const msg_str = new TextDecoder().decode(msg);
        
        if(msg == null){
            Utils.throwError(4001, "Failed decryptMessage Request");
        }
      
        await Utils.displayPanel(
            panel([
                heading("Decrypted message is: "),
                copyable(msg_str),
            ]), "alert"
        )
        
        // return base64 signature
        return msg_str;
    }
    

    async publicKeyEncryptMessage(message, public_key){

        const confirm = await Utils.sendConfirmation(
            "confirm",
            `Are you sure you want to encrypt this message?`,
            `message: \n ${JSON.stringify(message)} \n public key: \n ${public_key}`
        )

        
        if(!confirm){
            Utils.throwError(4001, "user rejected PublicKeyencryptMessage Request");
        }

        const sk = new Uint8Array(this.wallet.sk);
        const secretKeyUint8Array = sk.slice(0,32);

        const pkUint8Array = new Uint8Array(Buffer.from(public_key, 'hex'));

        const messageUint8Array = new TextEncoder().encode(message);
        const nonce = nacl.randomBytes(24);

        const encUint8Array = nacl.box(messageUint8Array, nonce, pkUint8Array, secretKeyUint8Array)
        const fullMessage = new Uint8Array(nonce.length + encUint8Array.length);
        fullMessage.set(encUint8Array);
        fullMessage.set(nonce, encUint8Array.length);

        const base64Encoded = Buffer.from(fullMessage).toString('base64');

        await Utils.displayPanel(
            panel([
                heading("Public Key Encrypted message is: "),
                copyable(base64Encoded),
            ]), "alert"
        )
        return base64Encoded
    }

    async publicKeyDecryptMessage(cipher, public_key){

        const confirm = await Utils.sendConfirmation(
            "confirm",
            `Are you sure you want to decrypt this message:`,
            `${JSON.stringify(cipher)}`,
            `With this public key: `,
            `${public_key}`
        )

        
        if(!confirm){
            Utils.throwError(4001, "user rejected PublicKeyencryptMessage Request");
        }

        const cipherUint8Array = new Uint8Array(Buffer.from(cipher, "base64"))
        const nonce = cipherUint8Array.slice(-24); // last 24 bytes are nonce
        const box = cipherUint8Array.slice(0, -24);

        const sk = new Uint8Array(this.wallet.sk);
        const secretKeyUint8Array = sk.slice(0,32);

        const pkUint8Array = new Uint8Array(Buffer.from(public_key, 'hex'));
        const msg = nacl.box.open(box, nonce, pkUint8Array, secretKeyUint8Array)

        if(msg == null){
            Utils.throwError(4001, "Failed PublicKeyDecryptMessage Request");
        }

        const msg_str = new TextDecoder().decode(msg);

        await Utils.displayPanel(
            panel([
                heading("Public Key Decrypted message is: "),
                copyable(msg_str),
            ]), "alert"
        )
        return msg_str
    }
    
    
    async transfer(receiver, amount, note){
        //user confirmation
        this.networkStr = this.wallet.testnet?"Testnet":"Mainnet"
        let display;
        amount =  BigInt(amount)
        if(note===undefined){
            note = undefined
            display =  panel([
                heading("Confirm Transfer"),
                text(this.networkStr),
                divider(),
                text("From"),
                text(`${this.wallet.getName()}  (${this.wallet.addr.substring(0,4)}...${this.wallet.addr.slice(-4)})`),
                text("to"),
                copyable(receiver),
                text("amount"),
                text(`${Number(amount/BigInt(1000000)).toFixed(3)} Algo`),
                ]
            )
        }
        else{
            display =  panel([
                heading("Confirm Transfer"),
                text(this.networkStr),
                divider(),
                text("Send From"),
                text(`${this.wallet.getName()}  (${this.wallet.addr.substring(0,4)}...${this.wallet.addr.slice(-4)})`),
                text("To"),
                copyable(receiver),
                text("amount"),
                text(`${Number(amount/BigInt(1000000)).toFixed(3)} Algo`),
                divider(),
                text("note"),
                copyable(note)
                ]
            )
            const enc = new TextEncoder();
            note = enc.encode(note);
        }
        const confirm = await Utils.displayPanel(display, "confirmation");
        if(!confirm){
            return Utils.throwError(4001, "user rejected Transaction");
        }

        const algod = this.wallet.getAlgod();

        amount = BigInt(amount);
        let params = await this.#getParams(algod);
        //create a payment transaction

        let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: this.wallet.addr, 
            to: receiver, 
            amount: amount, 
            note: note,
            suggestedParams: params
        });


        
        
        let txId;
        try{
            txId = this.#signAndPost(txn, algod);
            await algosdk.waitForConfirmation(algod, txId, 4)
            
            await Utils.notify("Transaction Successful");
            
            return txId;
        }
        catch(e){
            await Utils.notify("Transaction failed");
            return Utils.throwError(e);
        }
           
    }
    
    async AssetOptIn(assetIndex){
        this.networkStr = this.wallet.testnet?" (Testnet)":" (Mainnet)"
        const confirm = await Utils.sendConfirmation(
            "confirm OptIn"+this.networkStr, 
            "opt in to asset "+assetIndex+"?");
        if(!confirm){
            return Utils.throwError(4001, "user rejected Transaction");
        }

        const algod = this.wallet.getAlgod();
        const suggestedParams = await this.#getParams(algod);
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: this.wallet.addr,
            assetIndex: assetIndex,
            to: this.wallet.addr,
            amount: 0,
            suggestedParams: suggestedParams
        });

        let txId
        try{
            txId = this.#signAndPost(txn, algod);
            await algosdk.waitForConfirmation(algod, txId, 4)
        }
        catch(e){
            await Utils.notify("Opt in failed")
            return Utils.throwError(e);
        }
        await Utils.notify("opt in Succeeded: "+assetIndex);
        return txId;
    }

    async assetOptOut(assetIndex){
        this.networkStr = this.wallet.testnet?" (Testnet)":" (Mainnet)"
        const confirm = await Utils.sendConfirmation("confirm OptOut"+this.networkStr, "opt out of asset "+assetIndex+"?\n you will lose all of this asset");
        if(!confirm){
            Utils.throwError(4001, "user rejected Transaction");
        }
        const algod = this.wallet.getAlgod();
        const suggestedParams = await this.#getParams(algod);
        let closeAddress = (await this.getAssetById(assetIndex)).params.creator;
        
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: this.wallet.addr,
            assetIndex: assetIndex,
            to: closeAddress,
            amount: 0,
            suggestedParams: suggestedParams,
            closeRemainderTo: closeAddress
        });
        let txId;
        try{
            txId = this.#signAndPost(txn, algod);
            await algosdk.waitForConfirmation(algod, txId, 4)
        }
        catch(e){
            console.error(e);
            await Utils.notify("opt out Failed");
            return Utils.throwError(e);
        }
        await Utils.notify("opt out sucessful");
        return txId;
          
    }
    
    async TransferAsset(assetIndex, receiver, amount){
        this.networkStr = this.wallet.testnet?" (Testnet)":" (Mainnet)"
        const confirm = await Utils.sendConfirmation("confirm Transfer"+this.networkStr, "send "+amount+"? of : "+assetIndex+" to "+receiver+"?");
        if(!confirm){
            return Utils.throwError(4001, "user rejected Transaction");
        }
        const algod = this.wallet.getAlgod();
        const suggestedParams = await this.#getParams(algod);
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: this.wallet.addr,
            assetIndex: assetIndex,
            to: receiver,
            amount: amount,
            suggestedParams: suggestedParams
        });

        let txId;
        try{
            txId = this.#signAndPost(txn, algod);
            await algosdk.waitForConfirmation(algod, txId, 4)
        }
        catch(e){
            await Utils.notify("Transfer Failed");
            return Utils.trh(err);
            
        }
        await Utils.notify("Transfer Successful: ", result['confirmed-round']);
        
        return txId;           
    }

    async AppOptIn(appIndex){
        this.networkStr = this.wallet.testnet?" (Testnet)":" (Mainnet)"
        const confirm = await Utils.sendConfirmation("confirm OptIn"+this.networkStr, "opt in to app "+appIndex+"?");
        if(!confirm){
            return Utils.throwError(4001, "user rejected Transaction");
        }
        const algod = this.wallet.getAlgod();
        const suggestedParams = await this.#getParams(algod);
        const txn = algosdk.makeApplicationOptInTxnFromObject({
            from: this.wallet.addr,
            appIndex: appIndex,
            suggestedParams: suggestedParams
        });
        



        let txId;
        try{
            txId = this.#signAndPost(txn, algod);
            await algosdk.waitForConfirmation(algod, txId, 4)
        }
        catch(e){
            console.error(e);
            await Utils.notify("Opt In Failed");
            return Utils.throwError(e);
        }
        await Utils.notify(`Opt In Successful: ${appIndex}`);
        return txId;
        
        
    }
    

    async signLogicSig(logicSigAccount){
        let confirm = await Utils.sendConfirmation("sign logic sig?", "Are you sure", "Signing a logic signature gives a smart contract the ability to sign transactions on your behalf even on the mainnet. This can result in the loss of funds");
        if(!confirm){
            Utils.throwError(4001, "user rejected Request");
        }
        const logicBytes = new Uint8Array(Buffer.from(logicSigAccount, 'base64'));
        logicSigAccount = algosdk.LogicSigAccount.fromByte(logicBytes)
        logicSigAccount.sign(this.wallet.sk);
        const signedAccount = Buffer.from(logicSigAccount.toByte()).toString('base64')
        return signedAccount;
    }

}