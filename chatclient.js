

"use strict";

// Get hostname

var myHostname = window.location.hostname;
console.log("Hostname: " + myHostname);
var addBool = true;
function checkArray(arr, el){
 for(var i=0; i<arr.length; i++){
  if(arr[i] == el){
   return true;
  }else{
   return false;
  }
 }
}
// WebSocket chat/signaling channel variables.

var connection = null;
var clientID = 0;
var single = '0'; //inform whether it's first connection or not

// The media constraints object describes what sort of stream we want
// to request from the local A/V hardware (typically a webcam and
// microphone). Here, we specify only that we want both audio and
// video; however, you can be more specific. It's possible to state
// that you would prefer (or require) specific resolutions of video,
// whether to prefer the user-facing or rear-facing camera (if available),
// and so on.
//



//Specifying the parameters of camera
var mediaConstraints = {
  audio: true,            // We want an audio track
  video: true             // ...and we want a video track
};

var myUsername = null;
var targetUsername = null;      // To store username of other peer
var myPeerConnection = [];    // RTCPeerConnection
var candidate = [];
var additionalPerson = [];
var desc = [];
var contactedArray = [];
var addCall = [];
if(myPeerConnection){
	var n;
	if(myPeerConnection.length>0){
	    n = myPeerConnection.length-1;
	}else{
	    n = 0;
	}
}
var targetName = null;
var targetNam;
var is_in = '';
// To work both with and without addTrack() we need to note
// if it's available

var hasAddTrack = false;

// Output logging information to console.

function log(text) {
	
  var time = new Date();
  console.log("[" + time.toLocaleTimeString() + "] " + text);
}

// Output an error message to console.

function log_error(text) {
	
  var time = new Date();
  console.error("[" + time.toLocaleTimeString() + "] " + text);
}

// Send a JavaScript object by converting it to JSON and sending
// it as a message on the WebSocket connection.

function sendToServer(msg) {
  var msgJSON = JSON.stringify(msg);

  log("Sending '" + msg.type + "' message: " + msgJSON);
  connection.send(msgJSON);
}

// Called when the "id" message is received; this message is sent by the
// server to assign this login session a unique ID number; in response,
// this function sends a "username" message to set our username for this
// session.
function setUsername() {
  myUsername = document.getElementById("name").value;

  sendToServer({
    name: myUsername,
    date: Date.now(),
    id: clientID,
    type: "username"
  });
}

// Open and configure the connection to the WebSocket server.

