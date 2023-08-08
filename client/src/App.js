import React, { useEffect, useState } from 'react'
import axios from 'axios'

const App = () => {
  const [accessToken, setAccessToken] = useState(null)
  const [tracks, setTracks] = useState(null)
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState(0)

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken')
    if (storedAccessToken) { setAccessToken(storedAccessToken) }
    const params = new URLSearchParams(window.location.search)
    const access_token = params.get('access_token')
    if (access_token) {
      localStorage.setItem('accessToken', access_token)
      setAccessToken(access_token)
      window.location.href = '/'
    }
  }, [])

  const handleQuiz = () => {
    axios.get('/track', {
      params: {
        access_token: accessToken
      }
    })
      .then(response => {
        setTracks(response.data)
        console.log(response.data)
      })
      .catch(error => {
        console.error(error)
      })
  }
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    setAccessToken(null)
  }

  const handleChoice = (id) => {
    if (question === 9) {
      console.log('stop')
    }
    if (id === tracks[question].lyricsIndex) {
      setScore(score + 1)
      setQuestion(question + 1)
      console.log('Congrats! You chose the correct song!');
    } else {
      console.log('Oops! Try again!');
    }
  }

  // const handleUser = async () => {
  //   const user = await axios.get('https://api.spotify.com/v1/me', {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`
  //     }
  //   })

  //   await axios.get('/user', 
  //    { params: { user.data.id, songs }
  //   })
  // }

  return (
    <div>
      <h1>Spotify Authentication</h1>
      {accessToken ? (
        <div>
          {/* <button onClick={() => handleUser()}>NEW USER</button> */}
          <p>Access Token: {accessToken}</p>
          <button onClick={handleQuiz}>Show user</button>
          <button onClick={handleLogout}>Logout</button>
          {tracks && (
            <div>
              <ul>
                {tracks[question].idTitles
                  .map(idTitle => <button key={idTitle.id} onClick={() => handleChoice(idTitle.id)}>{idTitle.title}</button>)}
              </ul>
              {tracks[question].lyrics
                .map(line => <>{line}<br /></>)}
              <p>Score: {score}</p>
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => window.location.href = '/login'}>Login with Spotify</button>
      )}
    </div>
  )
}

export default App
