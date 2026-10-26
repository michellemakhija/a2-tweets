//Holds only the user-written tweets, which make for the most interesting search results.
let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//Filter to just the written tweets.
	writtenTweets = tweet_array.filter(function(tweet) {
		return tweet.written;
	});
}

function addEventHandlerForSearch() {
	let searchBox = document.getElementById('textFilter');
	let tableBody = document.getElementById('tweetTable');
	let countSpan = document.getElementById('searchCount');
	let textSpan = document.getElementById('searchText');

	//Re-filter and redraw the table on every keystroke.
	searchBox.addEventListener('input', function() {
		let query = searchBox.value;
		textSpan.innerText = query;

		//An empty query clears the table and reports nothing.
		if (query === '') {
			tableBody.innerHTML = '';
			countSpan.innerText = 0;
			return;
		}

		//Case-insensitive match against the user-written text.
		let lowerQuery = query.toLowerCase();
		let matches = writtenTweets.filter(function(tweet) {
			return tweet.writtenText.toLowerCase().includes(lowerQuery);
		});

		countSpan.innerText = matches.length;
		tableBody.innerHTML = matches.map(function(tweet, index) {
			return tweet.getHTMLTableRow(index + 1);
		}).join('');
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