function connect() {
  var serverUrl;
  var scheme = "ws";
  

  // If this is an HTTPS connection, we have to use a secure WebSocket
  // connection too, so add another "s" to the scheme.

  if (document.location.protocol === "https:") {
    scheme += "s";
  }
  serverUrl = scheme + "://" + myHostname + ":3000";

  connection = new WebSocket(serverUrl, "json");

  connection.onopen = function(evt) {
    document.getElementById("text").disabled = false;
    document.getElementById("send").disabled = false;
  };
var broadcasters = {};

  connection.onmessage = function(evt) {
    var chatFrameDocument = document.getElementById("chatbox").contentDocument; //this targets inframe located in index.html
    var text = ""; //defining a variable in wich we'll put responses from the server, preliminary correcting them
    var msg = JSON.parse(evt.data);//save data from event in variable msg
    log("Message received: ");
    console.dir(msg);
    var time = new Date(msg.date);
    var timeStr = time.toLocaleTimeString();
    
    switch(msg.type) {
      case "id":
        clientID = msg.id;
        setUsername();
        break;

      case "username":
        text = "<b>User <em>" + msg.name + "</em> signed in at " + timeStr + "</b><br>";
        break;

      case "message":
        text = "(" + timeStr + ") <b>" + msg.name + "</b>: " + msg.text + "<br>";
        break;

      case "rejectusername":
        myUsername = msg.name;
        text = "<b>Your username has been set to <em>" + myUsername +
          "</em> because the name you chose is in use.</b><br>";
        break;

      case "userlist":      // Received an updated user list
        handleUserlistMsg(msg);
        break;
      
	   
	   
	   
      // Signaling messages: these messages are used to trade WebRTC
      // signaling information during negotiations leading up to a video
      // call.

	  
	      
		  
	     case "chatinfo":
		     var name = msg.name;
		     var target = msg.target;
			 $('<p>From '+name+' to:___ '+target+'</p>').appendTo(document.getElementById("chatinfo"));
	         
		     
		 
		 
		 break;
	  case "msgAddPresonsInfo":
	 
		
		console.log('=====================================================================================');
		console.log(contactedArray);
		
		console.log('=====================================================================================');
		
		  
		 addCall = msg.testBroadcasters;
		 console.log(addCall[myUsername].relayReceivers);
		
		
			 var i=0;
		     while(i<addCall[myUsername].relayReceivers.length-1){
			 console.log('Check if a particular target name is in contactedArray');
			 console.log('myUsername is '+myUsername);
			 console.log(checkArray(contactedArray,addCall[myUsername].relayReceivers[i]));	
			 if(addCall[myUsername].relayReceivers[i] != myUsername){
		     if(!checkArray(contactedArray,addCall[myUsername].relayReceivers[i])){
			
			 additionalPerson.push(addCall[myUsername].relayReceivers[i]);
			 }
			 }     
			 i++;   
		 }
		
	
	 
	  
	  break;
	  
      case "video-offer":  // Invitation and offer to chat
	  
        handleVideoOfferMsg(msg);
		contactedArray.push(targetUsername);
	  
        break;

      case "video-answer":  // Callee has answered our offer
	   
        handleVideoAnswerMsg(msg);
		
        break;

      case "new-ice-candidate": // A new ICE candidate has been received
        handleNewICECandidateMsg(msg);
        break;

      case "hang-up": // The other peer has hung up the call
        handleHangUpMsg(msg);
        break;
        //video chats information
	   case "chatInfo":
	   //handleVideoChats(msg);
	   var videoChats = msg.videoChats;
	   console.log('Video chats info...................................................');
	   console.log(videoChats);
	   console.log('Video chats info...................................................');   
		  var i;
        
    
	   break;
      // Unknown message; output to console for debugging.

      default:
        log_error("Unknown message received:");
        log_error(msg);
    }

    // If there's text to insert into the chat buffer, do so now, then
    // scroll the chat panel so that the new text is visible.

    if (text.length) {
      chatFrameDocument.write(text);
      document.getElementById("chatbox").contentWindow.scrollByPages(1);
    }
  };
}


//Handle contacting additional persons
		 
//Handle webchats descriptions
           

      



// Handles a click on the Send button (or pressing return/enter) by
// building a "message" object and sending it to the server.
function handleSendButton() {
  var msg = {
    text: document.getElementById("text").value,
    type: "message",
    id: clientID,
    date: Date.now()
  };
  sendToServer(msg);//This function is actuall send all message (in the form of JSON object) to the server. It can render on its side
  document.getElementById("text").value = "";
}

// Handler for keyboard events. This is used to intercept the return and
// enter keys so that we can call send() to transmit the entered text
// to the server.
function handleKey(evt) {
  if (evt.keyCode === 13 || evt.keyCode === 14) {
    if (!document.getElementById("send").disabled) {
      handleSendButton();
    }
  }
}

// Create the RTCPeerConnection which knows how to talk to our
// selected STUN/TURN server and then uses getUserMedia() to find
// our camera and microphone and add that stream to the connection for
// use in our video call. Then we configure event handlers to get
// needed notifications on the call.

function createPeerConnection() {
  log("Setting up a connection...");

  // Create an RTCPeerConnection which knows to use our chosen
  // STUN server.

  myPeerConnection.push(new RTCPeerConnection({
    iceServers: [     // Information about ICE servers - Use your own!
      {
        urls: "turn:" + myHostname,  // A TURN server
        username: "webrtc",
        credential: "turnserver"
      }
    ]
  }));

  // Do we have addTrack()? If not, we will use streams instead.

	 
  hasAddTrack = (myPeerConnection[myPeerConnection.length-1].addTrack !== undefined);

  // Set up event handlers for the ICE negotiation process.
 
  myPeerConnection[myPeerConnection.length-1].onicecandidate = handleICECandidateEvent;
  myPeerConnection[myPeerConnection.length-1].onnremovestream = handleRemoveStreamEvent;
  myPeerConnection[myPeerConnection.length-1].oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  myPeerConnection[myPeerConnection.length-1].onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  myPeerConnection[myPeerConnection.length-1].onsignalingstatechange = handleSignalingStateChangeEvent;
  myPeerConnection[myPeerConnection.length-1].onnegotiationneeded = handleNegotiationNeededEvent;

  // Because the deprecation of addStream() and the addstream event is recent,
  // we need to use those if addTrack() and track aren't available.
///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
 if (hasAddTrack) {
    myPeerConnection[myPeerConnection.length-1].ontrack = handleTrackEvent;
  } else {
    myPeerConnection[myPeerConnection.length-1].onaddstream = handleAddStreamEvent;
  }
  
  
}

