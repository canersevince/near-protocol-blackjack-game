<template>
  <div>
    <button class="link" style="float: right" v-on:click="logout">Sign out</button>
    <main>
      <h1 class="logo">
        Welcome, {{ accountId }}
      </h1>
      <div>
      </div>
    </main>

    <GameBoard/>

    <Notification
      v-show="notificationVisible"
      ref="notification"
      :networkId="networkId"
      :msg="'called method: setGreeting'"
      :contractId="contractId"
      :visible="false"
    />
  </div>
</template>

<script>
import { logout } from "../utils"

import Notification from "./Notification.vue"
import GameBoard from "@/components/GameBoard";

export default {
  name: "SignedIn",

  beforeMount() {
    if (this.isSignedIn) {
      //
    }
  },

  components: {
    GameBoard,
    Notification,
  },

  data: function () {
    return {
      notificationVisible: false,
    }
  },

  computed: {
    isSignedIn() {
      return window.walletConnection? window.walletConnection.isSignedIn(): false
    },
    accountId() {
      return window.accountId
    },
    contractId() {
      return window.contract? window.contract.contractId: null
    },
    networkId() {
      return window.networkId
    },
  },
  methods: {
    logout: logout,
  },
}
</script>
