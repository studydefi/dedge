# This is an archive commit of the contracts we were using at the time of 2020-04-08

# Dedge

---
| Package  |    Status     |
|----------|:-------------:|
| smart-contracts | [![CircleCI](https://circleci.com/gh/studydefi/dedge.svg?style=svg)](https://circleci.com/gh/studydefi/dedge) |

---

https://dedge.exchange

Monorepo for the Decentralized Hedging protocol. This allows you to:

1. Swap supplied/borrowed assets on Compound
2. Import MakerDAO Vault
3. Exit compound position to Ethereum

## Telegram
https://t.me/dedgeexchange


## Known Issues
1. If exit positions fail, it is likely due to high slippages (i.e. you have to convert between too many tokens, might need to borrow more tokens change 105% to 125%)