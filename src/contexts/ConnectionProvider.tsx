import { ConnectionContext } from './ConnectionContext'
import { useEffect, useRef, useState } from 'react'
import { position, TFigure } from '../utils'

type Props = {
  children: React.ReactNode
}

export interface Navigate {
  (): void;
}

const ConnectionProvider = ({ children }: Props) => {
  const socketRef = useRef<WebSocket>()
  const nameRef = useRef<string>('')
  const sendToRef = useRef<string>('')
  const navigateRef = useRef<Navigate>()
  const roomRef = useRef<string>('')
  const moveFigureRef = useRef<(
    fig: { horizontal: string, vertical: string, fig: TFigure }[],
    fromNet: boolean)=>void>()
  const [peers, setPeers] = useState<string[]>([])

  const socketSend = (message: string) => {
    if(!socketRef.current || socketRef.current.readyState > 1){
      initSocket()
      socketRef.current?.addEventListener('open', event => {
        socketRef.current?.send(message)
      })
    }

    if(socketRef.current?.readyState === 1)
      socketRef.current?.send(message)
  }

  const chooseNickName = (name: string) => {
    if (peers && peers.includes(name)) return undefined
    socketSend(JSON.stringify({ do: 'nick', name: name }))
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
            navigateRef.current!()
            break
          case 'move':
            const move = JSON.parse(JSON.parse(event.data)['move'])
            const figs = move.map((fig: (typeof move)[0]) => ({horizontal: fig.position.horizontal, vertical: fig.position.vertical, fig: fig.figure}))
            moveFigureRef.current!(figs, true)
            break
          case 'ping':
            socketSend(JSON.stringify({ do: 'pong' }))
            break
        }
      }
    }
  }, [socketRef])

  const createOffer = (peer: string, me: string) => {
    socketSend(
      JSON.stringify({
        do: 'play',
        play: peer,
        with: me,
      })
    )
    navigateRef.current!()
  }

  const shareSendMove = (move: string) => {
    socketSend(
      JSON.stringify({
        do: 'move',
        room: roomRef.current,
        move: move,
      })
    )
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

 const setRefNavigate = (navigate: () => void) => {
    navigateRef.current = navigate
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
