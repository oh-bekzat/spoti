import React, { useEffect, useState } from 'react'
import axios from 'axios'

const App = () => {
  const [accessToken, setAccessToken] = useState(null)
  const [tracks, setTracks] = useState([])

  useEffect(() => {
    const handleCallback = () => {
      const params = new URLSearchParams(window.location.search)
      const access_token = params.get('access_token')

      if (access_token) {
        localStorage.setItem('accessToken', access_token)
        setAccessToken(access_token)
        window.location.href = '/'
      }
    }

    const storedAccessToken = localStorage.getItem('accessToken')
    if (storedAccessToken) {
      setAccessToken(storedAccessToken)
    }

    handleCallback()
  }, [])

  const handleLogin = () => {
    window.location.href = '/login'
  }

  const handleProfile = () => {
    axios.get('https://api.spotify.com/v1/albums/18NOKLkZETa4sWwLMIm0UZ/tracks', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      setTracks(response.data.items.map((song) => {
        return song.name
      }))
      console.log(response.data)}
    ).catch(error => {
      console.log(error)
    })

    // axios.get('https://api.spotify.com/v1/tracks/0OEe83mMZ5kaNw5uZQ7ilG', {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`
    //   }
    // }).then(response => console.log(response.data))

    axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50&offset=0', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      console.log(response.data)
    }).catch(error => {
      console.log(error)  
    })
  }
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    setAccessToken(null)
  }

  return (
    <div>
      <h1>Spotify Authentication</h1>
      {accessToken ? (
        <div>
          <p>Access Token: {accessToken}</p>
          <button onClick={handleProfile}>Show user</button>
          <button onClick={handleLogout}>Logout</button>
          <ul>
            {tracks.map((track) => <li>{track}</li>)}
          </ul>
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Spotify</button>
      )}
    </div>
  )
}

export default App
