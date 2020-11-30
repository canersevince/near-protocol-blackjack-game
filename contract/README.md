blackjack Smart Contract
==================
Simple blackjack implementation. Storing game state on NEAR blockchain and clear data after the game ends then transfer 2x bet to player if wins.

* Not recommended to use on any other place than testnet. 
* You need to set owner in contract.
* You need to make sure player has 5 token at least to play.


A [smart contract] written in [AssemblyScript] for an app initialized with [create-near-app]
![Game Screen](https://i.ibb.co/V0FkKXq/Screenshot-1.png)

<a href="https://ibb.co/4wb0QBV"><img src="https://i.ibb.co/V0FkKXq/Screenshot-1.png" alt="Screenshot-1" border="0"></a>
Quick Start
===========

Before you compile this code, you will need to install [Node.js] ≥ 12


Exploring The Code
==================

1. The main smart contract code lives in `assembly/index.ts`. You can compile
   it with the `./compile` script.
2. Tests: You can run smart contract tests with the `./test` script. This runs
   standard AssemblyScript tests using [as-pect].


  [smart contract]: https://docs.near.org/docs/roles/developer/contracts/intro
  [AssemblyScript]: https://www.assemblyscript.org/
  [create-near-app]: https://github.com/near/create-near-app
  [Node.js]: https://nodejs.org/en/download/package-manager/
  [as-pect]: https://www.npmjs.com/package/@as-pect/cli
