import { ConnectionContext } from './ConnectionContext'
import { useContext, useEffect, useRef, useState } from 'react'
import { color, TFigure } from '../utils'
import { MessagesContext } from './MessagesContext'

type Props = {
  children: React.ReactNode
}

export interface Navigate {
  (color:color): void;
}

const ConnectionProvider = ({ children }: Props) => {
  const socketRef = useRef<WebSocket>()
  const nameRef = useRef<string>('')
  const sendToRef = useRef<string>('')
  const navigateRef = useRef<Navigate>()
  const roomRef = useRef<string>()
  const lastId = useRef(0)
  const intervalId = useRef<ReturnType<typeof setInterval>>()
  const moveFigureRef = useRef<(
    fig: { horizontal: string, vertical: string, fig: TFigure }[],
    fromNet: boolean)=>void>()
  const [peers, setPeers] = useState<string[]>([])

  const { addMessage } = useContext(MessagesContext)
  let recieved = true
  let intr: ReturnType<typeof setInterval> | undefined = undefined

  const socketSend = (message: string) => {
    if(!socketRef.current || socketRef.current.readyState > 1){
      initSocket()
      socketRef.current?.addEventListener('open', event => {
        socketSend(message)
      })
    }

    if(socketRef.current?.readyState === 1)
      socketRef.current?.send(message)
  }

  const chooseNickName = (name: string) => {
    if (peers && peers.includes(name)) return undefined
    socketSend(JSON.stringify({ do: 'nick', name: name, usePing: true }))
    nameRef.current = name    
    return name
  }

  const initSocket = () => {
    if (!socketRef.current || socketRef.current.readyState > 1) {
      try {
        socketRef.current = new WebSocket(`wss://chess-login.danek-family.cz:443/websockets`)
      } catch (Error) {
        console.error('WebSocket not available')
      }
    }
  }

  useEffect(() => {
    initSocket()
    socketRef.current?.addEventListener('open', event => {
      socketSend(JSON.stringify({ do: 'peers' }))
      socketSend(JSON.stringify({ do: 'check' }))
    })
}, [])

  // Listen for messages
  useEffect(() => {
    if (!socketRef) return
    if (socketRef.current?.onmessage === null) {
      socketRef.current.onmessage = event => {
        const value: Record<string, string> = JSON.parse(event.data)
        const keys = Object.keys(value)
        if (!keys.includes('do')) return
        switch (value.do) {
          case 'peers':
            setPeers(JSON.parse(event.data)['names'])
            break
          case 'accept':
          case 'offer':
            sendToRef.current = JSON.parse(event.data)['offeredBy']
            roomRef.current = JSON.parse(event.data)['room']
            navigateRef.current!( value.do === 'accept'? color.white : color.black )
            break
          case 'move':
            const move = JSON.parse(JSON.parse(event.data)['move'])
            const figs = move.map((fig: (typeof move)[0]) => ({horizontal: fig.position.horizontal, vertical: fig.position.vertical, fig: fig.figure}))
            moveFigureRef.current!(figs, true)
            break
          case 'ping':
            recieved = true
            socketSend(JSON.stringify({ do: 'pong' }))
            break
          case 'ping-start':
            if(intr === undefined) {
              startWaiting()
            }  
            break
          case 'confirm':
            const id = JSON.parse(JSON.parse(event.data)['id'])
            if(id === lastId.current) {
              clearInterval(intervalId.current)
              intervalId.current = undefined
              lastId.current++
            }
            break
        }
      }
    }
  }, [socketRef.current])

  const createOffer = (peer: string, me: string) => {
    socketSend(
      JSON.stringify({
        do: 'play',
        play: peer,
        with: me,
      })
    )
    navigateRef.current!(color.white)
  }

  const shareSendMove = (move: string) => {
    if(intervalId.current) 
      return false

    if(!roomRef.current || roomRef.current.length<16) {
      addMessage('Spojení přerušeno')
      return false
    }

    intervalId.current = setInterval(() => {
      socketSend(
        JSON.stringify({
          do: 'move',
          room: roomRef.current,
          move: move,
          id: lastId.current,
        })
    )}, 200)
    return true
  }

  const acceptSent = (to: string, by:string) => {
    socketSend(
      JSON.stringify({
        do: 'acceptSent',
        to: to,
        by: by,
        room: roomRef.current,
      })
    )
  }

 const setRefNavigate = (navigate: (color:color) => void) => {
    navigateRef.current = navigate
  }

  const startWaiting = () => {
    intr = setInterval( (rec) => {
      if(rec) {
        recieved = false
      } else {
        recieved = true
        socketRef.current?.close()
        socketSend(
          JSON.stringify({
            do: 'reconnect',
            room: roomRef.current,
            name: nameRef.current,
            id: lastId.current,
          }))
        }
      }, 5000, recieved)
  }

  return (
    <ConnectionContext.Provider
      value={{
        chooseNickName,
        createOffer,
        shareSendMove,
        setRefNavigate,
        acceptSent,
        peers,
        socket: socketRef.current,
        name: nameRef.current,
        moveFigureRef,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export default ConnectionProvider
