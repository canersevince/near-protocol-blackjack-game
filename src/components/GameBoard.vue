<template>
  <div>
    <div v-if="loading">
      loading...
    </div>
    <div v-if="!loading" class="scores">
      <p>Status: {{ gameState ? 'OnGoing' : 'Not Started' }}</p>
      <p>Winner: {{ winner }}</p>
      <p>Player Sum: {{ playerDeckSum }}</p>
      <p>Computer Sum: {{ computerDeckSum }}</p>
    </div>
    <h1>Balance: {{ balance }}</h1>
    <div v-if="visible && !loading" class="hands">
      <div class="player-hand playingCards">
        <h1>Player's Hand:</h1>
        <div v-for="(card, idx) in playerCards" :key="idx" :class="getCardClasses(card)">
          <div class="rank">{{ getRank(card) }}</div>
          <div class="suit">{{ getSuit(card.suit) }}</div>
        </div>
      </div>
      <div class="computer-hand playingCards">
        <h1>
          Computer's Hand:
        </h1>
        <div v-for="(card, idx) in computerCards" :key="idx" :class="getCardClasses(card)">
          <div class="rank">{{ getRank(card) }}</div>
          <div class="suit">{{ getSuit(card.suit) }}</div>
        </div>
      </div>
    </div>
    <button v-if="gameState == false" @click="createNewGame">New Game</button>
    <button v-if="gameState && !playerPassed" @click="drawCardPlayer">Draw</button>
    <button v-if="gameState" @click="keep">Hold</button>
  </div>
</template>

<script>
const suits = ['hearts', 'spades', 'clubs', 'diamonds']
const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]
const chars = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']

async function saveGameState(state, callback = null, newGame = null) {
  if (state.gameState === false) {
    if (state.winner == "Player!") {
      window.contract.endGame({playerWon: 1})
    } else {
      window.contract.endGame({playerWon: 0})
    }
    return;
  }
  const gameState = JSON.stringify({
    gameState: state.gameState,
    gameDeck: state.gameDeck,
    playerCards: state.playerCards,
    computerCards: state.computerCards,
    playerPassed: state.playerPassed,
    computedPassed: state.computedPassed,
    winner: state.winner,
    seed: state.seed,
  })
  if (newGame) {
    await window.contract.newBet({gameState, bet: 5}).then((res) => {
      if (callback) {
        callback()
        location.reload();
      }
    })
  } else {
    await window.contract.setGameState({gameState}).then((res) => {
      if (callback) {
        callback()
        location.reload();
      }
    }).catch((err) => console.log(err))
  }

}

let loadFromContract;

class Deck {
  constructor() {
    this.deck = []
    suits.forEach(suit => {
      values.forEach(value => {
        this.deck.push({value, suit});
      })
    })
  }

  shuffle() {
    let oldIdx;
    this.deck.forEach((card, i) => {
      const length = this.deck.length;
      const newIdx = Math.ceil(Math.random() * length - 1)
      oldIdx = i
      const oldCard = this.deck[newIdx]
      this.deck[newIdx] = this.deck[i]
      this.deck[oldIdx] = oldCard
    })
  }

  get() {
    return this.deck
  }

  importJson(json) {
    this.deck = json
  }

  drawTop() {
    const draw = this.deck[0]
    this.deck.shift()
    return draw
  }
}