// Called by the WebRTC layer to let us know when it's time to
// begin (or restart) ICE negotiation. Starts by creating a WebRTC
// offer, then sets it as the description of our local media
// (which configures our local media stream), then sends the
// description to the callee as an offer. This is a proposed media
// format, codec, resolution, etc.

function handleNegotiationNeededEvent() {
  log("*** Negotiation needed");

  log("---> Creating offer");
  myPeerConnection[myPeerConnection.length-1].createOffer().then(function(offer) {
    log("---> Creating new description object to send to remote peer");
    return myPeerConnection[myPeerConnection.length-1].setLocalDescription(offer);
  })
  .then(function() {
    log("---> Sending offer to remote peer");
    sendToServer({
      name: myUsername,
      target: targetUsername,
      type: "video-offer",
	  single: '0',
      sdp: myPeerConnection[myPeerConnection.length-1].localDescription
    });
  }).then(function(){
	  var msg = {
      name: myUsername,
      target: targetUsername,
      type: "get-info",
      sdp: myPeerConnection[myPeerConnection.length-1].localDescription 
  };
     sendToServer(msg);
	 })
  .catch(reportError);
}

// Called by the WebRTC layer when events occur on the media tracks
// on our WebRTC call. This includes when streams are added to and
// removed from the call.
//
// track events include the following fields:
//
// RTCRtpReceiver       receiver
// MediaStreamTrack     track
// MediaStream[]        streams
// RTCRtpTransceiver    transceiver
var vEl = targetName;
function handleTrackEvent(event) {
	
  log("*** Track event");
  var videoHub = document.getElementById("remote_video");
  if($("#"+targetName).length == 0 ){
  $('<div class="remoteV" id='+targetName+'1'+'>'+
    '<p>'+targetName+'</p>'+
    '<video id='+targetName+' autoplay muted>'+
  '</video><p><span class="test"></span></p></div>').appendTo(videoHub);}
  document.getElementById(targetName).srcObject = event.streams[0];
  document.getElementById("hangup-button").disabled = false;
}

// Called by the WebRTC layer when a stream starts arriving from the
// remote peer. We use this to update our user interface, in this
// example.

function handleAddStreamEvent(event) {
	
  log("*** Stream added");
   var videoHub = document.getElementById("remote_video");
  if($("#"+targetName).length == 0){
  $('<div class="remoteV" id='+targetName+'1'+'>'+
    '<p>'+targetName+'</p>'+
    '<video id='+targetName+' autoplay muted>'+
  '</video><p><span class="test"></span></p></div>').appendTo(videoHub);}
  document.getElementById(targetName).srcObject = event.stream;
  document.getElementById("hangup-button").disabled = false;
}

function describeMe(me){
	var me = me;
	document.getElementById('me').innerHTML = me;
}
// An event handler which is called when the remote end of the connection
// removes its stream. We consider this the same as hanging up the call.
// It could just as well be treated as a "mute".
//
// Note that currently, the spec is hazy on exactly when this and other
// "connection failure" scenarios should occur, so sometimes they simply
// don't happen.

function handleRemoveStreamEvent(event) {
  log("*** Stream removed");
  closeVideoCall();
}

// Handles |icecandidate| events by forwarding the specified
// ICE candidate (created by our local ICE agent) to the other
// peer through the signaling server.

function handleICECandidateEvent(event) {
  if (event.candidate) {
    log("Outgoing ICE candidate: " + event.candidate.candidate);

    sendToServer({
      type: "new-ice-candidate",
      target: targetUsername,
      candidate: event.candidate
    });
  }
}

// Handle |iceconnectionstatechange| events. This will detect
// when the ICE connection is closed, failed, or disconnected.
//
// This is called when the state of the ICE agent changes.

function handleICEConnectionStateChangeEvent(event) {
  log("*** ICE connection state changed to " + myPeerConnection[myPeerConnection.length-1].iceConnectionState);

    switch(myPeerConnection[myPeerConnection.length-1].iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall();
      break;
	case "connected":
	
	if(addBool){
	if(additionalPerson.length >= 1){
	for(var i=0; i<additionalPerson.length; i++){
	if(!checkArray(contactedArray, additionalPerson[i])){
	inviteAdditionalPersons(additionalPerson[i]);
	contactedArray.push(additionalPerson[i]);
	addBool = false;
	}
	}
	}
	}
	break;
	
  
}
}
// Set up a |signalingstatechange| event handler. This will detect when
// the signaling connection is closed.
//
// NOTE: This will actually move to the new RTCPeerConnectionState enum
// returned in the property RTCPeerConnection.connectionState when
// browsers catch up with the latest version of the specification!

