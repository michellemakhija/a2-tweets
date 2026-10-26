class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        //Categorize each tweet by the template RunKeeper used to generate it.
        if (this.text.startsWith('Just completed') || this.text.startsWith('Just posted')) {
            return 'completed_event';
        } else if (this.text.startsWith('Watch my')) {
            //e.g. "Watch my run right now with @Runkeeper Live ..."
            return 'live_event';
        } else if (this.text.startsWith('Achieved a new') || this.text.startsWith('I just set')) {
            //personal records and newly-set goals
            return 'achievement';
        } else {
            return 'miscellaneous';
        }
    }

    //Removes the activity link and any hashtags so only human-facing text remains.
    private get cleanedText():string {
        return this.text
            .replace(/https?:\/\/\S+/g, '')  //strip the t.co link
            .replace(/#\w+/g, '')            //strip hashtags such as #Runkeeper
            .trim();
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        //User-written completed tweets use the "... - <their text>" format,
        //while the default template reads "... with @Runkeeper. Check it out!".
        if (this.source != 'completed_event') {
            return false;
        }
        let dashIndex = this.cleanedText.indexOf(' - ');
        return dashIndex !== -1 && this.cleanedText.substring(dashIndex + 3).trim().length > 0;
    }

    get writtenText():string {
        if(!this.written) {
            return "";
        }
        //Return everything the person typed after the " - " separator.
        let cleaned = this.cleanedText;
        let dashIndex = cleaned.indexOf(' - ');
        return cleaned.substring(dashIndex + 3).trim();
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        //The activity word directly follows the distance unit, e.g. "4.87 km run".
        let match = this.text.match(/(?:km|mi)\s+([a-zA-Z]+)/);
        return match ? match[1] : "unknown";
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        //Grab the number and its unit, then convert kilometers to miles.
        let match = this.text.match(/([\d.]+)\s*(km|mi)/);
        if (!match) {
            return 0;
        }
        let value = parseFloat(match[1]);
        if (match[2] === 'km') {
            value = value / 1.609;
        }
        return value;
    }

    //Bonus: rough sentiment of the user-written text using a small word list.
    get sentiment():string {
        const positive = ['good','great','awesome','amazing','love','loved','happy','best','nice',
            'fun','strong','pr','pb','beautiful','perfect','excellent','enjoyed','enjoy','wonderful',
            'fantastic','proud','easy','fresh','win','won','smile','smiles'];
        const negative = ['bad','tired','hard','tough','pain','painful','slow','hate','worst',
            'terrible','sore','exhausted','hurt','difficult','sad','awful','struggle','struggled',
            'cold','wet','rough','dead','sick','ache','aching'];
        if (!this.written) {
            return "";
        }
        let score = 0;
        for (let word of this.writtenText.toLowerCase().split(/\W+/)) {
            if (positive.includes(word)) score++;
            if (negative.includes(word)) score--;
        }
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    getHTMLTableRow(rowNumber:number):string {
        //Turn the activity link into a clickable anchor and summarize the tweet in a row.
        let linkedText = this.text.replace(/(https?:\/\/\S+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>');
        return `<tr><td>${rowNumber}</td><td>${this.activityType}</td>`
            + `<td>${linkedText}</td><td>${this.sentiment}</td></tr>`;
    }
}
