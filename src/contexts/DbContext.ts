import { TFigure, position } from '../utils'
import { createContext } from 'react'

type State = {
  clearTable: (name?: string) => void
  getAllFigures: (where?: {}) => TFigure[]
  placeFigure: (figure: TFigure) => boolean
  moveFigure: (figure: TFigure, position: position) => boolean
}

export const DbContext = createContext<State>({
  clearTable: () => undefined,
  getAllFigures: () => [],
  placeFigure: () => false,
  moveFigure: () => false,
})