function handleSignalingStateChangeEvent(event) {
  log("*** WebRTC signaling state changed to: " + myPeerConnection[myPeerConnection.length-1].signalingState);
  switch(myPeerConnection[myPeerConnection.length-1].signalingState) {
    case "closed":
      closeVideoCall();
      break;
  }
}

// Handle the |icegatheringstatechange| event. This lets us know what the
// ICE engine is currently working on: "new" means no networking has happened
// yet, "gathering" means the ICE engine is currently gathering candidates,
// and "complete" means gathering is complete. Note that the engine can
// alternate between "gathering" and "complete" repeatedly as needs and
// circumstances change.
//
// We don't need to do anything when this happens, but we log it to the
// console so you can see what's going on when playing with the sample.

function handleICEGatheringStateChangeEvent(event) {
  log("*** ICE gathering state changed to: " + myPeerConnection[myPeerConnection.length-1].iceGatheringState);
   switch(myPeerConnection[myPeerConnection.length-1].iceGatheringState) {
    case "complete":
   
      break;
  }
}
function handleVideoChats(msg) {
  var i;
  var videoChats = msg.videoChats;
  var video_chats = document.getElementById("videochats");
 for(var t in videoChats){
	 if($("#"+videoChats[t].author).length == 0){
  $('<div class="webchat" id='+videoChats[t].author+'>'+
    '<p>Created by '+videoChats[t].author+' at  '+ videoChats[t].created+'</p>'+
    '<p><span class="test"></span></p></div>').appendTo(video_chats);}   
 }	   
}   
	   
	   
	   
 


// Given a message containing a list of usernames, this function
// populates the user list box with those names, making each item
// clickable to allow starting a video call.

function handleUserlistMsg(msg) {
  var i;

  var listElem = document.getElementById("userlistbox");

  // Remove all current list members. We could do this smarter,
  // by adding and updating users instead of rebuilding from
  // scratch but this will do for this sample.

  while (listElem.firstChild) {
    listElem.removeChild(listElem.firstChild);
  }

  // Add member names from the received list

  for (i=0; i < msg.users.length; i++) {
    var item = document.createElement("li");
    item.appendChild(document.createTextNode(msg.users[i]));
    item.addEventListener("click", invite, false);

    listElem.appendChild(item);
  }
}

// Close the RTCPeerConnection and reset variables so that the user can
// make or receive another call if they wish. This is called both
// when the user hangs up, the other user hangs up, or if a connection
// failure is detected.

