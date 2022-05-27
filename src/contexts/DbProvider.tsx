import { DbContext } from './DbContext'
import { color as Ecolor, figure as Efigure, TFigure, convertToDBFigure, position } from '../utils'
import React, { useCallback, useEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
}

const DbProvider = ({ children }: Props) => {
  const tbl = { chess: 'Chess' }
  const dbName = 'Chess'
  const figuresRef = useRef<TFigure[]>([])

  const initDb = useCallback(() => {

    // step1 - create database schema
    const tblChess = {
      name: tbl.chess,
      columns: {
        // Here "Id" is name of column
        Id: { primaryKey: true, autoIncrement: true },
        Figure: { notNull: true, dataType: 'string' },
        Color: { notNull: true, dataType: 'string' },
        Side: { notNull: false, dataType: 'string' },
        Vertical: { notNull: true, dataType: 'string' },
        Horizontal: { notNull: true, dataType: 'string' },
      },
    }
  }, [])

  useEffect(() => {
    initDb()
  }, [initDb])

  const clearTable = () => {
    if (figuresRef.current.length) figuresRef.current = []
  }

  const getAllFigures = (where?: {}): TFigure[] => {
    return figuresRef.current
  }

  const moveFigure = (figure: TFigure, position: position): boolean => {
    try {
      const json = JSON.stringify(figure)
      const index = figuresRef.current.findIndex(fig => JSON.stringify(fig) === json)
      figuresRef.current[index].horizontal = position.horizontal
      figuresRef.current[index].vertical = position.vertical
    } catch(error:any) {
      console.error(error.message)
      return false
    }
    return true
  }

  const placeFigure = (figure: TFigure): boolean => {
    try {
      figuresRef.current.push(figure)
    } catch(error:any) {
      console.error(error.message)
      return false
    }
    return true
  }

  return (
    <DbContext.Provider
      value={{
        clearTable,
        getAllFigures,
        placeFigure,
        moveFigure,
      }}
    >
      {children}
    </DbContext.Provider>
  )
}
export default DbProvider
