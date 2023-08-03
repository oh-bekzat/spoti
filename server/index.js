const express = require('express')
const cors = require('cors')
const axios = require('axios')
const querystring = require('querystring')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI
const API_KEY = process.env.API_KEY

app.get('/', (req, res) => {
  res.send('Thats the main page')
})

const generateRandomString = length => {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const stateKey = 'spotify_auth_state'

app.get('/login', (req, res) => {
  const state = generateRandomString(16)
  res.cookie(stateKey, state)

  const scope = 'user-read-private user-read-email user-top-read'

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope,
  })
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`)
})

app.get('/callback', (req, res) => {
  const code = req.query.code || null

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      if (response.status === 200) {
        const access_token = response.data.access_token
        res.redirect(`/?access_token=${access_token}`)
      } else {
        res.send(response)
      }
    })
    .catch(error => {
      res.send(error)
    })
})

app.get('/refresh_token', (req, res) => {
  const { refresh_token } = req.query

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  }).then(response => {
    res.send(response.data)
  }).catch(error => {
    res.send(error)
  })
})

app.get('/track', async (req, res) => {
  const access_token = req.query.access_token
  const spotifyResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  const isrcs = spotifyResponse.data.items.map(song => song.external_ids.isrc)
  const selections = 5
  const randomIsrcs = []

  while (randomIsrcs.length < selections) {
    const randomIndex = Math.floor(Math.random() * isrcs.length)
    if (!randomIsrcs.includes(isrcs[randomIndex])) {
      randomIsrcs.push(isrcs[randomIndex])
    }
  }
  const idsResponses = await Promise.all(randomIsrcs.map(isrc => (
    axios.get(`http://api.musixmatch.com/ws/1.1/track.get?track_isrc=${isrc}&apikey=${API_KEY}`)
  )))
  const ids = idsResponses.map(response => response.data.message.body.track.track_id)
  console.log(ids)
  const lyricsResponses = await Promise.all(ids.map(id => (
    axios.get(`http://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${id}&apikey=${API_KEY}`)
  )))
  res.send(lyricsResponses.map(response => response.data.message.body.lyrics.lyrics_body
    .split('\n')
    .filter(line => line.trim() !== '')
    .slice(3, 8)))
})


const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})