function closeVideoCall() {
  var remoteVideo = $("#remote_video").children("video:first");
  var localVideo = document.getElementById("local_video");
$("#remote_video").children("video:first");
  log("Closing the call");

  // Close the RTCPeerConnection

  
    log("--> Closing the peer connection");

    // Disconnect all our event listeners; we don't want stray events
    // to interfere with the hangup while it's ongoing.

    myPeerConnection[myPeerConnection.length-1].onaddstream = null;  // For older implementations
    myPeerConnection[myPeerConnection.length-1].ontrack = null;      // For newer ones
    myPeerConnection[myPeerConnection.length-1].onremovestream = null;
    myPeerConnection[myPeerConnection.length-1].onnicecandidate = null;
    myPeerConnection[myPeerConnection.length-1].oniceconnectionstatechange = null;
    myPeerConnection[myPeerConnection.length-1].onsignalingstatechange = null;
    myPeerConnection[myPeerConnection.length-1].onicegatheringstatechange = null;
    myPeerConnection[myPeerConnection.length-1].onnotificationneeded = null;

    // Stop the videos

    if (remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    if (localVideo.srcObject) {
      localVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    remoteVideo.src = null;
    localVideo.src = null;

    // Close the peer connection

    myPeerConnection[myPeerConnection.length-1].close();
    myPeerConnection[myPeerConnection.length-1] = null;
  

  // Disable the hangup button

  document.getElementById("hangup-button").disabled = true;

  targetUsername = null;
}

// Handle the "hang-up" message, which is sent if the other peer
// has hung up the call or otherwise disconnected.

function handleHangUpMsg(msg) {
  log("*** Received hang up notification from other peer");

  closeVideoCall();
}

// Hang up the call by closing our end of the connection, then
// sending a "hang-up" message to the other peer (keep in mind that
// the signaling is done on a different connection). This notifies
// the other peer that the connection should be terminated and the UI
// returned to the "no call in progress" state.

function hangUpCall() {
  closeVideoCall();
  sendToServer({
    name: myUsername,
    target: targetUsername,
    type: "hang-up"
  });
}

// Handle a click on an item in the user list by inviting the clicked
// user to video chat. Note that we don't actually send a message to
// the callee here -- calling RTCPeerConnection.addStream() issues
// a |notificationneeded| event, so we'll let our handler for that
// make the offer.
//document.getElementById("test").addEventListener("click", addPer, false);
function addPer(){
	var i;
	if(additionalPerson){
	for(i=0; i<additionalPerson.length; i++){
	document.getElementById("adP").innerHTML += additionalPerson[i]+" ";
	}
	}
}
function invite(evt) {
  log("Starting to prepare an invitation");
 /* if (myPeerConnection) {
    alert("You can't start a call because you already have one open!");
  } else {*/
    var clickedUsername = evt.target.textContent;

    // Don't allow users to call themselves, because weird.

    if (clickedUsername === myUsername) {
      alert("I'm afraid I can't let you talk to yourself. That would be weird.");
      return;
    }

    // Record the username being called for future reference

    targetUsername = clickedUsername;
    log("Inviting user " + targetUsername);

    // Call createPeerConnection() to create the RTCPeerConnection.

    log("Setting up connection to invite user: " + targetUsername);
    createPeerConnection();

    // Now configure and create the local stream, attach it to the
    // "preview" box (id "local_video"), and add it to the
    // RTCPeerConnection.

    log("Requesting webcam access...");

    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(function(localStream) {
      log("-- Local video stream obtained");
	  describeMe(myUsername);
      document.getElementById("local_video").src = window.URL.createObjectURL(localStream);
      document.getElementById("local_video").srcObject = localStream;

      if (hasAddTrack) {
        log("-- Adding tracks to the RTCPeerConnection");
        localStream.getTracks().forEach(track => myPeerConnection[myPeerConnection.length-1].addTrack(track, localStream));
		 log("-- Tracks were added to the RTCPeerConnection");
      } else {
        log("-- Adding stream to the RTCPeerConnection");
        myPeerConnection[myPeerConnection.length-1].addStream(localStream);
      }
    })
    .catch(handleGetUserMediaError);
	contactedArray.push(targetUsername);
  }

function inviteAdditionalPersons(target) {
  log("Starting to prepare an additional invitation");
 

    targetUsername = target;
	if (targetUsername === myUsername) {
      return;
    }
    log("Inviting user " + targetUsername);

    // Call createPeerConnection() to create the RTCPeerConnection.

    log("Setting up connection to invite user: " + targetUsername);
    createPeerConnection();

    // Now configure and create the local stream, attach it to the
    // "preview" box (id "local_video"), and add it to the
    // RTCPeerConnection.

    log("Requesting webcam access...");

    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(function(localStream) {
      log("-- Local video stream obtained");
	  describeMe(myUsername);
      document.getElementById("local_video").src = window.URL.createObjectURL(localStream);
      document.getElementById("local_video").srcObject = localStream;

      if (hasAddTrack) {
        log("-- Adding tracks to the RTCPeerConnection");
        localStream.getTracks().forEach(track => myPeerConnection[myPeerConnection.length-1].addTrack(track, localStream));
		 log("-- Tracks were added to the RTCPeerConnection");
      } else {
        log("-- Adding stream to the RTCPeerConnection");
        myPeerConnection[myPeerConnection.length-1].addStream(localStream);
      }
    })
    .catch(handleGetUserMediaError);
	
  }
// Accept an offer to video chat. We configure our local settings,
// create our RTCPeerConnection, get and attach our local camera
// stream, then create and send an answer to the caller.

if(desc){
	var m;
	if(desc.length>0){
		m = desc.length - 1;
	}else{
		m = 0;
	}
}
function handleVideoOfferMsg(msg) {
  var localStream = null;

   targetUsername = msg.name;
   targetName = msg.name;

  // Call createPeerConnection() to create the RTCPeerConnection.

  log("Starting to accept invitation from " + targetUsername);
  createPeerConnection();

  // We need to set the remote description to the received SDP offer
  // so that our local WebRTC layer knows how to talk to the caller.

   desc.push(new RTCSessionDescription(msg.sdp));

  myPeerConnection[myPeerConnection.length-1].setRemoteDescription(desc[desc.length-1]).then(function () {
    log("Setting up the local media stream...");
    return navigator.mediaDevices.getUserMedia(mediaConstraints);
	log("--TESTING TESTING TESTING Local video stream WAS SET");
  })
  .then(function(stream) {
    log("-- Local video stream obtained");
    localStream = stream;
	describeMe(myUsername);
	//if(!document.getElementById("local_video").srcObject){
    document.getElementById("local_video").src = window.URL.createObjectURL(localStream);
    document.getElementById("local_video").srcObject = localStream;
   // }
    if (hasAddTrack) {
      log("-- Adding tracks to the RTCPeerConnection");
      localStream.getTracks().forEach(track =>
            myPeerConnection[myPeerConnection.length-1].addTrack(track, localStream)
      );
	  	log("--TESTING TESTING TESTING TRACKS WHERE ADDED AND READY TO SEND");
    } else {
      log("-- Adding stream to the RTCPeerConnection");
      myPeerConnection[myPeerConnection.length-1].addStream(localStream);
    }
  })
  .then(function() {
    log("------> Creating answer");
    // Now that we've successfully set the remote description, we need to
    // start our stream up locally then create an SDP answer. This SDP
    // data describes the local end of our call, including the codec
    // information, options agreed upon, and so forth.
    return myPeerConnection[myPeerConnection.length-1].createAnswer();
  })
  .then(function(answer) {
    log("------> Setting local description after creating answer");
    // We now have our answer, so establish that as the local description.
    // This actually configures our end of the call to match the settings
    // specified in the SDP.
    return myPeerConnection[myPeerConnection.length-1].setLocalDescription(answer);
  })
  .then(function() {
    var msg = {
      name: myUsername,
      target: targetUsername,
      type: "video-answer",
      sdp: myPeerConnection[myPeerConnection.length-1].localDescription
    };

    // We've configured our end of the call now. Time to send our
    // answer back to the caller so they know that we want to talk
    // and how to talk to us.

    log("Sending answer packet back to other peer");
    sendToServer(msg);
  }).then(function(){
	  var msg = {
      name: myUsername,
      target: targetUsername,
      type: "get-info",
      sdp: myPeerConnection[myPeerConnection.length-1].localDescription 
  };
     sendToServer(msg);
  }
  )
  .catch(handleGetUserMediaError);
  
}

// Responds to the "video-answer" message sent to the caller
// once the callee has decided to accept our request to talk.

function handleVideoAnswerMsg(msg) {
  log("Call recipient has accepted our call");
   targetUsername = msg.target;
   targetName = msg.name;
  // Configure the remote description, which is the SDP payload
  // in our "video-answer" message.

  desc.push(new RTCSessionDescription(msg.sdp));
  myPeerConnection[myPeerConnection.length-1].setRemoteDescription(desc[desc.length-1]).catch(reportError);//mayby at this place it's possible to create an array of users that have the same stream
}

// A new ICE candidate has been received from the other peer. Call
// RTCPeerConnection.addIceCandidate() to send it along to the
// local ICE framework.

if(candidate){
	var k;
	if(candidate.length<1){
		k = candidate.length-1;
	}else{
		k = 0;
	}
}
function handleNewICECandidateMsg(msg) {
   candidate.push(new RTCIceCandidate(msg.candidate));

  log("Adding received ICE candidate: " + JSON.stringify(candidate[candidate.length-1]));
  myPeerConnection[myPeerConnection.length-1].addIceCandidate(candidate[candidate.length-1])
    .catch(reportError);
}

// Handle errors which occur when trying to access the local media
// hardware; that is, exceptions thrown by getUserMedia(). The two most
// likely scenarios are that the user has no camera and/or microphone
// or that they declined to share their equipment when prompted. If
// they simply opted not to share their media, that's not really an
// error, so we won't present a message in that situation.

function handleGetUserMediaError(e) {
  log(e);
  switch(e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
            "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
  }

  // Make sure we shut down our end of the RTCPeerConnection so we're
  // ready to try again.

  closeVideoCall();
}

// Handles reporting errors. Currently, we just dump stuff to console but
// in a real-world application, an appropriate (and user-friendly)
// error message should be displayed.

function reportError(errMessage) {
  log_error("Error " + errMessage.name + ": " + errMessage.message);
}
