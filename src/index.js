import Vue from 'vue';

import './css/style.css';

var socket = io();

var loginPage = {
    props: [
        "value"
    ],
    methods: {
        focus: function () {
            this.$refs.input.focus();
        }
    },
    template: `
    <li class="login page">
      <div class="form">
        <h3 class="title">What's your nickname?</h3>
        <input class="usernameInput" type="text" maxlength="14" v-focus ref="input"
        :value="value" @input="$emit('input', $event.target.value)"/>
      </div>
    </li>
    `,
};
var chatPage = {
    data: function () {
        return {
            COLORS: [
                '#e21400', '#91580f', '#f8a700', '#f78b00',
                '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
                '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
            ],
        }
    },
    props: [
        "messages",
        "value"
    ],
    computed: {
        mineStyle: function () {
            return (isMine) => isMine ? {'text-align': 'right'} : {}
        },
        usernameColor: function () {
            return (username) => ({'color': this.getUsernameColor(username)})
        }
    },
    methods: {
        focus: function () {
            this.$refs.chat.focus();
        },
        getUsernameColor: function (username) {
            // Gets the color of a username through our hash function
            // Compute hash code
            let hash = 7;
            for (let i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + (hash << 5) - hash;
            }
            // Calculate color
            let index = Math.abs(hash % this.COLORS.length);
            return this.COLORS[index];
        },
    },
    template: `
    <li class="chat page">
      <div class="chatArea">
        <ul class="messages">
          <li v-for="msg in messages" class="message" :class="{log: msg.isLog,typing:msg.isTyping}" :style="mineStyle(msg.isMine)">
          <template v-if="msg.isMine">
              <template v-if="msg.message">
                <span class="messageBody">{{ msg.message }}</span>
              </template>
              <template v-if="msg.username">
                <span class="username" :style="usernameColor(msg.username)">{{ msg.username }}</span>
              </template>
          </template>
          <template v-else>
              <template v-if="msg.username">
                <span class="username" :style="usernameColor(msg.username)">{{ msg.username }}</span>
              </template>
              <template v-if="msg.message">
                <span class="messageBody">{{ msg.message }}</span>
              </template>
          </template>
          {{ msg.log }}
          </li>
        </ul>
      </div>
      <input class="inputMessage" placeholder="Type here..." ref="chat" 
      :value="value" @input="$emit('input',$event.target.value)"/>
    </li>
    `,
};
//register v-focus globally
Vue.directive('focus', {
    inserted: function (el) {
        el.focus()
    }
});

var vm = new Vue({
    el: "#chat",
    data: {
        socket: socket,

        showLogin: true,
        connected: false,
        typing: false,

        username: '',
        typingMessage: '',

        messages: []
    },
    computed: {
        showChat: function () {
            return !this.showLogin;
        },
    },
    components: {
        'chat-page': chatPage,
        'login-page': loginPage,
    },
    methods: {
        inputFocus: function (event) {
            //focus on username input box
            if (this.showLogin) {
                this.$refs.usernameInput.focus()
            } else {
                this.$refs.chatInput.focus();
            }
        },
        listenKeys: function (event) {
            // When the client hits ENTER on their keyboard
            if (event.which === 13) {
                if (this.username) {
                    // Tell the server your username
                    this.showLogin && this.socket.emit('add:user', this.username);
                    // Hide the login page
                    this.showLogin = false;

                    if (this.typingMessage) {
                        this.addChatMessage();
                        // tell server to execute 'new message' and send along one parameter
                        socket.emit('new:message', this.typingMessage);
                    }
                    this.socket.emit('stop:typing');
                    this.typing = false;
                    this.typingMessage = '';
                } else {
                    this.showLogin = true;
                }
            } else if (this.typingMessage) {
                this.typing = true;
                this.socket.emit('typing');
            }
        },
        addChatMessage: function (data) {
            if (data) {
                data.prepend ? this.messages.unshift(data) : this.messages.push(data);
            } else if (this.typingMessage) {
                this.messages.push({
                    username: this.username,
                    message: this.typingMessage,
                    isMine: true
                })
            }
        },
        addMessageTyping: function (data) {
            let typingMsg = this.messages.filter(function (msg) {
                return msg.isTyping && (msg.username == this.username)
            }, data);
            if (!typingMsg.length) {
                this.addChatMessage({username: data.username, message: ' is typing', isTyping: true});
            }
            //set timeout to remove
            setTimeout((data) => {
                this.removeMessageTyping(data);
            }, 700, data);
        },
        removeMessageTyping: function (data) {
            this.messages = this.messages.filter(function (msg) {
                return !msg.isTyping || (msg.username != this.username)
            }, data);
        },

        _initSocket: function () {
            this.socket.on('login', (data) => {
                this.connected = true;
                let message = "Welcome to Vue Socket.IO Chat –";
                this.addChatMessage({log: message, isLog: true, prepend: true});
                this.addChatMessage({log: 'there are ' + data.numUsers + ' participants', isLog: true});
            });
            // Whenever the server emits 'new message', update the chat body
            this.socket.on('new:message', (data) => {
                this.addChatMessage(data);
            });
            // Whenever the server emits 'user joined', log it in the chat body
            this.socket.on('user:joined', (data) => {
                this.addChatMessage({log: data.username + ' joined', isLog: true});
                this.addChatMessage({log: 'there are ' + data.numUsers + ' participants', isLog: true});
            });
            // Whenever the server emits 'user left', log it in the chat body
            socket.on('user:left', (data) => {
                this.addChatMessage({log: data.username + ' left', isLog: true});
                this.addChatMessage({log: 'there are ' + data.numUsers + ' participants', isLog: true});
            });

            // Whenever the server emits 'typing', show the typing message
            this.socket.on('typing', (data) => {
                this.addMessageTyping(data)
            });

            // Whenever the server emits 'stop typing', kill the typing message
            this.socket.on('stop:typing', (data) => {
                this.removeMessageTyping(data)
            });

            this.socket.on('disconnect', () => {
                this.addChatMessage({log: 'you have been disconnected', isLog: true});
            });

            this.socket.on('reconnect', () => {
                this.addChatMessage({log: 'you have been reconnected', isLog: true});
                if (username) {
                    this.socket.emit('add:user', this.username);
                }
            });

            this.socket.on('reconnect_error', () => {
                this.addChatMessage({log: 'attempt to reconnect has failed', isLog: true});
            });

            this.socket.on('user:exists', () => {
                this.addChatMessage({log: this.username + ' exists', isLog: true});
                setTimeout(()=>{
                    this.showLogin = true;
                },700);
            });
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            // Code that will run only after the
            // entire view has been rendered
            this._initSocket();
        })
    }
});

