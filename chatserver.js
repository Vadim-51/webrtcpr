

"use strict";

//var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var WebSocketServer = require('websocket').server;
// Used for managing the text chat user list.

var connectionArray = [];
var testBroadcasters = {};
var last_added_person;
var upd_relayReceivers;
var changing_target;
var videoChats = {};
var followers = [];
var firstTimeJoiner = false;
var firstSent = false;
var additionalCall = [];
var nextID = Date.now();
var appendToMakeUnique = 1;
const express = require('express'),
      app = express();
app.get('/', function(req, res){
		res.sendFile(__dirname + '/index.html');
	});

app.get('/chatclient.js', function(req, res){
		res.sendFile(__dirname + '/chatclient.js');
	});
	
function check_in(array, member){
		   for(var i=0; i<array.length; i++){
			if(array[i] == member){
				return false;
			}else{
				return true;
			}
		  }
}
	
	
	
// Output logging information to console

function log(text) {
  var time = new Date();

  console.log("[" + time.toLocaleTimeString() + "] " + text);
}
//loggin a user and send its name to the server

// If you want to implement support for blocking specific origins, this is
// where you do it. Just return false to refuse WebSocket connections given
// the specified origin.
function originIsAllowed(origin) {
  return true;    // We will accept all connections
}

// Scans the list of users and see if the specified name is unique. If it is,
// return true. Otherwise, returns false. We want all users to have unique
// names.
function isUsernameUnique(name) {
  var isUnique = true;
  var i;

  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].username === name) {
      isUnique = false;
      break;
    }
  }
  return isUnique;
}

// Sends a message (which is already stringified JSON) to a single
// user, given their username. We use this for the WebRTC signaling,
// and we could use it for private text messaging.
function sendToOneUser(target, msgString) {
  var isUnique = true;
  var i;

  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].username === target) {
      connectionArray[i].sendUTF(msgString);
      break;
    }
  }
}

// Scan the list of connections and return the one for the specified
// clientID. Each login gets an ID that doesn't change during the session,
// so it can be tracked across username changes.
function getConnectionForID(id) {
  var connect = null;
  var i;

  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].clientID === id) {
      connect = connectionArray[i];
      break;
    }
  }

  return connect;
}

// Builds a message object of type "userlist" which contains the names of
// all connected users. Used to ramp up newly logged-in users and,
// inefficiently, to handle name change notifications.
function makeUserListMessage() {
  var userListMsg = {
    type: "userlist",
    users: []
  };
  var i;

  // Add the users to the list

  for (i=0; i<connectionArray.length; i++) {
    userListMsg.users.push(connectionArray[i].username);
  }

  return userListMsg;
}

// Sends a "userlist" message to all chat members. This is a cheesy way
// to ensure that every join/drop is reflected everywhere. It would be more
// efficient to send simple join/drop messages to each user, but this is
// good enough for this simple example.
function sendUserListToAll() {
  var userListMsg = makeUserListMessage();
  var userListMsgStr = JSON.stringify(userListMsg);
  var i;

  for (i=0; i<connectionArray.length; i++) {
    connectionArray[i].sendUTF(userListMsgStr);
  }
}

// Load the key and certificate data to be used for our HTTPS/WSS
// server.

var httpsOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};
const pkey = fs.readFileSync('./ssl/key.pem'),
  pcert = fs.readFileSync('./ssl/cert.pem'),
  options = {key: pkey, cert: pcert, passphrase: '123456789'};

// Our HTTPS server does nothing but service WebSocket
// connections, so every request just returns 404. Real Web
// requests are handled by the main server on the box. If you
// want to, you can return real HTML here and serve Web content.

var httpsServer = https.createServer(options, app).listen(443);
console.log('HTTPS server was created...');

// Spin up the HTTPS server on the port assigned to this sample.
// This will be turned into a WebSocket port very shortly.



// Create the WebSocket server by converting the HTTPS server into one.

