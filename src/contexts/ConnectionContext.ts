import { createContext, MutableRefObject } from 'react'
import { TFigure } from '../utils'

type State = {
  chooseNickName: (name: string) => string | undefined
  createOffer: (peer: string, me: string) => void
  shareSendMove: (move: string) => void
  setRefNavigate: (navigate: ()=>void) => void
  acceptSent: (to: string, by:string) => void
  peers: string[]
  socket: WebSocket | undefined
  name: string | undefined
  moveFigureRef: MutableRefObject<((fig: {
    horizontal: string;
    vertical: string;
    fig: TFigure;
}[], fromNet: boolean) => void) | undefined> | undefined
}

export const ConnectionContext = createContext<State>({
  chooseNickName: () => undefined,
  createOffer: () => undefined,
  shareSendMove: () => undefined,
  setRefNavigate: () => undefined,
  acceptSent: () => undefined,
  peers: [],
  socket: undefined,
  name: undefined,
  moveFigureRef: undefined,
})
