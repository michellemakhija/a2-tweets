function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	//Only completed events carry an activity type and distance.
	let completed = tweet_array.filter(function(tweet) {
		return tweet.source === 'completed_event' && tweet.activityType !== 'unknown';
	});

	//--- Count how many tweets mention each activity type ---
	let countsByActivity = {};
	completed.forEach(function(tweet) {
		countsByActivity[tweet.activityType] = (countsByActivity[tweet.activityType] || 0) + 1;
	});

	//Build an array for the bar chart and to find the most popular activities.
	let activityCounts = Object.keys(countsByActivity).map(function(activity) {
		return {activity: activity, count: countsByActivity[activity]};
	});
	activityCounts.sort(function(a, b) { return b.count - a.count; });

	document.getElementById('numberActivities').innerText = activityCounts.length;
	document.getElementById('firstMost').innerText = activityCounts[0].activity;
	document.getElementById('secondMost').innerText = activityCounts[1].activity;
	document.getElementById('thirdMost').innerText = activityCounts[2].activity;

	//The three most tweeted-about activities drive the distance visualizations.
	let topThree = [activityCounts[0].activity, activityCounts[1].activity, activityCounts[2].activity];

	//--- Longest and shortest of the top three by average distance ---
	let sumByActivity = {}, nByActivity = {};
	topThree.forEach(function(a) { sumByActivity[a] = 0; nByActivity[a] = 0; });
	//--- Weekday vs. weekend totals (for the top three) ---
	let weekdaySum = 0, weekdayN = 0, weekendSum = 0, weekendN = 0;
	let dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

	let distanceData = [];
	completed.forEach(function(tweet) {
		if (topThree.indexOf(tweet.activityType) === -1) {
			return;
		}
		let dayIndex = tweet.time.getDay();
		distanceData.push({
			activity: tweet.activityType,
			distance: tweet.distance,
			day: dayNames[dayIndex]
		});
		sumByActivity[tweet.activityType] += tweet.distance;
		nByActivity[tweet.activityType]++;
		if (dayIndex === 0 || dayIndex === 6) {
			weekendSum += tweet.distance; weekendN++;
		} else {
			weekdaySum += tweet.distance; weekdayN++;
		}
	});

	let averages = topThree.map(function(a) {
		return {activity: a, avg: sumByActivity[a] / nByActivity[a]};
	});
	let longest = averages.reduce(function(a, b) { return a.avg > b.avg ? a : b; });
	let shortest = averages.reduce(function(a, b) { return a.avg < b.avg ? a : b; });
	document.getElementById('longestActivityType').innerText = longest.activity;
	document.getElementById('shortestActivityType').innerText = shortest.activity;

	let weekdayAvg = weekdaySum / weekdayN, weekendAvg = weekendSum / weekendN;
	document.getElementById('weekdayOrWeekendLonger').innerText =
		weekendAvg > weekdayAvg ? 'weekends' : 'weekdays';

	//--- Plot 1: number of tweets per activity type ---
	activity_vis_spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "A graph of the number of Tweets containing each type of activity.",
		"data": {
			"values": activityCounts
		},
		"mark": "bar",
		"encoding": {
			"x": {"field": "activity", "type": "nominal", "title": "Activity type",
				"sort": {"field": "count", "order": "descending"}},
			"y": {"field": "count", "type": "quantitative", "title": "Number of Tweets"}
		}
	};
	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

	let weekSort = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

	//--- Plot 2: every activity's distance by day of week ---
	let distance_vis_spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Distances by day of the week for the three most popular activities.",
		"data": {"values": distanceData},
		"mark": "point",
		"encoding": {
			"x": {"field": "day", "type": "nominal", "title": "Day of the week", "sort": weekSort},
			"y": {"field": "distance", "type": "quantitative", "title": "Distance (miles)"},
			"color": {"field": "activity", "type": "nominal", "title": "Activity type"}
		}
	};
	vegaEmbed('#distanceVis', distance_vis_spec, {actions:false});

	//--- Plot 3: mean distance by day of week ---
	let distance_vis_aggregated_spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "Mean distances by day of the week for the three most popular activities.",
		"data": {"values": distanceData},
		"mark": "point",
		"encoding": {
			"x": {"field": "day", "type": "nominal", "title": "Day of the week", "sort": weekSort},
			"y": {"aggregate": "mean", "field": "distance", "type": "quantitative",
				"title": "Mean distance (miles)"},
			"color": {"field": "activity", "type": "nominal", "title": "Activity type"}
		}
	};
	vegaEmbed('#distanceVisAggregated', distance_vis_aggregated_spec, {actions:false});

	//Start by showing the per-activity plot; the button swaps to the aggregated view.
	let aggregatedVisible = false;
	document.getElementById('distanceVisAggregated').style.display = 'none';
	document.getElementById('aggregate').addEventListener('click', function() {
		aggregatedVisible = !aggregatedVisible;
		document.getElementById('distanceVis').style.display = aggregatedVisible ? 'none' : 'block';
		document.getElementById('distanceVisAggregated').style.display = aggregatedVisible ? 'block' : 'none';
		this.innerText = aggregatedVisible ? 'Show all activities' : 'Show means';
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
