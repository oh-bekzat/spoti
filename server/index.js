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

app.get('/callback', async (req, res) => {
  const code = req.query.code || null

  const response = await axios({
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
  if (response.status === 200) {
    const access_token = response.data.access_token
    res.redirect(`/?access_token=${access_token}`)
  } else {
    res.send(response.data)
  }
})

app.get('/refresh_token', async (req, res) => {
  const { refresh_token } = req.query

  const newToken = await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
  res.send(newToken.data)
})

app.get('/track', async (req, res) => {
  const access_token = req.query.access_token

  const songs = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })

  const selections = 4
  const randomSongs = []

  while (randomSongs.length < selections) {
    const randomIndex = Math.floor(Math.random() * songs.data.items.length)
    if (!randomSongs.includes(songs.data.items[randomIndex])) {
      randomSongs.push(songs.data.items[randomIndex])
    }
  }

  const titles = randomSongs.map(song => `${song.name} by ${song.artists[0].name}`)
  const isrcs = randomSongs.map(song => song.external_ids.isrc)
  console.log(titles)
  const idsResponses = await Promise.all(isrcs.map(isrc => (
    axios.get(`http://api.musixmatch.com/ws/1.1/track.get?track_isrc=${isrc}&apikey=${API_KEY}`)
  )))

  const ids = idsResponses.map(response => response.data.message.body.track.track_id)

  let lyrics

  for (const id of ids) {
    const response = await axios.get(`http://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${id}&apikey=${API_KEY}`)
    const lyricsBody = response?.data?.message?.body?.lyrics?.lyrics_body
    if (lyricsBody) {
      lyrics = lyricsBody.split('\n').filter(line => line.trim() !== '').slice(3, 8)
      break
    }
  }

  res.send({ lyrics: lyrics, titles: titles })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})