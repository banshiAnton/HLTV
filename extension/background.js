window.soundPlay = true;
window.hltvUrl = `https://www.hltv.org/`;
window.matchesList = [];

let localUrl = 'http://localhost:3000'; 
let socketUrl = 'https://still-stream-81266.herokuapp.com/';

chrome.storage.sync.get('soundPlay', (item) => {
    soundPlay = ((Object.keys(item).length) ? item.soundPlay : true);
});

let audio = new Howl({
    urls:['solemn.mp3']
});

let defOptionsNotif = {
    type: 'basic',
    priority: 2,
    iconUrl: 'logo.png',
    title: 'HLTV Live Matches'
};

chrome.notifications.onClicked.addListener((notificationId) => {

    if(notificationId == 'noMatches'){

    } else if(notificationId == 'openMsg') {
        goMatch(hltvUrl + `matches/`);

    } else {
        for(let match of matchesList) {
            if(match.id == +notificationId) {
                goMatch(null, match.id, match.team1.name, match.team2.name, match.event.name);
            }
        }
    }
    chrome.notifications.clear(notificationId)
});

chrome.runtime.onMessage.addListener((message) => {
    soundPlay = message.soundPlay;    
    chrome.storage.sync.set({soundPlay});
});

let socket = io.connect(socketUrl);
socket.on('sendMatches', (data) => {

    matchesList = data;
    createNotofication(defOptionsNotif, matchesList, true);

});

socket.on('newMatches', (data) => {
    matchesList = data.liveMatches;

    createNotofication(defOptionsNotif, data.newMatches, false);
});

socket.on('updateMatches', (data) => {
    matchesList = data;
});

let createNotofication = (options, data, onLoad) => {
    
    if(soundPlay){
        audio.play();
    }

    if(!data.length) {
        options['message'] = `No Matches Now`;
        chrome.notifications.create('noMatches', options);
        return;
    }

    if(onLoad) {
        options['message'] = ``;
        for(let match of data) {
            options['message'] += `${match.team1.name} vs ${match.team2.name}\n`;
        }
        chrome.notifications.create('openMsg', options);
        return;
    }

    for(let match of data) {
        if(!('showed' in match)) {
            options['message'] = `${match.team1.name} vs ${match.team2.name}`;
            chrome.notifications.create(`${match['id']}`, options);
            match.showed = true;
        }
    };

};

window.goMatch = (url, id, ...arr) => {
    if(!url) {
        let reg = new RegExp(' ', 'ig');
        for(let i = 0; i < arr.length; i++) {
            arr[i] = arr[i].trim().toLowerCase();
            if(arr[i].search(reg) !== -1) {
                arr[i] = arr[i].replace(reg, '-');
            }
        };
        url = `https://www.hltv.org/matches/${id}/${arr[0]}-vs-${arr[1]}-${arr[2]}`;
    }

    chrome.windows.getAll({populate: true}, (arr) => {
        if(arr.length) {
            chrome.tabs.create({ url });
        } else {
            chrome.windows.create({url, state: "maximized"});
        }
    });
};
