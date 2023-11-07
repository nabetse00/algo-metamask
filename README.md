# SNAPALGO

## ALGORAND on MetaMask
SnapAlgo is an Algorand wallet built on metamask developmental snaps feature which allows code to be run in a secure execution enviroment inside the metamask extension itself. Because the feature is so new it is currently only available on Metamask Flask which can be found here
[https://metamask.io/flask/](https://metamask.io/flask/)

## Usage
### building
> npx yarn
> npx mm-snap build
if a `Removing intrinsics.Symbol.dispose failed to delete intrinsics.Symbol.dispose`
error is emited just discard it, only check `Build success: 'src\index.js' bundled as 'dist\bundle.js'!`

compiles the src folder into a functional version of the snap
### serving

Update manifest "shasum" first

> npx mm-snap manifest --fix

> npx mm-snap serve

Serves index.html on port 9000
Can be changed in [snap.config.js](./snap.config.js)

This Command does both on file changes

> npx mm-snap watch


### Connect and Install
Add and Call the below function to connect to the wallet.
If the user does not have the snap installed, but has metamask flask installed this code will automaticly install it for them. **This code snippet can be added to any website with 0 depenancies otheer than metamask flask**

```javascript
async function connect () {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      'npm:@algorandfoundation/algorand-metamask-snap': {},
    },
  });
}
```

### Calling RPC Methods
Below is an example call to the snap that transacts 1000 microalgos to an entered public address. Again this can be run with 0 dependency other than metamask flask
---
All methods can be called with the param:
testnet: (bool)
if the method does not depend on the testnet it is ignored
if the method can be used with testnet, testnet is then used instead
---
```javascript
const address = prompt("Please enter your recipient Address");
const response = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
        method: 'transfer',
        params: {
          to: address,
          amount: 1000,
          testnet: false
        }
    },
  },
});
```


## Available RPC Methods
---
## Cryptographic functions

Uses your private and public key to perform some cryptographic functions:
- sign a message (ed25519)
- encrypt / decrypt a message (xsalsa20-poly1305)
- Public-key authenticated encryption and de(x25519-xsalsa20-poly1305)

### signData
This function signs a message with your key pair.
Returns signature base64 encoded

```javascript
   async function signData(){
      let sig = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapId, 
          request: {
            method: 'signData',
            params:{
              message: 'your message'
            }
          }
        }        
      })
      return sig
    }
```

### encryptMessage
This function encrypts a message with your private key.
Encoded message is base64(cipher + nonce)

```javascript
    async function encryptMessage(){    
      let enc = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapId, 
          request: {
            method: 'encryptMessage',
            params:{
              message: 'your message'
            }
          }
        }        
      })
      return enc
    }
```

### decryptMessage
This function decrypts a message encoded with your private key
messge format is base64(cipher + nonce). Returns decode message string.
```javascript
    async function decryptMessage(){
      let dec = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapId, 
          request: {
            method: 'decryptMessage',
            params:{
              message: "base64(cipher + nonce)"
            }
          }
        }        
      })
      return dec
    }

```

### PublicKeyEncryptMessage
This function encrypts a message with provided public key and your private key.
Encoded message is base64 encoded concatenation of ciphertext and nonce

```javascript
async function PublicKeyEncryptMessage(){
      let dec = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapId, 
          request: {
            method: 'PublicKeyEncryptMessage',
            params:{
              message: "your message",
              public_key: "<pk hex encoded str>"
            }
          }
        }        
      })
      return dec
    }
```
### PublicKeyDecryptMessage
This function decrypts a message from the given public key and your private key.
Encripted messge must be base64 encoded ie  base64(cipher + nonce).
Result is decoded message as a string.
```javascript    
    async function PublicKeyDecryptMessage(){
      let dec = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapId, 
          request: {
            method: 'PublicKeyDecryptMessage',
            params:{
              message: 'base 64 encoded cipher text',
              public_key: "<pk hex encoded str>"
            }
          }
        }        
      })
      return dec
    }
```

---
## Account functions
These functions handle getting infomation about a users account, assets, balance, and history
---

### displayBalance
Displays the users current balance in a metamask flask popup

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'displayBalance',
    },
  },
});
```
### getBalance
returns the users current balance
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getBalance',
    },
  },
});
```
### getAddress
returns the public address of the wallet
```javascript
let address = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getAddress',
    },
  },
});
```

