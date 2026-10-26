function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//This line modifies the DOM, searching for the tag with the numberTweets ID and updating the text.
	//It works correctly, your task is to update the text of the other tags in the HTML file!
	document.getElementById('numberTweets').innerText = tweet_array.length;

	//--- Earliest and latest tweet dates ---
	//Tweets are sorted by time so the first and last elements give the date range.
	let sortedByTime = tweet_array.slice().sort(function(a, b) {
		return a.time - b.time;
	});
	let dateOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
	document.getElementById('firstDate').innerText =
		sortedByTime[0].time.toLocaleDateString('en-US', dateOptions);
	document.getElementById('lastDate').innerText =
		sortedByTime[sortedByTime.length - 1].time.toLocaleDateString('en-US', dateOptions);

	//--- Count the four categories ---
	let counts = {completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0};
	let writtenCount = 0;
	tweet_array.forEach(function(tweet) {
		counts[tweet.source]++;
		if (tweet.source === 'completed_event' && tweet.written) {
			writtenCount++;
		}
	});

	let total = tweet_array.length;
	//Helper to format a count as a percentage of all tweets with two decimal places.
	function pct(count, denominator) {
		return math.format((count / denominator) * 100, {notation: 'fixed', precision: 2}) + '%';
	}

	//A class can appear on multiple spans, so update every matching element.
	function setClass(className, value) {
		let elements = document.getElementsByClassName(className);
		for (let i = 0; i < elements.length; i++) {
			elements[i].innerText = value;
		}
	}

	setClass('completedEvents', counts.completed_event);
	setClass('completedEventsPct', pct(counts.completed_event, total));
	setClass('liveEvents', counts.live_event);
	setClass('liveEventsPct', pct(counts.live_event, total));
	setClass('achievements', counts.achievement);
	setClass('achievementsPct', pct(counts.achievement, total));
	setClass('miscellaneous', counts.miscellaneous);
	setClass('miscellaneousPct', pct(counts.miscellaneous, total));

	//Written text is reported as a share of the completed-event tweets.
	setClass('written', writtenCount);
	setClass('writtenPct', pct(writtenCount, counts.completed_event));
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