var wsServer = new WebSocketServer({
  httpServer: httpsServer
});
console.log('Websocket server was created...');
// Set up a "connect" message handler on our WebSocket server. This is
// called whenever a user connects to the server's port using the
// WebSocket protocol.

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    request.reject();
    log("Connection from " + request.origin + " rejected.");
    return;
  }

  // Accept the request and get a connection.

  var connection = request.accept("json", request.origin);

  // Add the new connection to our list of connections.

  log("Connection accepted from " + connection.remoteAddress + ".");
  connectionArray.push(connection);

  connection.clientID = nextID;
  nextID++;

  // Send the new client its token; it send back a "username" message to
  // tell us what username they want to use.

  var msg = {
    type: "id",
    id: connection.clientID
  };
  connection.sendUTF(JSON.stringify(msg));

  // Set up a handler for the "message" event received over WebSocket. This
  // is a message sent by a client, and may be text to share with other
  // users, a private message (text or signaling) for one user, or a command
  // to the server.

  //create an array of chat;
  
  
  var usName = null;
  var usSdp = null;
  var maxRelayLimitPerUser = 4;
  var isBroadcastInitiator = false;
  var is_in = '';
 
   function getByValue(arr, value) {

  for (var i=0, iLen=arr.length; i<iLen; i++) {

    if (arr[i].broadcastId == value) return arr[i];
  }
}

 
  
		 
   var targetNam;
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      log("Received Message: " + message.utf8Data);

      // Process incoming data.

      var sendToClients = true;
      msg = JSON.parse(message.utf8Data);
      var connect = getConnectionForID(msg.id);

      // Take a look at the incoming object and act on it based
      // on its type. Unknown message types are passed through,
      // since they may be used to implement client-side features.
      // Messages with a "target" property are sent only to a user
      // by that name.
      var broadcasters = {};
      switch(msg.type) {
        // Public, textual message
        case "message":
          msg.name = connect.username;
          msg.text = msg.text.replace(/(<([^>]+)>)/ig, "");
		    if (sendToClients) {
        var msgString = JSON.stringify(msg);
        var i;

        // If the message specifies a target username, only send the
        // message to them. Otherwise, send it to every user.
        if (msg.target && msg.target !== undefined && msg.target.length !== 0) {
          sendToOneUser(msg.target, msgString);
        } else {
          for (i=0; i<connectionArray.length; i++) {
            connectionArray[i].sendUTF(msgString);
          }
        }
      }
          break;

        // Username change
        case "username":
          var nameChanged = false;
          var origName = msg.name;

          // Ensure the name is unique by appending a number to it
          // if it's not; keep trying that until it works.
          while (!isUsernameUnique(msg.name)) {
            msg.name = origName + appendToMakeUnique;
            appendToMakeUnique++;
            nameChanged = true;
          }

          // If the name had to be changed, we send a "rejectusername"
          // message back to the user so they know their name has been
          // altered by the server.
          if (nameChanged) {
            var changeMsg = {
              id: msg.id,
              type: "rejectusername",
              name: msg.name
            };
            connect.sendUTF(JSON.stringify(changeMsg));
          }

          // Set this connection's final username and send out the
          // updated user list to all users. Yeah, we're sending a full
          // list instead of just updating. It's horribly inefficient
          // but this is a demo. Don't do this in a real app.
          connect.username = msg.name;
          sendUserListToAll();
          sendToClients = false;  // We already sent the proper responses
          break;
          
	  
	      case "video-offer":
          
	      
	    
	      break;
	  
	      case "video-answer":
         
        
	     
             break;
			 
		   case "get-info":
		
		
		   var broadId;
		   var isBroadcastIn = false;
		   var relayReceivers = [];
		   var x = new Date(); 
           var h = x.getHours(); 
           var m = x.getMinutes(); 
           var s = x.getSeconds(); 
		   var curTime = h+":"+m+":"+s;
		   changing_target = msg.target;
		   //checking who is the person that is contacted by initiator of video call
		   //if that person already has a video chat, the one who contacts him is not 
		   //a broadcast initiator and has to take the broadcastId of an already created 
		   //videochat
		  
		 if(!testBroadcasters[msg.name]){
			 //check that person want to join already existed video chat with at least two other participants
			firstTimeJoiner = true;
			firstSent = true;
		 }
		 updateRecieversList();
		 if(testBroadcasters[msg.target]){
	     for(var t in testBroadcasters){
		 var arr = testBroadcasters[t];
		 if(arr.name == msg.target){
	     
		  var broadcastId;
		  var narr = arr;
          
		   broadId = narr.broadcastId; 
		   isBroadcastIn = false;
		   updateRecieversList();
		   for(i=0;i<narr.relayReceivers.length; i++){
			  
			   relayReceivers.push(narr.relayReceivers[i]); 
		   }
		   
		   relayReceivers.push(msg.name);
		
	   }}
	 
	   
	   
	   } else{
		   isBroadcastIn = true;
		   broadId = msg.name;
		   relayReceivers.push(msg.name);
		    videoChats[msg.name] = {
                    author: msg.name,
					created: curTime,
					followers: followers
		    }
		  
	     }
		    
			
		 
		 
		 updateRecieversList();
		 function updateRecieversList(){
		 for(var t in testBroadcasters){
			 if(testBroadcasters[t].relayReceivers){
			 for(i=0;i<testBroadcasters[t].relayReceivers.length; i++){
				 if(testBroadcasters[t].name == testBroadcasters[t].relayReceivers[i]){
					 last_added_person = testBroadcasters[t].name;
					 upd_relayReceivers = testBroadcasters[t].relayReceivers;
				 }
			 } 
			 
			 
		    }
		 }
			for(var t in testBroadcasters){
				testBroadcasters[t].relayReceivers = upd_relayReceivers;
			}
				
		 
	 }
		
		   
		   if(!testBroadcasters[msg.name]) {
    testBroadcasters[msg.name] = {
                    name: msg.name,
					sdp: msg.sdp,
					isBroadcastInitiator: isBroadcastIn,
					broadcastId: broadId,
					relayReceivers: relayReceivers
		}
		   }
		   
		   
		   if(testBroadcasters[msg.name].isBroadcastInitiator){
			 //check that person want to join already existed video chat with at least two other participants
			 //Initiator of a video chat can not be joiner
			firstTimeJoiner = false;
			firstSent = false;
		 }
		   if(testBroadcasters[msg.name].relayReceivers.length<=2){
			 //Check that person want to join already existed video chat with at least two other participants
			 //This person join video chat that is just created and has only broadcast initiator
			 //There is no need to send him additional person for setting RTCpeerconnections with them
			 //because there is no one except broadcast initiator
			firstTimeJoiner = false;
			firstSent = false;
		 }
		   
		
		     //Adding number of participants to information about video chats
	         for(var t in videoChats){
			 if(videoChats[t].author = testBroadcasters[msg.name].broadcastId){
				 if(testBroadcasters[msg.name].broadcastId != testBroadcasters[msg.name].name){
				 videoChats[t].followers.push(msg.name);
				 }
		      }	 
		   }
	   
		   
		   
		   
		   
		   if(broadcasters[msg.target]){
			  is_in = 'It is in broadcasters array';
		  }else{
			  is_in = 'No, it is not in broadcasters array';
		  }
		  console.log('////////////is_in is: '+is_in);
		  console.log('After insertion ---------------- '+broadcasters);
		  var arra = [];
	    
		    //Sending information about all video chats that are currently exist
		  var chatInfo = {
		  type: "chatInfo",
		  videoChats: videoChats
	       }
		   var chatInfoStr = JSON.stringify(chatInfo);
	       for (i=0; i<connectionArray.length; i++) {
           connectionArray[i].sendUTF(chatInfoStr);
		   }
		 
		   break;
		  } 
		   
		 
	  //////////////////////////////////////////////////////////////
	  /////////////////////////////////////////////////////////////
	  
	   if(testBroadcasters[changing_target]){
	   for(var t in testBroadcasters){
		 var arr = testBroadcasters[t];
		 var targetClient = [];
		 if(arr.name == changing_target){
		  var narr = arr;
		 }
		 if(arr.name == msg.name){
		  var narr1 = arr;
		 }
		 
		 }
		  console.log('|||||||||||||||||||||||||||||||||||||||||||||||||'+narr.relayReceivers.length);
		  if(narr1){
		  if(narr1.relayReceivers && narr1.relayReceivers !== undefined && narr1.relayReceivers.length !== 0){
		for(i=0; i<narr1.relayReceivers.length; i++){
			 if(narr1.relayReceivers[i] != msg.name){
				 targetClient.push(narr1.relayReceivers[i]);
			 }
		   }
		  }
		  }
	    
	  }
	  
	  ////////////////////////////////////////////////////////////////
	  ////////////////////////////////////////////////////////////////

       if (sendToClients) {
        var msgString = JSON.stringify(msg);
        var i;

        // If the message specifies a target username, only send the
        // message to them. Otherwise, send it to every user.
        if (msg.target && msg.target !== undefined && msg.target.length !== 0) {
          sendToOneUser(msg.target, msgString);
        } else {
          for (i=0; i<connectionArray.length; i++) {
            connectionArray[i].sendUTF(msgString);
              }
           }
        }
  
  
             ///////////////////Send additional participants/////////////////////////////////
			 if(firstSent){
			 if(firstTimeJoiner){
			 var msgAddPresonsInfo = {
		     type: "msgAddPresonsInfo",
			 testBroadcasters: testBroadcasters
	         }
			var msgAddPresonsInfoStr = JSON.stringify(msgAddPresonsInfo);
			 sendToOneUser(msg.name, msgAddPresonsInfoStr);
			 firstSent = false;
			 }
			 }
			   
			 
			///////////////////////Send additional participants////////////////////////////////////////////////////////////////////

  }
  });

  // Handle the WebSocket "close" event; this means a user has logged off
  // or has been disconnected.
  connection.on('close', function(reason, description) {
    // First, remove the connection from the list of connections.
    connectionArray = connectionArray.filter(function(el, idx, ar) {
      return el.connected;
    });

    // Now send the updated user list. Again, please don't do this in a
    // real application. Your users won't like you very much.
    sendUserListToAll();

    // Build and output log output for close information.

    var logMessage = "Connection closed: " + connection.remoteAddress + " (" +
                     reason;
    if (description !== null && description.length !== 0) {
      logMessage += ": " + description;
    }
    logMessage += ")";
    log(logMessage);
  });
});
