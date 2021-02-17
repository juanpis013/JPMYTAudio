// server.js
// where your node app starts

const app = require("express")()
const ytdl = require("ytdl-core")
const path = require("path")
const ytpl = require('ytpl')
const urlp = require('url');
const querystring = require('querystring');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// Add headers
const getPlaylist = async (req, res) => {
    const {url} = req.query
    console.log("getPlaylist URL: " + url)
    try {
        let remoteUrl = urlp.parse(url)
        let remoteQs = querystring.parse(remoteUrl.query)
        console.log("List Value:" + remoteQs.list)
        let playlistObj = await ytpl(remoteQs.list,{limit:1000})
        console.log("Total of videos: " + playlistObj.items.length)
        return res.status(200).json({
            success: true,
            data: {
                playlist: playlistObj
            }
        })
    }
    catch(error) {
        console.log("Error: " + error)
    }
    return res.status(200).json({})
}

const getInfo = async (req, res) => {

    try {
        const { url } = req.query
        console.log("getInfo URL: " + url)
        const videoId = ytdl.getURLVideoID(url)

        const videoInfo = await ytdl.getInfo(videoId)
        const { thumbnails, author, title, lengthSeconds } = videoInfo.videoDetails
        /*let duration = getDuration(lengthSeconds)
        console.log(duration)*/

        return res.status(200).json({
            success: true,
            data: {
                thumbnail: thumbnails[0].url || null,
                videoId, author: author ? author['name'] : null, title, lengthSeconds
            }
        })

    } catch (error) {
        console.log(`error --->`, error);
        return res.status(500).json({ success: false, msg: "Failed to get video info" })
    }

}

/*const getAudioInfo = async (req, res) => {

    try {
        const { videoId } = req.params
        const isValid = ytdl.validateID(videoId)

        if (!isValid) {

            throw new Error()
        }

        const videoInfo = await ytdl.getInfo(videoId)
        let audioFormat = videoInfo.formats.filter(x => (x.mimeType.includes('audio/mp4')));
        //res.json(audioFormat)
        res.json(videoInfo)

    } catch (error) {
        console.log(error);
        //let noAudioFile = './noaudio.mp3'
        return res.json(error)
    }
}*/

const getAudioStream = async (req, res) => {

    try {

        const { videoId } = req.params
        const isValid = ytdl.validateID(videoId)

        if (!isValid) {

            throw new Error()
        }

        const videoInfo = await ytdl.getInfo(videoId)
        let audioFormatMp4 = videoInfo.formats.filter(x => (x.mimeType.includes('audio/mp4')));
        let audioFormat = ytdl.chooseFormat(audioFormatMp4, {
            filter: "audioonly"
        });

        const { itag, container, contentLength } = audioFormat

        // define headers
        const rangeHeader = req.headers.range || null

        console.log(`rangeHeader -->`, rangeHeader);
        const rangePosition = (rangeHeader) ? rangeHeader.replace(/bytes=/, "").split("-") : null
        console.log(`rangePosition`, rangePosition);
        const startRange = rangePosition ? parseInt(rangePosition[0], 10) : 0;
        const endRange = rangePosition && rangePosition[1].length > 0 ? parseInt(rangePosition[1], 10) : contentLength - 1;
        const chunksize = (endRange - startRange) + 1;

        res.writeHead(206, {
            'Content-Type': `audio/${container}`,
            'Content-Length': chunksize,
            "Content-Range": "bytes " + startRange + "-" + endRange + "/" + contentLength,
            "Accept-Ranges": "bytes",
        })

        const range = { start: startRange, end: endRange }
        const audioStream = ytdl(videoId, { filter: format => format.itag === itag, range })
        audioStream.pipe(res)

    } catch (error) {
        console.log(error);
        let noAudioFile = './noaudio.mp3'
        return res.status(200).download(noAudioFile)    }
}


const playerView = (req, res) => {
    res.sendFile(path.resolve("./public/player.html"));
}

const playerView2 = (req, res) => {
    res.sendFile(path.resolve("./public/player2.html"));
}

const iconView = (req, res) => {
    res.sendFile(path.resolve("./public/favicon.png"));
}

const pingView = (req, res) => {
    let response = {
        status: "OK"
    }
    res.json(response);
}


// Routes
app.get("/playlist",getPlaylist)
app.get("/info", getInfo)
//app.get("/audioinfo/:videoId", getAudioInfo)
app.get("/stream/:videoId", getAudioStream)
app.get('/', playerView)
app.get('/player2', playerView2)
app.get('/favicon.ico', iconView)
app.get('/ping', pingView)



const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Running on ${PORT}`))

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.

// our default array of dreams

// send the default array of dreams to the webpag

// listen for requests :)
/*const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
*/