export default {
  name: "GameBoard",
  data: () => ({
    gameState: false,
    gameDeck: null,
    playerCards: [],
    computerCards: [],
    playerPassed: false,
    computedPassed: false,
    winner: "Game is not started.",
    callback: loadFromContract,
    seed: null,
    visible: false,
    balance: null,
    loading: false
  }),
  watch: {
    winner() {
      this.handleWinner()
    }
  },
  methods: {
    async getBalance() {
      this.loading = true
      window.contract.balanceOf({tokenOwner: window.contract.account.accountId}).then(res => {
        this.balance = res
        this.loading = false
      }).catch(err => console.log(err))
    },
    createNewGame() {

      if (this.winner !== 'Game is not started.') {
        this.resetGame()
      }
      this.gameState = true;
      this.gameDeck = new Deck()
      this.gameDeck.shuffle()
      for (let i = 0; i < 2; i++) {
        const playerDraw = this.gameDeck.drawTop()
        this.playerCards.push(playerDraw)
        const computerCard = this.gameDeck.drawTop()
        this.computerCards.push(computerCard)
      }
      this.seed = Math.ceil(Math.random() * 53532525)
      localStorage.setItem('seed', this.seed)
      saveGameState(this.$data, this.getBalance, true)
      this.visible = true
      this.loading = true
    },
    drawCardPlayer() {
      if (this.playerPassed) {
        alert('You can\'t draw cards once you pressed hold!')
        return
      }
      if (this.computedPassed) {
        if (this.computerDeckSum < this.playerDeckSum) {
          this.winner = "Player!"
          this.gameState = false
          saveGameState(this.$data, this.getBalance)
        }
      }
      // draw for player
      const playerDraw = this.gameDeck.drawTop()
      this.playerCards.push(playerDraw)

      // check if win
      const isPlayerWon = this.checkWinner('player')
      // draw for pc

      if (isPlayerWon === 'continue') {
        this.drawCardComputer()
        saveGameState(this.$data, this.getBalance)
        return
      } else if (isPlayerWon === 'win') {
        this.winner = "Player!"
        this.gameState = false
      } else {
        this.winner = "Contract!"
        this.gameState = false
      }
      this.$nextTick(() => this.gameState = false)
      // check for win
      this.loading = true
      saveGameState(this.$data, this.getBalance)
    },
    drawComputer() {
      const computerDraw = this.gameDeck.drawTop()
      this.computerCards.push(computerDraw)
      // check if win
      const isComputerWon = this.checkWinner('computer')
      // draw for pc
      // check for win
      if (isComputerWon === 'continue') {
        return
      } else if (isComputerWon === 'win') {
        this.winner = "Contract!"
        this.gameState = false

      } else {
        this.winner = "Player!"
        this.gameState = false
      }
      this.loading = true
      this.$nextTick(() => this.gameState = false)
      saveGameState(this.$data, this.getBalance)
    },
    drawCardComputer() {
      // draw for player
      if (this.computedPassed) {
        return
      }
      if ((this.computerDeckSum > this.playerDeckSum) && (21 - this.computerDeckSum) < 4) {
        this.computedPassed = true;
        saveGameState(this.$data, this.getBalance)
      }
      if (this.playerPassed) {

        if (this.computerDeckSum === this.playerDeckSum) {
          this.winner = 'DRAW!'
          this.gameState = false;
          saveGameState(this.$data, this.getBalance)
          return
        }
        if (this.computerDeckSum > this.playerDeckSum && this.computerDeckSum < 22) {
          this.gameState = false
          this.winner = "Contract!"
        } else {
          if (this.computerDeckSum > this.playerDeckSum) {
            if (this.computerDeckSum < 22) {
              this.gameState = false
              this.winner = "Contract!"
            } else {
              this.gameState = false
              this.winner = "Player!"
            }
          } else {
            this.drawComputer()
            this.drawCardComputer()
          }
          saveGameState(this.$data, this.getBalance)
        }
        // actions
      } else {
        this.drawComputer()
      }
    },
    resetGame() {
      // check winner, pay if player wins.
      this.gameState = false;
      this.gameDeck = null
      this.playerCards = []
      this.computerCards = []
      this.playerPassed = false
      this.computedPassed = false
      this.winner = "Game Continues"
    },
    checkWinner(side) {
      if (side === 'player') {
        const sum = this.playerCards.reduce((sum, curr) => {
          return sum += curr.value
        }, 0)
        if (sum > 21) return "dead";
        else if (sum < 21) return "continue";
        else return "win"
      } else {
        const sum = this.computerCards.reduce((sum, curr) => {
          return sum += curr.value
        }, 0)
        if (sum > 21) return "dead";
        else if (sum < 21) return "continue";
        else return "win"
      }
    },
    keep() {
      if (!this.gameState) return;
      this.playerPassed = true;
      this.drawCardComputer();
    },
    getCardClasses(card) {
      return this.generateCardCssClass(card)
    },
    generateCardCssClass(card) {
      const char = this.getRank(card)
      return `card rank-${char} ${card.suit}`
    },
    getRank(card) {
      const idx = values.indexOf(card.value)
      return chars[idx]
    },
    getSuit(suit) {
      switch (suit) {
        case "diamonds":
          return "♦";
        case "clubs":
          return "♣"
        case "spades":
          return "♠"
        case "hearts":
          return "♥"
      }
    },
    handleWinner() {
      if (this.gameState == 'Game Continues') return;
      if (this.winner.toLowerCase().indexOf('continue') > -1) return;
      if (this.winner.toLowerCase().indexOf('contra') > -1) {
        window.contract.endGame({playerWon: 0}).then(res => {
          console.log(res)
          location.reload();
          alert(`Computer hit:${this.computerDeckSum}, Winner is: ${this.winner}`)
        }).catch(err => {
          console.log(err)
        })
      } else if (this.winner.toLowerCase().indexOf('player') > -1) {
        // send transaction from contract then clear data.
        window.contract.endGame({playerWon: 1}).then(res => {
          console.log(res)
          location.reload();
          alert(`Player wins with:${this.playerDeckSum}, Winner is: ${this.winner}`)
        }).catch(err => {
          console.log(err)
        })
      } else {
        window.contract.endGame({playerWon: 0}).then(res => {
          console.log(res)
          location.reload();
          alert('DRAW!')
        }).catch(err => {
          console.log(err)
        })
      }
    },
    loadFromContract() {
      const self = this;
      this.contract.getGameState({account_id: window.contract.account.accountId}).then(res => {
        console.log(res)
        if (res == 'not found') {
          return
        }
        const parsed = JSON.parse(res)
        const seed = localStorage.getItem('seed')
        if (parsed && parsed.seed) {
          if (!(seed == parsed.seed)) {
            alert('You can\'t fool us.')
            window.contract.endGame({playerWon: 0})
            return
          }
        }
        if ("gameState" in parsed) {
          const objKeys = Object.keys(parsed)
          objKeys.forEach(key => {
            if (key == 'gameDeck') return;
            self[key] = parsed[key]
          })

          this.gameDeck = new Deck()
          this.gameDeck.importJson(parsed.gameDeck.deck)
          this.visible = true
        }
      }).catch((err) => console.log(err))
    },
  },
  computed: {
    contract() {
      return window.contract
    },
    playerDeckSum() {
      const sum = this.playerCards.reduce((sum, curr) => sum += curr.value, 0)
      return sum
    },
    computerDeckSum() {
      const sum = this.computerCards.reduce((sum, curr) => sum += curr.value, 0)
      return sum
    }
  },
  mounted() {
    loadFromContract = this.loadFromContract()
    this.getBalance()
  }
}
</script>

<style lang="scss">

.scores {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hands {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card.diamonds, .cards.hearts {
  color: red;
}
</style>
