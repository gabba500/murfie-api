// globals
var authToken = "";
var discs;
var nowPlayingIndex = 0;
var queue = new Array();
var audioPlayer = new Audio();

// bind eventhandlers after everything is loaded
$(document).ready(function() {
	
	audioPlayer.addEventListener('ended', playNext);

	$('#discs').on('pageshow', function(event,ui){
		// check for token, show "settings" if missing
		if(authToken == null || authToken == ''){
			// show settings
			$.mobile.changePage('#settings', { transition: 'slidedown'});
		} else {
			loadDiscs();
		}
	});

	$('#queue').on('pageshow', function(){
		// display contents of queue
		$('#queuelist').empty();
		$.each(queue, function(key,val) {
			if(key == nowPlayingIndex){
				$('#queuelist').append('<li data-icon="check" data-theme="b"><a href="#discs" rel="external" onclick="playQueueTrack(' + key + ')">' + val.title + '</a></li>').listview('refresh');
			} else {
				$('#queuelist').append('<li data-icon="arrow-l"><a href="#discs" rel="external" onclick="playQueueTrack(' + key + ')">' + val.title + '</a></li>').listview('refresh');
			}
		});
	});
});

function authenticate(){

	postData = { password: $('#password').val(), email: $('#email').val() };
	
	$.post("https://www.murfie.com/api/tokens", postData,
	   function(data) {

	   		apiResult = JSON.parse(data);

	   		authToken = apiResult.user.token;
	   		$.mobile.changePage('#discs', { transition: 'slideup'})
	});
}

function loadDiscs(){

	if(discs == null){

		// show spinner
		$.mobile.showPageLoadingMsg(); 

		$('#disclist').empty();

		// load discs
		$.getJSON('https://www.murfie.com/api/discs.json?auth_token=' + authToken, function(data) {

			// hide spinner
			$.mobile.hidePageLoadingMsg(); 

			discs = data;

			$.each(data, function(key, val) {

				$('#disclist').append('<li><a href="#" rel="external" onclick="showTracks(' + val.disc.id + ')"><img style="width:80px;height:80px" src="'+ val.disc.album.album_art + '"><h3>' + val.disc.album.main_artist + '</h3>' + val.disc.album.title + '</a></li>').listview('refresh');
			});
		});
	} else {
		// nada
	}
}

function showTracks(discId){

	$.mobile.changePage('#tracks', 'pop', true, true);

	loadTracks(discId);
}

function loadTracks(discId){

	$('#tracklist').empty();

	// load tracks
	$.getJSON('https://www.murfie.com/api/discs/' + discId + '.json', function(data) {

		$.each(data.disc.tracks, function(key, val) {

			$('#tracklist').append('<li data-icon="plus"><a href="#" rel="external" onclick="queueTrack(' + discId + ', ' + val.id + ', \'' + val.title + '\')">' + val.title + '</a></li>').listview('refresh');
		});
	});
}

function queueTrack(discId, trackId, title){

	mediaUri = 'http://pocky.herokuapp.com/?discId' + discId +'trackId' + trackId + 'token' + authToken;

	var qTrack = new Object();
	qTrack.title = title;
	qTrack.uri = mediaUri;
	qTrack.discId = discId;
	qTrack.trackId = trackId;

	queue.push(qTrack);
}

function playAudio(){

	// make sure there's something to play
	if(queue.length > nowPlayingIndex){

		// play the next track in the queue
		audioPlayer.src = queue[nowPlayingIndex].uri;
		audioPlayer.play();

		$("#status .ui-btn-text").text(queue[nowPlayingIndex].title);
		$("#playbutton .ui-btn-text").text('pause');

	}else{

		$("#playbutton .ui-btn-text").text('play');
		$("#status .ui-btn-text").text('stopped');
	}
}

function playPause(){

	if($("#playbutton .ui-btn-text").text() == 'play'){

		$("#playbutton .ui-btn-text").text('pause');

		if(audioPlayer.src != ''){
			// play
			audioPlayer.play();
		} else {
			// start
			playAudio();
		}

	} else {

		$("#playbutton .ui-btn-text").text('play');

		// pause
		audioPlayer.pause();

	}
}

function playNext(){

	nowPlayingIndex++;

	if(queue.length > nowPlayingIndex){
		playAudio();
	} else {
		$("#playbutton .ui-btn-text").text('play');
		$("#status .ui-btn-text").text('stopped');
		nowPlayingIndex = nowPlayingIndex - 1;
	}
}

function playPrev(){
	if(nowPlayingIndex > 0){
		nowPlayingIndex = nowPlayingIndex - 1;
		playAudio();
	} else {
		alert('beginning of queue!');
	}
}

function playQueueTrack(queueIndex){
	nowPlayingIndex = queueIndex;
	playAudio();
}