### transfer
transfers a number of algos to a specified address
```javascript
const address = prompt("Please enter your address");
const response = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'transfer',
      params: {
        to: address,
        amount: 1000
      }
    },
  },
});
```
### displayMnemonic
displays the wallets algorand mnemonic in a secure metamask window
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'displayMnemonic'
    },
  },
});
```
### getTransactions
returns a list of javascript objects containing transaction data
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getTransactions'
    },
  },
});
```
### getAssets
returns a list of the current accounts assets
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getAssets'
    },
  },
});
```
### getAccounts
returns an object containing all of the algorand accounts on a users metamask
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getAccounts'
    },
  },
});
```
### getCurrentAccount
returns the users current Account
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'getCurrentAccount'
    },
  },
});
```
### setCurrentAccount
sets the Users Current Account
takes an algorand address as a parameter and throws an error if the address is not contained in the users wallet
returns the users current Account
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'setAccount',
      params: {
        address: 'address'
      }
    },
  },
});
```
***
## Arc Complience Functions
these functions are used ARC complient ways to sign arbitray transactions
***

### signTxns
sign an array of [WalletTransaction](https://arc.algorand.foundation/ARCs/arc-0001) objects
returns an array of signed b64 algorand transactions
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'signTxns',
      params: {
        txns:[WalletTransaction]
      }
    },
  },
});
```

### postTxns
takes an array of b64 signed algorand transactions. Like the output of signTxns and sends them to the algorand blockchain.
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'postTxns',
      params: {
        stxns: ["b64SignedTxn"]
      }
    },
  },
});
```

### signAndPostTxns
takes an array of [WalletTransaction](https://arc.algorand.foundation/ARCs/arc-0001) objects and signs then posts them to the algorand blockchain
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'signAndPostTxns',
      params: {
        txns: [WalletTransaction]
      }
    },
  },
});
```


***
## Asset Functions
the functions are used to interact with algorand assets
***
### assetOptIn
opts into an algorand asset
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'assetOptIn',
      params: {
        assetIndex: int
      }
    },
  },
});
```

### assetOptOut
opts out of an algorand asset
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'assetOptOut',
      params: {
        assetIndex: int
      }
    },
  },
});
```
### transferAsset
sends an algorand asset to another wallet that is opted into the given asset
```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
    request: {
      method: 'transferAsset',
      params: {
        assetIndex: int,
        to: "algorandAddress",
        amount: string
      }
    },
  },
});
```


***
## swapping functions
These functions are used to swap crypto between
Algorand, Etherum, and Binance Smart Chain
The ticker values are
algo | eth | bsc

***

### get Minimum
get minimum input amount for a specific swap
```javascript
async function getMin(){
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
      request: {
        method: 'getMin',
        params: {
          from: 'eth' | 'bsc' | 'algo',
          to: 'eth' | 'bsc' | 'algo',
        }
      },
    },
  });

  return result;
}
```
### preSwap
Get infomation about a swap without actually swapping
```javascript
async function preSwap(){
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
      request: {
        method: 'preSwap',
        params: {
          from: 'eth' | 'bsc' | 'algo',
          to: 'eth' | 'bsc' | 'algo',
          amount: Number(amount) //done in base units i.e. eth not wei
        }
      },
    },
  });

  return result;
}
```

### swap
swap currencies
this will automatically send send the required currency to the exchange and use the selected address to receive the cash
uses changenow
```javascript
async function swap(){
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
      request: {
        method: 'swap',
        params: {
          from: 'eth' | 'bsc' | 'algo',
          to: 'eth' | 'bsc' | 'algo',
          amount: Number(amount) //done in base units i.e. eth not wei
          email: String("emailAddress@example.com") //completely optional
        }
      },
    },
  });

  return result;
}
```

### swapHistory
the method returns an array of swap objects that give info about a swap performed by a given wallet.
```javascript
async function swapHistory(){
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
      request: {
        method: 'swapHistory',
      },
    },
  });

  return result;
}
```

### getSwapStatus
this method returns a status object of swap given the swaps id that can be obtained from swap history
```javascript
async function getSwapStatus(){
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@algorandfoundation/algorand-metamask-snap',
      request: {
        method: 'getSwapStatus',
        params: {
          id: 'changenowSwapID'
        }
      },
    },
  });

  return result;
}
```

More RPC methods to come
