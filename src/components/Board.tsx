import { A, H, TFigure, color, figure, getCharRange, getNumRange, position } from '../utils'
import { Button, Dimensions, Platform, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ConnectionContext } from '../contexts/ConnectionContext'
import { DbContext } from '../contexts/DbContext'
// import { MessagesContext } from '../contexts/MessagesContext'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'

type Props = {
  chclr: color
}

const Board = ({chclr}: Props) => {
  const [chcolor, setChcolor] = useState(chclr)
  const navigation = useNavigation()

  const getCondNumRange = (clr: color = chcolor) => {
    return clr === color.black ? getNumRange() : getNumRange().reverse()
  }

  const getCondCharRange = (clr: color = chcolor) => {
    return clr === color.black ? getCharRange().reverse() : getCharRange()
  }

  const { shareSendMove, moveFigureRef } = useContext(ConnectionContext)
  // const { addMessage } = useContext(MessagesContext)

  const changeChcolor = (color: color) => {
    setChcolor(color)
    setNumRange(getCondNumRange(color))
    setCharRange(getCondCharRange(color))
  }

  const [numRange, setNumRange] = useState(getCondNumRange())
  const [charRange, setCharRange] = useState(getCondCharRange())
  const { clearTable, getAllFigures, placeFigure, moveFigure } = useContext(DbContext)
  const [figures, setFigures] = useState<TFigure[]>([])
  const [move, setMove] = useState<TFigure>()
  const [available, setAvailable] = useState<position[]>([])
  const [playing, setPlaying] = useState(color.white)
  const [smallCastle, setSmallCastle] = useState({ white: -1, black: -1 })
  const [bigCastle, setBigCastle] = useState({ white: 1, black: 1 })
  const [kingMoved, setKingMoved] = useState({ white: false, black: false })

  const barvy = { black: 'Černá', white: 'Bílá' }

  const opositeChcolor = (chcolor: color) => {
    return chcolor === color.white ? color.black : color.white
  }

  useEffect(() => {
    moveFigureRef!.current = moveFig
  },[])

  useEffect(() => {
    if(figures.length===0) {
      getReady()
      getFigures()
    }
  },[])


  const setKingMovedByPlayer = useCallback(
    (value: boolean) => {
      const kng = { ...kingMoved }
      kng[color[playing] as keyof typeof kingMoved] = value
      setKingMoved(kng)
    },
    [kingMoved, playing]
  )

  const setBigCastleByPlayer = useCallback(
    (value: number) => {
      const big = { ...bigCastle }
      big[color[playing] as keyof typeof bigCastle] = value
      setBigCastle(big)
    },
    [bigCastle, playing]
  )

  const setSmallCastleByPlayer = useCallback(
    (value: number) => {
      const small = { ...smallCastle }
      small[color[playing] as keyof typeof smallCastle] = value
      setSmallCastle(small)
    },
    [smallCastle, playing]
  )

  const filterFigure = useCallback(
    (horizontal: string, vertical: string) => {
      return figures.filter(
        figure => figure.horizontal === horizontal && figure.vertical === vertical
      )
    },
    [figures]
  )

  const moveFig = useCallback(
    (
      fig: { horizontal: string; vertical: string; fig?: TFigure }[],
      fromNet: boolean = false
    ) => {
      const pro: { figure: TFigure; position: position }[] = []
      let clearMove = false
      fig.forEach(item => {
        const tmp = item.fig ? item.fig : move
        if (!item.fig) clearMove = true
        if (!tmp) return false
        const filtered = filterFigure(item.horizontal, item.vertical)
        filtered.forEach(found => {
          if (found.color !== playing) {
            pro.push({ figure: found, position: { horizontal: 'A', vertical: '0' } })
          }
        })
        pro.push({
          figure: tmp,
          position: { horizontal: item.horizontal, vertical: item.vertical },
        })
      })
      if (!fromNet && pro.length > 0) shareSendMove(JSON.stringify(pro))

      pro.forEach(item => {
        if (item.figure.figure === figure.Tower) {
          if (item.position.horizontal === 'A') setSmallCastleByPlayer(0)
          else setBigCastleByPlayer(0)
        } else if (item.figure.figure === figure.King) setKingMovedByPlayer(true)
        const index = getAllFigures().findIndex(
          figure => JSON.stringify(item.figure) === JSON.stringify(figure)
        )
        if (index < 0) return false
        moveFigure(item.figure, {
          horizontal: item.position.horizontal,
          vertical: item.position.vertical,
        })
        const figs = getAllFigures()
        figs[index].horizontal = item.position.horizontal
        figs[index].vertical = item.position.vertical
        setFigures([...figs])
      })
      if (pro.length > 0) setPlaying(opositeChcolor(pro[pro.length - 1].figure.color))
      if (clearMove) setMove(undefined)
      return true
    },
    [
      filterFigure,
      move,
      moveFigure,
      playing,
      setBigCastleByPlayer,
      setKingMovedByPlayer,
      setSmallCastleByPlayer,
      getAllFigures,
      shareSendMove,
    ]
  )

  const getReady = () => {
    const colors = [chcolor, opositeChcolor(chcolor)]
    const boardLine = chcolor === color.white ? ['1', '8'] : ['8', '1']
    const phalanxLine = chcolor === color.white ? ['2', '7'] : ['7', '2']
    const sides = ['Right', 'Left']

    colors.forEach((clr, index) => {
      charRange.forEach((item, charIndex) => {
        placeFigure({
          color: clr,
          figure: figure.Phalanx,
          side: (chcolor === color.white ? charRange.length - charIndex : charIndex + 1).toString(),
          horizontal: item.toString(),
          vertical: phalanxLine[index],
        } as TFigure)
      })

      for (let i = 1; i <= 3; i++) {
        sides.forEach((side, sideIndex) => {
          placeFigure({
            color: clr,
            figure: figure[figure[i] as keyof typeof figure],
            side: side,
            horizontal: String.fromCharCode(
              A + sideIndex * 7 + (i - 1) * (sideIndex === 0 ? 1 : -1)
            ),
            vertical: boardLine[index],
          } as TFigure)
        })
      }
      for (let i = 4; i <= 5; i++) {
        placeFigure({
          color: clr,
          figure: figure[figure[i] as keyof typeof figure],
          side: '',
          horizontal: String.fromCharCode(H - i + 1),
          vertical: boardLine[index],
        } as TFigure)
      }
    })
  }

  const getFigures = useCallback(() => {
    const loadedFigures = getAllFigures()
    if (loadedFigures.length === 0) {
      return false
    }
    setFigures(loadedFigures)
    return true
  }, [getAllFigures])

  useEffect(() => {
    if (figures.length === 0) getFigures()
  }, [getFigures, figures.length])

  const getClass = (pfigure: TFigure | undefined) => {
    if (!pfigure) return ''
    const fig = figure[pfigure.figure]
    const clr = color[pfigure.color]

    const side = fig === 'Horse' ? pfigure.side : ''
    return `${clr}${fig}${side}`.trim()
  }

  const getLetters = () => {
    return (
      <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
        <View style={styles.sizedWidth}></View>
        {charRange.map((chars, index) => (
          <View key={index} style={styles.sizedWidth}>
            <Text style={{ textAlign: 'center' }}>{chars}</Text>
          </View>
        ))}
        <View style={styles.sizedWidth}></View>
      </View>
    )
  }

  const findFigure = (horizontal: string, vertical: string) => {
    return figures.find(figure => figure.horizontal === horizontal && figure.vertical === vertical)
  }

  const findAvailable = (position: position) => {
    return available.find(
      item => item.horizontal === position.horizontal && item.vertical === position.vertical
    )
  }

  const front = (pos: position, white: boolean) => {
    const avail: position[] = []
    const mult = white ? 1 : -1
    const vert = parseInt(pos.vertical)
    const start = vert === (white ? 2 : 7) ? 1 : 0
    for (let i = 1; i < 2 + (start * avail.length === 0 ? 0 : 1); i++) {
      const front = vert + mult * i
      if (front < 9 && front > 0) {
        const charFront = front.toString()
        const found = findFigure(pos.horizontal, charFront)
        if (!found) {
          avail.push({ horizontal: pos.horizontal, vertical: charFront })
        }
      }
    }

    for (let i = -1; i <= 1; i += 2) {
      const front = vert + mult
      const side = pos.horizontal.charCodeAt(0) + i
      if (front < 9 && front > 0 && side >= A && side <= H) {
        const charFront = front.toString()
        const charSide = String.fromCharCode(side)
        const found = findFigure(charSide, charFront)
        if (found && found.color === color[white ? 'black' : 'white']) {
          avail.push({ horizontal: charSide, vertical: charFront })
        }
      }
    }
    return avail
  }

  const continuousStraight = (pos: position, white: boolean) => {
    const avail: position[] = []
    const vert = parseInt(pos.vertical)
    const hori = pos.horizontal.charCodeAt(0)
    for (let i = 1; i < 5; i++) {
      let straight = 0
      for (let j = 1; j < 2 + straight; j++) {
        const front = vert + (i < 3 ? (i % 2 === 0 ? 1 : -1) * j : 0)
        const side = hori + (i < 3 ? 0 : i % 2 === 0 ? 1 : -1) * j
        if (front < 9 && front > 0 && side <= H && side >= A) {
          const charFront = front.toString()
          const charSide = String.fromCharCode(side)
          const found = findFigure(charSide, charFront)
          if (!found || found.color === color[white ? 'black' : 'white']) {
            avail.push({ horizontal: charSide, vertical: charFront })
            if (!found) straight++
          }
        }
      }
    }
    return avail
  }

  const horseRule = (pos: position, white: boolean) => {
    const avail: position[] = []
    const vert = parseInt(pos.vertical)
    const hori = pos.horizontal.charCodeAt(0)
    for (let i = 1; i < 5; i++) {
      for (let j = -1; j <= 1; j += 2) {
        const front = vert + (i < 3 ? (i % 2 === 0 ? 1 : -1) * j : j * 2)
        const side = hori + (i < 3 ? 2 : i % 2 === 0 ? 1 : -1) * j
        if (front < 9 && front > 0 && side <= H && side >= A) {
          const charFront = front.toString()
          const charSide = String.fromCharCode(side)
          const found = findFigure(charSide, charFront)
          if (!found || found.color === color[white ? 'black' : 'white']) {
            avail.push({ horizontal: charSide, vertical: charFront })
          }
        }
      }
    }
    return avail
  }

  const continuousSideway = (pos: position, white: boolean) => {
    const avail: position[] = []
    const vert = parseInt(pos.vertical)
    const hori = pos.horizontal.charCodeAt(0)
    for (let i = 1; i < 5; i++) {
      let straight = 0
      for (let j = 1; j < 2 + straight; j++) {
        const front = vert + (i < 3 ? 1 : -1) * j
        const side = hori + (i % 2 === 0 ? 1 : -1) * j
        if (front < 9 && front > 0 && side <= H && side >= A) {
          const charFront = front.toString()
          const charSide = String.fromCharCode(side)
          const found = findFigure(charSide, charFront)
          if (!found || found.color === color[white ? 'black' : 'white']) {
            avail.push({ horizontal: charSide, vertical: charFront })
            if (!found) straight++
          }
        }
      }
    }
    return avail
  }

  const around = (pos: position, white: boolean) => {
    const avail: position[] = []
    const vert = parseInt(pos.vertical)
    const hori = pos.horizontal.charCodeAt(0)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const front = vert + i
        const side = hori + j
        if (front < 9 && front > 0 && side <= H && side >= A && (i !== 0 || j !== 0)) {
          const charFront = front.toString()
          const charSide = String.fromCharCode(side)
          const found = findFigure(charSide, charFront)
          if (!found || found.color === color[white ? 'black' : 'white']) {
            avail.push({ horizontal: charSide, vertical: charFront })
          }
        }
      }
    }
    return avail
  }

  const castle = (pos: position, white: boolean) => {
    const avail: position[] = []
    const hori = pos.horizontal.charCodeAt(0)
    if (
      kingMoved[color[playing] as keyof typeof kingMoved] ||
      !smallCastle[color[playing] as keyof typeof smallCastle] ||
      !bigCastle[color[playing] as keyof typeof bigCastle]
    )
      return []
    for (
      let i = smallCastle[color[playing] as keyof typeof smallCastle];
      i <= bigCastle[color[playing] as keyof typeof bigCastle];
      i += 2
    ) {
      let straight = 1
      for (let j = 1; j < 1 + straight; j++) {
        const found = findFigure(String.fromCharCode(hori + i * j), pos.vertical)
        if (!found) {
          straight++
        } else if (found.figure === figure.Tower && ['A', 'H'].includes(found.horizontal)) {
          avail.push({ horizontal: found.horizontal, vertical: found.vertical })
        }
      }
    }
    return avail
  }

  const applyRules = (fig: TFigure) => {
    switch (figure[fig.figure]) {
      case figure[figure.Phalanx]:
        setAvailable(
          front(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          )
        )
        break
      case figure[figure.Tower]:
        setAvailable(
          continuousStraight(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          )
        )
        break
      case figure[figure.Horse]:
        setAvailable(
          horseRule(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          )
        )
        break
      case figure[figure.Bishop]:
        setAvailable(
          continuousSideway(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          )
        )
        break
      case figure[figure.Queen]:
        setAvailable([
          ...continuousSideway(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          ),
          ...continuousStraight(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          ),
        ])
        break
      case figure[figure.King]:
        setAvailable([
          ...around(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          ),
          ...castle(
            { horizontal: fig.horizontal, vertical: fig.vertical },
            color[fig.color] === 'white'
          ),
        ])
        break
    }
  }

  const getFigure = (figure: string) => {
    switch (figure) {
      case 'blackHorseLeft':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhgQB6AMIBADMzMwAAAP///5mZmczMzGZmZgAAAAAAACH5BAEKAAcALAAAAACBAHoAAAP+eLrc/jDKSesBNuvNOwTgBmJeaZ7cGFoqib5w3LrSHN+4N9PPnv/AyY7X8AWPyOHKMUQ6gcrlQvms3qJEqnV7wtKw3HDKS/KKzyyyGs2uqcntOPNtltvpazsb/9YHVR98fX5XTQqCfIQwiIxRil2NkUaPIkoBkoyUGlGXAZeYiZoUnAACA5+geKJuQwEFAgIFqKl0qz2WrwIAs7S1tgytAQMCBJ6gnsjGvr8HyCqew8W8jQPVBQW7znCrzwOynQEExMqYl+KwsAQD2duUz6Wm2eKn05GeucTo6/U27u/nBeaR63VpnCuA/AA92nFPX8Jyw3ZlyyURDCFL4Uw9LCf+blZBAQMn3bE07FQvhh09vpJlcWSrkiFP7orIKwCsmArlcIqG82TBYi2E6XrokuEraTJbiWM5oqBJLW1I3dxIEN43ZCuJ6mQIr2LSVvDWjYDlVeQebfJiUU1qDh06plDPNAVA4GpGuF85XSpgrWxcLu/SyYKZ902ynv3CzLg0DB3SwnkVM4RGdi3kRpKVDr0MectOjaksJ7XC6ahoL+A4m/0DtvKxUk9Vt3DCaelpLE5v90qCC3Ro2Lp3s+Y6lVGyub5lzx6+2LZx4MhjK8+ZIxs5V8kFeRrX1CbQ6ctxgPBU93jxRhm9eg9+Uvx4ePGE4kWEPXZG9niOrzYR9GD+Ou4cbTaTgHmF891+OvTHmGvldNVJVpCll9ALUkknCXbS5BYhPD1RGMx5ofG0HUj4GWYaP5C8pJZMQhEw4HxsiYhgBpaUcqBPFK13GWWPhTeGZn4RlAtfBBYoVJEjJEjcjWzR5ZBq2K3oI40kIdlgf/gE+dVHFhIxSmtMlnNYMgHB0qWRzlFXwWdaomejN3w1ls4ALpbIB3lIVrKYjXZydY5bxGCjTJ/58Tnll2gJ1aY9Ax0WAqF30nRoDa7sYwyAbDkaniMsQqhmIOOdU94wMMo2hxQXVJUdqre8V6ZbkGZC5W9q6fdld/ekCR6rQtCqjjqC8jpFMOIsytmPF+L+86SXwxJ35nTIokdAnXtVFAGbsWIWLXpjJgnqYjaBtGti297pyLdBeTqut0rKhG5QKa37abmYvBtdtpF4KNypi6krr7B6ptIqSiT+O2+7kgwclKEGs6tvvgo/42/DMtQbcVPxNuwwCgnbmw2mGjNbgrbXWveglCEDjPAglNIpqIQpHzyyKqwcaSbIMbuXByvjVbpszBtzbIjKwCiIXakpVzfprYtJCrTMaHBy09PkbuUsvpHp0RvST2utorFAFwVvwVQbsseHYZYN9RM1rqr20lVsjbWpcn09t3JiVInY22srrdnefAd9hNRpBz7jD8+goqPhO9Mm0WFuM/7XH1FwElMNypLXMRxjf8LCdeZV62wyZWCDDneKTZNteuMVEwz46qevjLG4sC/z8GJT12476rgXrvvksveM8++a84f23WoLPVnkxJ9r/PLPNg/8Jh9GL73ZHbRt/fWhUw9W6dz3XTJG4e/uffmgBI8+Ih4kAAA7',
            }}
            style={styles.figure}
          />
        )

      case 'blackBishop':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhjACDAMIAAAAAADMzM////2ZmZpmZmczMzAAAAAAAACH5BAEKAAcALAAAAACMAIMAAAP+eLrc/jBKFupcNdzNu//gBoykFmWjFa5s60ZkPEJBWQPmq+88LMc5zIggKBZqwZ5yyfrJkjVi0YhLMq9Yn7NEwU2/A1x2TG5sZd3Bd0oQl9/Zcyy9Lrat8Lzudg4i6wJIeoM9cm5Cal93hIx7fQ4VXgIFYSqNlyB8TjkZmjcZmKEchk98FQMEBAOfeKKuB6ROBAWAk2FVr7masSSJtZNIrbl6u7wxUr+VwsNlxcZAv3a4zIPOzzK0v22H1M3Xsdm1d8vdhd+xyIDj5WPnxul1lexY7s/wa4LzStb1W/dfKfTx4NfP368C0wS6KPgtXJ1FClswPBctX8QQE78FOJj+8GIHghm3+IrHzeMFkCG3OMRX0qSWlNe0dXT5ACVMJyNZknN5093KKQgt0Wxgs6eTZC2HwjJ6bmOtmUOLMv3xs4g8pQum1qsVdKc+qegy/hNwVSlYQ7QQTuQK9eJZOeHUFsw5pazLtyrXyO3H1ms5sYBu9Rtr0SPevIoyiksq8DBiAdsm/gtKEyYywQyd1ims0LFBqymrQnRruW5KukXasrt5GWYtu19Zm075b3Rj2aBTal7DuFvP1q4BcV6Nm2xxML2HeT4D/LS65LqMRUI3mxRmQ7uBQn8lvYjN5nISGas1nBqv3QPSq1+vPpwq9vDT8foH2zep7NHy658SC7X+7b+k7CfggHud8Zxfl9iE2oAMTmETIJTNU9RIqVRooYVxXajhLF8UdU+E7EiVyHWfGUeKFCICsl0oYKU3X3WGEAAWfgKsiAlT4OmmIoKNLMccjMHxxiMjPpZIYkg7xvYbkKHpZWOCRuVIm5NDMhIlkyHlBCJxxR2ZUU7/2dclU9nVZ96SufVU5pOXXJnmTdmVx4ybJqoppEJ0ejnRblvOA+cXBepoWpWNwERjkUc5yOaNU5L0JxWEFloacnZKE6mkjdZ5ky9mcjmlnhP5ohqAcGolRZgCaeWmnH6qelNai3LnanCs6jNrSBv16dGtXwYS6zC8MkTLqHgGy1enpBn+21RXWClgFApiIWtYPwGgUhWEqpwlrUnfWGtEtgSdwqEt5/3qaXjZqFJQAKfedympZyQSGa6wbgFKsw7ES+5UtBwpFL5CUKXpVLn+8K6tMkxiLBGC/QswA0/Ewm4BFP9UcbYSG+fwwwFjN+4k760STLXWxgUqFxy/9MMA2VBymLcFyHhGyhOsnJbMWWZzJM0SmCLNVCxDNgfPPZfAKx9EX6AsEEnXvHRATausbNRSG0s1BE+TcHW+Wc+wNcRdm6sUtZ04djBP1qVCMYExr4Ld11nhNC7F4EqMytwxOwO3s71I0TaiAHi7r9dwDwEy4H1weINJZVeZQtctlD1G45S3ezXj3bOsbQTd70nFY+WN7wM66EWH93GDQOFs7wajj/5C67DjIdLpqB/k9hM9x976Crr3Dnbftdee99BE9R77B8YnP90ICwYvYMMUKO8769In/8RYztcRs8HVS39S98obTHv2kJEI/vk0nN/9JoIz+Df36qNffPrxx97Hehaux0/9yte08QT8s9+6Ajg9MhCwddg54PFEocDK0a+BnSgHBKnXwM7wLwQBjEr1dtA9jsFucrvLQwIAADs=',
            }}
            style={styles.figure}
          />
        )

      case 'blackHorseRight':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhgQB6AMIBADMzMwAAAP///5mZmczMzGZmZgAAAAAAACH5BAEKAAcALAAAAACBAHoAAAP+eLrc/hDASau9OOutgN+exI1kaTLhh6Xi6b4wyl5sG984WFe1nf/AR4/S8wWPwGKkaEQ6YUwHU/WsQpWNadPK1Whl0654pBWVqeM078xWu4ns83sujZfp+IO9nX/v431pf3ZLaIEvg38LUYcuiY9hjSWQlFiSOpWDAZGXNJl/AZubjJ1wn3sBAwIAo5aldaeoBQICBa1Dr1mxmgC0tpy5qKHDt5ChBAIDoa6vbMQABQUD06fHycshw7kdZcsDyLS0BKzVAcgEy6HSt51nm6ri4bbFlaGq6O+05CGX3bMCBOYh27eLVSqA/8YVk9StV610vZQVTHHQF7YZh7SE0nf+KwBAersO4iOVR+OsX9k8opvI4qBEknSmbBRQbNM1lhRdguRXkonNl9kG7gxp7iZMNzJVEWQ1ayXOlkVRMlMj8ySxAP+WPvUwUytGPz4dpoDndSs5jlMFVQ0XTqHZIlg/thq2pYs7aNMKGHzrsymxAm4N2XV3la9GVcoAo+UpxvBEa+EGeB3j+LFDZRe/VqnM0qbTtEc4U6yGeGjdHKK5iqqGTCouJKm5KjVtx+aqoU9is5pdzS+wH7p334510PWOIMEPEnyWqCvuJMl5yx7e3DdoRMmRXSyaGZQqqc+gZ6eZrdfn5h5vDwOMDXUP5ltVzv1O290sifCon+bgk8D++c4RjeJZfc6cI848mpkQ1kdmxfWLbWXxQotkdCU4yXvpRUjcbNYYR4lypjmCYWsEfpjeMMgA9clM3aUgIlQplvjhfZvE+BiNv2GSU4wyGqOdQx6ypt9xZNRgG2Zv/fRPkNWYF2KRFC3Z44f5BfZUURpCmQ1ZUxrj0EP0dNmQUddN0JJfYj5SUUBXFRaSUEetUZ5cjtX4DVt5SQMncQHmaApXexom4CaKsSWOhmoGauGfZ6koqB4GVahamhr1OalgjDpIaRicGOlmZ0J580sGRkoXiy6C6RZXYuCcZ8Gk6gyZiReqGhrQUmsQ+s2diCpCa2xxsSkppjJUxBaTg/D+p6qTzy1B6F7+beqijsCaSqQQsA5LiZbAWnqdTJVcGBwrtLTIGCwTKTguUw/FyU1BLyYnn5+Q7oLduiC6C2+842qq7ykxrJsSg/+GG7DAgMo6LbqQHIwwu8iaua3DCG/038LYJoLDw0HRtJOce2zMMVdWRTqKJ4TcMPKcIwEmEamAqLxywvmRCfO71947s7EDIIgxzD/rvLNV2u6n1sxceZtzTEhTVC69Rzc9XZZ4SH1mu2VyYXVLSi/a2NY5EfwaVWC3pF2zlJXdkrVe56b21RF//TbXZC7txNwY1t22eHiHfXHQyPX93o/uiiz44OSpBrh7h7+nSmEn3904XPds3WmR0fxOHqWtFJ4rs+ZwBfgp5sqCDpdHji6urumni2336qzD5frepccue+JZA207XITnjvLuvHtcuO7AI24usb8W77jwvjOq/NrMj13786VG//oK1MPFtuqvZh86ouJ67+kX3Iofcvnmx5EAADs=',
            }}
            style={styles.figure}
          />
        )

      case 'blackKing':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhhgB5AMIAAAAAAP///8zMzJmZmTMzM2ZmZgAAAAAAACH5BAEKAAcALAAAAACGAHkAAAP+eLrc/jDKSau9OOv9gP8AJ45kiYFoaK5se6aoK88znNJ4Ptq37v8TXgxILCqEIKPyh/wsn7imB0o9JkVS0rB64WGR3x6XAuYIw7Ax+Yy+bprqSLatLccdc7Nbb78v8m9bgX1+B4AaYoNshVaEGYmIjoWSL3uRi4yNNnWWl2mZDV47kIqdoJpTnIKlqTqkpaqmla2jnaK1tKy5j6u6Kqivs7vCTm2/fJ+GlBbBzMmwuJuHvL3Oz9TFxjfTxMfd2djD30ncXc1Bt92xUpva3tbX8OC+V3DR4ujt3+s9y+bnEDDJm+dJn0Bf4QDi0ecu18GEBCX468CQ3jtg+AZGlDP+MVRFiBn/VPsXj+PDgOkKXpQ4ssJJii8XliQZEqasNR9NptSpkGdNmS1Z7rQ5lGhQoTfzJfV5FGPPjkZ/Rl2pdCYDdjhzVl2KlCtQqyLtMW36daNGqWGLpo2pjG1Zsy7VTl2KtSvYt2jHohU791y5viXcrtXali9esoXvxpV71XDjuofJQl1M+DElduL+emRMUzHkzdw+682btXLih5gviu5LeitYzJFLrgbNeRxd0anfwR4NF5nc3YMNA2fdurTa4af5pubd23fR5cH7QI/d3PnQ6cnt5CZe3SKp7U4Xgbc82fpH8LmdpKdd3vuq9PDjU/fakGH8+9izmzYxHr/+f+X51YDefwQmM54rBSao4GwCLujgg/QFBuGECxZB4YUEWojhhvApweGHyDEB4oiCuUDiiT01iOKJT6yIIhUukghjjCDOSOOGXNyIYxU6XjhGjxSq4SABBRQwwJEDCKCkAAEsieQARRZAwINC4ldkkgFkqeWWXHbpZZNQTonfHbkRyWSXAhwpJQFiIsEmkUeeyWWY68UhhZFyZknng2wWkCeYbZaoIQx+bplmoB/iueUAiCI26AeFZimAlD0SMMCiBaRoBAiXSpopkChYumWgmXyQ5KcLWjrAkEk6uimFomq5apClTvinrBOCglkBejZqQ6SGoupmp8IK6qEUt87+2gQBZwrgKwzJapajELx6+eyv1xL6ZbZU/ShEp4tyGK2xxw7LJLcL8joput1OC+p9pyTYJ5JLoqkkkpRmqCt8897qpZJfcplmvgdOgpml/g7MZmr9oglliGQiYWSXe6aqKKbtLQFDrFoeOqKZhjKqGI+QgtskwTECG4DI3UEBALOLsutBvwAHLHCaFQ87anEWEnCyFHD6a6iTcdYbsMLmtrkv0FgKHKbMG18crMxL24BwyFDfd3XHxWpabqgme3zi1j+P3CIK1fYKJLCTuvoqAMCy/K4HcYu5b7Ndz22qnjyLSKTeQLf8NeAB2kl4nVUfXpvhirvth+KnqHRj5BISrki5ij5eLqKCmnsLceegU54AADs=',
            }}
            style={styles.figure}
          />
        )

      case 'blackPhalanx':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhTwB4AIAAAAAAAAAAACH5BAEKAAEALAAAAABPAHgAAAL+jI+py+0Po2Sg2gum3ht7z4Xi8ZXgiELmeqYuwsbXS8t2Raf3nov73+v8gMHI8FhUHYlJynLYXDyR0cSUWjVcodnAFhv9cqtiZrh8y6J55HX67Ja147E5fWW/l/J6TLe/pwbYAjdo0eVliIOouPjXiKhlGCk5SFmpd0mSqbkZ1wnzCRqKNiolZup0lYp5x9hI+ALLUjNbh2JrM5L7FsJ76/NrIivs1yP82sfqObasyubcABatME1NCn1t1azN3NvtrQuO/T1u3X2unX69Tt0e/e4cvzzPWp96b5o/ug/ar7lkXDhxAp8ITPSPksGCARkmjLTQXENwUxxOVFeRYkZSdBsxRmS3imNIkCPdbfF40uQXkinllXJZBt5Le27wcYI4qxCvY8Vm6Oj5IRjQYROGyjFilOCzpMCqMc028CktclKVVh1zlUpWKFu5dv168yCHAgA7',
            }}
            style={styles.figure}
          />
        )

      case 'blackQueen':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlheQB1AMIAAAAAAP///zMzM2ZmZpmZmczMzAAAAAAAACH5BAEKAAcALAAAAAB5AHUAAAP+eLrc/jCCSau9eMbNu/+gk41kFZ5oqk5D4L5wLMeaat/4MhHu4P/AoLDgEgByyCRoVyAUShlBoGVUWq8igBNANEIpvAEgUMWarcwd+atdj8vnOC7NmkK7lLV8b6PXxSMuFnp8hSF+E1IEGYKDcIaQG4iJAU+Dlo5HkZsQk3mYioyPnKQHnnkBAKGimqWlpxREdoGjrpGwdakkhLacuDwCwLStvbdamBZEFC2AF7zFkKeNywGLzrXQe56VGKsVz9l8iFLIFuSZ4dHHFN6BuhPg6XF0zGzT8fJmafVsXLr4+a4wodIPDBmAAZWosSOgocOHEBsuxJZQIYAWMzJq1FX+cV6iiBK7gaTQ8cyXAQRSEmg2oqS+ETxcFJgpq1pLlwIxYGRZYQARaxZw5kw2i8S5oEItVlDWj5uJpEkstCgIjyVUpWOA9ptK8iqSb1TzeCFWsd8hVe+ozjr7ZWhYD2jDViUrQS5dFHaR1nWjtkbdvF3xAr7Q4MLMsDwIMxismC1jvaYqSBn7ZTLkxxmWYM6swyBlozafRt6MAS7pm6MvhibBQ+vi05z/wi6tQLILAp9VxaTceXbsLL5jS60ZowDP3sEbF05OovYFAUByt2KO+jV14QWRX4ecervi7M69K+8u/ikb7eUDk09fAwp69tPh024eXn5g+/Npr7dfH7/+3/z+mReggAQOqIGBSBWI4H4BhtefgQz659yDECKonIVBYaiXhiRx2JWHB4J4hIgRighhiSZKiGKK/K3IInwUvqiiizKKZ12NDb6HI3vL7YgfcD7C2GOQ6XVCZJEPHFmeJEpux2STzHUAZZQcTBncB9tBh1JKNM2kUZcq+SDdbI49Bh2XG6Wp5gtNrDQmYGXKhRJxxaUkpkNsQLQlnTA0McCb550Q1pwy+Plnlj44UehKb6VQmaJ9ujngmXQ2Aah6gukU0wuSinhmDIxW52hPxBl3aV4YaXWaT33ydFemY9zmKmmswoBbcMG8wN0N7JwqmVybyiCXr+zsOkdYstz+WpAApc5qVK3EiuYWFFLI4OwIzBaV5wyqliAHG3yudh1GMvgqTgnB0BktaZWeashWTYQF0rqkKuueOmbOGe5GftJLnzHyEpoRTSpx6eWXncrlSz/Q8dnmoVQ1JHCk675iFKRsQgzbp5Fe69fCF6BUnMbbidzqb5tIFaypAZos03EWZ8upxyIl6kSXlYC5EsmP9umFLbFWQzM7E6/Jb8LoxmQN0CGVUDSbdv45pkOJ7huqWa5QG6xM9jJGqQxX/wuypqAOjVm6FIsKsGTBhp2eyz3oN3aunPqbXMMZS5uyKjUZJyK5lYjhSrVxv0i3HaT447ePKFEkjt0a9qJkOD4aJsQiTh56RSN1mifJY+emXQl6H4ONbvoVCQAAOw==',
            }}
            style={styles.figure}
          />
        )

      case 'blackTower':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhYgB/AMIAAAAAAP///2ZmZjMzM5mZmczMzAAAAAAAACH5BAEKAAcALAAAAABiAH8AAAP+eKrQ/tCtSWe8uGqG+z5d+GlhOVJlVqXqubCtC0fr/LiWfeOg3tQ+HscHEBJ/uaDxuCSinE0l7lhM6oQ96JRptWGp0Wt39uVutUMxD7w2p9FAKvIjr77q8zc+n60/94CBLH+ChYYSY4eKeISLjnKNj5JqepOWKZGXmjF9m540iZ+ecQGlpqeoqaqrrK2ur6uIdw0CBLa3uLm6u7y9vr/AugJ8s6KjdMabMsmWbcyOZc+HWJXSftTV1nDU2ozYmd0w3yQNsObn6KgFO+N/tQLw8fLz9PX29/jzBAOy7aHhHvyBA8hJIEEyAv8dhJBQ4cJ+CR9iaphNIjF/FkVQ7JT+kV3DjgUxggRFcSTJjyY9RkwJ0SDLi+1ewhwn0w7Klxs5jsxZk6dMnzg39hT6k2jQkkWRHr3JEmhTo0+VRmWa0mlVqFelZqVq0mpXrF+1huW6E2xZsWfJgvSaduVSt1PhbpU7lm5bl2/xxtU7l29dv3dF5gXc0eeAdIgTsxo285uDYJAjS87FryXNmo2dYbaJbTNDx54/RwtteQTpC2FOlyY0oLXr17Bjy55Nu7bt2yrJAVDMuze6dauHDMhHvLjx48UrZ1atERlz1KafQ3cuPfdA5ieqn9StfXn34A9uix9Pvnxt650E+F7PfpXyfheQy59P/977Hd8n5se030QbfxH/eRBgBgOiViANBzKUoCwL2pRgThBGiEMCADs=',
            }}
            style={styles.figure}
          />
        )

      case 'whiteBishop':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,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',
            }}
            style={styles.figure}
          />
        )

      case 'whiteHorseLeft':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhggB7AMIBAP///wAAADMzM2ZmZszMzJmZmQAAAAAAACH5BAEKAAcALAAAAACCAHsAAAP+eLrc/jDKSau9OOtNhcfex41kuQlBKlzqar5wvAQCoVYoUdBy72eoAsDmkqAGgF3xx2w2coAkL4ISRInObBYVjSqpAUI3pS3/aN3oYPoMCLsosxx2TEerbWs6Pu+PgnZ3bAcpgWt+iBpcgVE3B1B2X4mTFGiMQy0hAgMDb1iUoA91l5gppqcBAwR8oa0KkKQ6BLNDOms0rK6hi6S9Q7dLuokeqb7GUoPCMppgbsfHNsnKJiioS9Wqz8/RwdN/KbMF1SoqYtra3N4kxEiRA9Vv5+fp6oop8Yy08vsAePUX1czxG9jL378JVUi1I0jQ4EFRxfKBY8jQ4cNXowJFE0j+caCji6+cMVLSseMnkI/CjLRU8spASQeJZeyyZmFLAMA2FeDYa003ZeNM4at5MxIqGvhIkakXkCYNMWuSFlXjTNxTXzCBTkzDTeRUO2u43vOVS1dTRjO/jrEpiKfRn5TOBtrBVm0jqQBYSoQ7DJbRunbzAt7hNs1SV4BWAg4cllHES4d3ebVDJPAlG4AbSwyA+DFlvZbBqjQaK3LcAEpRhyaVGI6ezZ3x+l1tKAWnW4XHcI477rVTvLS53rraU9qcKpuOmNsBPDjBk35a47RN1/lXi2bSelFh/Sv07KDTrMndvaJxJ7O7MC/v/TwT6WIXs6foE7z8QkUJyF/tvgf+fkbjTUXYfPVtMVka6wmo2nym+aDdGL7dtMN82/H1QnpUkaeNVBNS2M9u73mm3oH8DIjgaPN9FwMxKELYkog2aEgbdtRYI1CAJfFyBYndqVjCETsh40Z1LWFmh4jsFQhDeKtwVxSOd0QYmA3ANfgNcAkW9d90zm15ooUAhedie69RGZyRaIG4TovisXlTNGs5l6VYYHaAZJxTTqQZbVGlWacRC9a2WjRC8MgYkj5a8CAmzU3lk458hqckEIHaAWloO4xlXaY8WWnnYmZ2J9eZW1Voj0KVvpmUDtVUw16pH/7JwKU77sfQcEepMg55+kylV6JgZJZqfgXcVkCQgmD+w1OTsJYUKlWyYsQmmuzFwSIu75gyao6+AftEUALEs2d5rFzbQkhS0lfppMHuZBVSdzpXFqC2ytNhF96GtOq7MoY2L70SpnrIBF7uka51/wJaQ0k1edCJFBYu+iyBairaLD+tuppXxG5S5SFVJ2jaUGEJKyBmI/WulhVAVfS7z8AQYdlxdyuDIHJLMDtAayMH99hfBwn14rJTEZw8sYclhznzuGRVvAB8Tn3c5oU3G5ZyI06HpNTVtNV8AoYm+pKo0Yayl6/SJA8bCI1Qeyz1HllzoPFnPZsKUW4nU+i13GLOSXewEjXKYLQ43IkhPRBod+/bThFuZ2EFA4NQWh7+MB7Iz5S6SYQ5TYqQeKsqZFP2x+z+SBy+pmSLOZBDvHux5Z5+41XnGduJV5OW79UDi729EmZuledem+OFf5RBwWMI/jaNoJA9tIeIt9K2FMKX5rlkwNctvBLEM4E8ytX3wn0rZCu/PS6hxBt2+JeMP8miTLM/l/F9TB+8/ELTLweG/WiP/xDMy8L3BPO/Y5ROC/e7nPkKKLn9iSlGBXxGprr3DSmtL4JCC+APqtAJWiwOg8Z4FAKRcxT/gfBEmFvHTHRAkhOiQ4OmwxvXXJgs76mNgDQ8xwFNMMDR5XAl13tB3nz4w/kFsQTlK6K90LckUM1MidajoAPiBUEonmNcbxqg4hOt2L4UVmIxF+RiCL0oAfVtUYyOiVuYZPY8NEJsTcDRjxvlkTTbzbFIZNQZDW7DR05soo+ADKQgB0nIQhrykIbM47eOwshGOvKRkIykJCdJyRCg5JIlSAAAOw==',
            }}
            style={styles.figure}
          />
        )

      case 'whiteHorseRight':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhggB7AMIBAP///wAAADMzM2ZmZszMzJmZmQAAAAAAACH5BAEKAAcALAAAAACCAHsAAAP+eLrc/jDKSau9OFPBRe5aKI6k0wWeJQRo6b4whAJrOq1F0cZ8L86EnWQ1AACEvqQyEigCdLZHzUgLLK9YBY5ag0ypA2t27FsRqMfo4kuFkt8wM9rNWAXO6KAazs+wAICBYVFygYErfYkaM4aAIAdbjYBhipUWTYAEAwMnJwWSgXSWoyYBBQR2LKqqTqAAeqSxdRwsAqd4BLmfrodisrG0Ani8xACDv8CYxctBSMh9RMvSrzV7Wo/PPJHT0jooNrSr1tki29zSmrWpAgO5g+PkKubn06i1p43e8PFD8/Tcu1zZ28fPhL9/CF0dK7jhYMJzORR+YzjE1MOLVQLmq0X+UYpFjBfDtGrUjGC2aCAxihTIoeMaRv9ypQwFsxEilwf+TCuwyY6wmTQFSGo2kaFDQ+lWKQMaqBnSWqpMjqopsUkuFMOYNtU5aNhCckcdfZwUQCsoPf66kKMqqdBWjWYzschqSC0ylK50wAU0Nu5Woa7sygrL9tUdv0MLi5X65mgQumQRg9Ix0qYzS0fDnF0q2RBlgRxlcW6kWZLOzpL0gmY8ZrTnw1tho5YUZq/YwX3bNuk5dzYvt4YuKzrNK8w938WIk1WH2TXyi3poNgnHuozs5ymDDNA3rGQivNhnemuXuHoM4OFTrigu/Ar49DMVVzFfQjn87M75+soSVnL+RKa15dWeD/Khtp5WB4Ly1RL9ScZJXPIJZh1g8JWmlWqb0YcBethxkBpk/ySoG4P5IedhIwVy4xwsSnCI3WhB2PYPhoa8k8R76eVmIUgJJhWVhhLYF95jT1UGnVV2kEeAKC84lBtiOlimlXFPLkgCG6Rd52BZgmiZUoT7XemlYUYitlSAZukA4hMDXoCjYRSiRqQxJfLIJSgSasBhM2vGdWCDR8rIYjmu8YlcjM3ICOCdtLU5AVtQYCcSVr7lN+gHOtYZF1FlIrZjlvRhmVF4NShqZqeXqnAdoFOicA9dS/r1aY2ONgAejUDJxB4OBaSiFKNMaSdRdcppilAqcC3+qY5sS26yXZ8pzQrnhn2pieA3tXASTgsuziasZcQCK+1FovhaFCRj+mYhT0pJ9d64CTF5Q7re7saKO3mWQlucGEHBWm/3JQkZCxRgogkHnAD7kI1u0jubtQq2ucU7dkA7Tb6PKhyepW0CjNR20GGc8X1d/hZmA0KCZByQKdYro7wMpPzQQEDm1GmH/AZ38gIynwWtPmKaihzEjUbQLZ4aL1azFg4/lx/MTAv9VmC1ViAiyXTyQrAMN6OY82IwtHxoupR40TSdIIqMqdROdwo1ul+/ZpuVYlosadJH7Mx014W9/UPc9xFtWUWdXi3X0qWw/WKZfjP9E622qb0I4CT+G96M1SwEtJJuiNv6JNaACO6d1TUk7Brd9VGOtUW9QhXaBj8uNVAPrKbnq5IJswbOslVT2zXotYHYu0HMadMz6GyaDNbZWMco0UmfI4+i28OP8ab0Umb4y/XYv6Z8Mr93b9iaZY/CvfjBUd95Ceejf0jcjfNnrPtZa/9d+/SHjvfWfNihOP2Cq4ve3OOx/BXDeRHrn9gMGIjooe5G+GNg+iZzLgJGT4KByRnQ5Pc4DE5DM7poXUuwQIvweXAjv/KJBf93Qv09axgibFEBW4iOdN2EdpSi4TkQWDQcqk6HrnDgAAllQiCaRkbla9L8jGga9cVhiUycnoDWF8EoNnFcNS4QlRWnwbHOGW6L0jhRYoaIORaC0RFxu9wItHjGZShGjYSyWxvzISj+6QmKc5RG9TzHDmf58Y+ADKQgB0nIQhrykIh8IOl+xchGOvKRkIykJCdJyRHi5JIHSAAAOw==',
            }}
            style={styles.figure}
          />
        )

      case 'whiteKing':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,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',
            }}
            style={styles.figure}
          />
        )

      case 'whitePhalanx':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhUAB4AMIBAP///wAAAJmZmczMzGZmZjMzMwAAAAAAACH5BAEKAAcALAAAAABQAHgAAAP+eLrc/jDIOaG9OOtGu99gKHYFIQzoIAhE0YlwzEyFANx4fquuJP8b2kBHJA56AaDyMbEVnzpBZUmVFKBY3WBK/UkI2XCu15V9xegbuRyypt9cNmbyfm+T8oxkWE9L8XkRAVd9cD6BTAF8hWh3iA5njG8ujxyKkm9/lQsSmHaHm4Oek4CPEk6jYgSgiHupaJqVrq9hsaYBtGKOsri5Wbu3vr+sgZ3CUMCtl8dFtsqozDmrpcUBYNE6lJsHxtg4xMqL2M63197a29y92Mmh1ufgvOK+7dt0zHHp6ua5a/oz73JN+5cImqeBBBPxk+QvIaRB8z7Fc8gpUp1p1Ciq87D+MAySF/88eCgQMYuAjyIzdhFZYkVJRipYoJwYg0LLl8dUtKCwpIk3XX9UgrD4Ew3CmgEMFs1yFGmNpSbzIbVyAuqOkzxXcnSZC8UKjFnzpKRR4mKBmSD1jcVJJOgHjQX90IRrSSkUcnQF2X3SNK/eNH39PtxbJLBggISJrDp8gShToYz3pUEXGVJHKJQrz7gMoLPnzpk1Kwj4ufTn0KJJmzaNWrPq1achM3YMG7Tsw7Rrt46cG/bu2a9rA1gsGrHw0sSLj056/LNh3sybd34OPHFpvJVnSccOne31uYK1N6+XfZ108tClfwbvV5T6zuzzun8fn27w47/b3xeePHXg9PfU6eedadyFZ5566Bn43nq32UfIggDU51Bv+DWo0SkQdlagfQe+lyCHGXomYUj7SZcfRRiGCMCGKHa44IcoPqjiiPb8p2KACXWjIgAwksgZhCeqtcyOGtJYjYszGllFB9Yt6JaSI3RgwoAQ6vQWGyQ0SeRnPKQFhE1abglbl1INNQEBVIo53kcwnJmmmghiZCZEcNbJJRJ6pGjnnkXONcGbfGZ4h1BuBGqoiODcc+ii+ei4qKHJ6PnoobY4Oqmhh0h6qaEDibdpoI6MJeqopJZqqqgbnarqqqyiqhwQCQAAOw==',
            }}
            style={styles.figure}
          />
        )

      case 'whiteTower':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhYgB/AMIBAP///wAAADMzM8zMzGZmZpmZmQAAAAAAACH5BAEKAAcALAAAAABiAH8AAAP+eHrS8TDGtqpdTmotrleNsHGUJ45j+Vknmq5X5kodGwhDru98ccOWG284JASAFVGByBTVMIEBYEqtWgc/pOJm7XaNWlCg4C1jn9to2XsOH7hrLzisjHcfQbWd2g7D91RzWnWAU3gVD1KFfVp/hYJIhIWHC4mFAIxIjoCQQJKAlGmKgJlAm3udMJ97oW96pFmNApdTqSurdq2Wi7Gas7RGaKpjtLqve1gPKjEnv5dGN8I2D2SXxqOABdDKaC0CBNikBd7dEQTV1keIx5faE+bhtFMDBN7m6PLX8lbuD+f7duhB+AeQir6CVeIhNLOwysGGECNOUleJncSLGA1RFJX+sWPGhx5DLjQmsuTIjQyiMFnJsqXLlzBbipg2o6bNmzhzvkgSooXOn0CDkgjBjJjJowGJmsCFtGkyaTyNNp3qo9cHB/imlvSxzJNUrSG5Qh1GAGzYaG6SBChrFiPXtDHWtpUYDK6JtTHz6t0rcKxdn0IDB/Zrl0HPw4gTK17MuPHiwivkzi1oC/IWtpP3VbYsObO8zZA7e36G0nIlzKMflTb9BnVqVKtNi35tB3Th2bTX2LaLO7ec2Jxd+/7N+kLv4VV2wz2OvBbw0MKbB3p+O7p0AMrTMm+e3c125N39WJcevtF47tR5nweffvn64eU1vfcd39T83PVhfIffXvv+fdr5RfbfawF+sB99/Xk3YGoFenAgfgmKdx1xxSGy4GgNGnehZxkGsWFmHVo44RcRmjeiFSGedmJyJcq34nQVivgidi3aNyONMao4Y4qX3chjaz7WqN+Hk/34IIBCChhkjj3umKSBRM5lZJRtTbkkk0cS+KSDVJplpZNMAgkmll2C9eWLZ65oJV9stqkDjjnKINicOnVlmhN05nmTEzEyNeJbrIlQ5lyAQibojSQSNowziLKo6F2MNloFn26coJCkAFAaSQOYxqHpLYK6KeqoLInlCWB6pjqnok445uqrsMbqKnWndEphZJHaequBueqKIq29+gqjfsEKCyeuxpZwYVutyS5brLCgOUHqtNTy8CkUqmarrQpO1CPrt+CG+2oWhyZbyFsimFvMEemqW8hM7bq7B7wByAsIvfbOy269+Xq6b7/+pgTwGvRe2m8bJ5xTwMIMN+zwwxBHLPHEFFdMMaVyaqsxncKI6/HHIKORAAA7',
            }}
            style={styles.figure}
          />
        )

      case 'whiteQueen':
        return (
          <Image
            source={{
              uri: 'data:image/gif;base64,R0lGODlhfAB3AMIBAP///wAAADMzM5mZmczMzGZmZgAAAAAAACH5BAEKAAcALAAAAAB8AHcAAAP+eLrc/jAeQau9OIcqu/9gKE5VYJ5oqp7W6L6waw1Ebd94Tgxt7P9AkkkAKBqPyCRAsKEEn1DQhjAkKK/GQZUZ7XobGwDVZMUmtWHA5svupgnMwMB8RBOL67YemC7G53QFJgVHeXuHL31FgnJmjISFAoiTI4qLg1d/SYaUnRKWlwGQR5qbkp6oEKBFdkZwZFecqbMHq6xDYlVYsrSotkVjcQJlsae9s79GFMl4xse+d1hoU3S8z5PJj4yAxdepv4+ho6be0Jkm3ADhStblequldZjk7pSWrwHESK1I7fVfioLpSyIw0j9s0fjRGZPPiL+DUdIopCMmTpmHEJ+EWUf+kRQ6NQEy7tnAsaNHOVxEtonTyKQSRhhV+rBQoKbNmzhz2uwh0wvLFUCDDnHWEwqFAUiTDihQQkUFpUgFES0aBBSPITWTMj0xrhlVN9H86FJCACYxKlO/+lAUDws+YjHVhujDaKAZJnfQys3gRASTiy1dftSSVgLfwlGaCuXQAS8Awi6NCCI05MMyoUO7KBaQVWnNn4whMKkpKjKwJg8VkywA9TOKvj9Ysu64gyXsBRa4ms419LaCyyTtkt3aJMYyAekiX22iGnXXjoR/Mr+MXDhFfIgNz9t9pOxQkkitjNk9GthSvMKsK0fvlxr34SySOHaJZuC0Ye+vSM3OYH7+/iv4BMbbc1egMQ52yf13xH4e+KcggMLI4x6AjIQFE4EPZoGRgxnqN9ZjLNDQ3VK6SfZhhy/5s4x6KN7yETAwsZACfsDEgWGLyrTDRII4IoHPgcu9VoA+DPHYoyvWcHhkiqURZIMSdrC4pFQO7LgkRSVRNNGV3fTHDJfqbLcQLmA6womVZZopIIBkpsmmM3+5qaaRp32ZZkoK2JlmXVgoKScSVE7Q5J992sInoQXmgSaiZLWp4ZqMInnKopH6+GKdN0aqaEOVMkmMn52C9BunoSIxX32lyheSoFIyOoYVYqYq1qitMioVI7JusmqcuSJ5Ap2hmjAqsJ1W2Gs/u0L+muulx+olaKahCnKsPMboGWmtkQYq6LTcKoEXbqR2262w4EIrbqfOLmDtuYRqSyu70+JZLry9EvYAE/Tm6i64xOabZroNgOqvnPt62e/ASwJcpQkI27rhoA3/GxevEZf5bYPrVvyevSBQqjGOaPHXH8UJ76AVU4fRxFpSNVgcl5dhKWgyD8BhZrNTFKyMbUcFW5ZxHedhVoFNUBV9MsrSObVyfj13DPFCQa/AWXgto2hDVEljJaJJ0c30tI9RC0nDzmTlV0PYr22dqG8ylLcPcSywRrYZUWa4A9xaE1QcEMtAQqLYOE7Dwtxm3C3dbLyJHMJxP8m90NwMrWDuGVD+x7hBZYkJg7iWXO3s3YwHZxEhdMSxHUTfLmU9OYxDhM6bCqEzuNKXgqOw+oi71V7iXS/HxkzWrncIPO+KP+E23RW2ioPRYz/J+QZqe1i8UcqWTRDWWd+82thOQte7USRXXrPUQ+/UnNSOmxRyKscDiHbcchMuBvaSR5/i9F4wfD3e4FV9pMlJqw47VjULkgVJa/J70N1mNCRJ9cJKf8sbd3SAg/csMG47+J5PUIMVz0UFZdprQlb8pyXQaFAzmquV4ULIwqnVajmmowReWvW+oayMam6ZGc2AIsBAnDAx1RMD/8ATvOtgjYF04lgBv1YW6fQwTe9Dzhl+SD1u1CaObUXsUQQHYUUqGq8hW3yirMLYQHmhYjS2aeC5DrgV/GXONllEF9xieIgS3I5bNKPjHuyYwFJdJTTsE4b9xPW5vT0DOGrsVpD0WEDqJDJVEWTkNYDjwmtFUpL1qFklwbTC3sglYJrUWYdMhjdAfvJe49se1Ui4vKUM0ZSntMz5WPgaWMbSOCnL5S13qYcEAAA7',
            }}
            style={styles.figure}
          />
        )
    }
  }

  return (
    <>
      <View>
        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
          <View></View>
          <View style={{ width: '80%', flexDirection: 'row' }}>
            {figures
              .filter(figure => figure.color === chcolor && figure.vertical === '0')
              .map((figure, index) => (
                <TouchableOpacity
                  onPress={() => {
                    setMove({ ...figure })
                  }}
                  style={styles.sizedSides}
                  key={index}
                >
                  {getFigure(getClass(figure))}
                </TouchableOpacity>
              ))}
          </View>
          <View></View>
        </View>
        {getLetters()}
        {numRange.map((numIndex, lineIndex) => {
          const chars =
            lineIndex % 2 === 0 ? [styles.gray, styles.lightgray] : [styles.lightgray, styles.gray]
          const charsAvailable =
            lineIndex % 2 === 0
              ? [styles.grayAvailable, styles.lightgrayAvailable]
              : [styles.lightgrayAvailable, styles.grayAvailable]
          return (
            <View style={{ flexDirection: 'row', alignSelf: 'center' }} key={lineIndex}>
              <View
                style={styles.sizedHeight}
              >
                <Text style={{ marginVertical: 'auto', marginHorizontal: 5 }}>{numIndex}</Text>
              </View>
              {charRange.map((char, index) => {
                const actualFigure = getFigure(getClass(findFigure(char, numIndex.toString())))
                const actualAvailable = findAvailable({
                  horizontal: char,
                  vertical: numIndex.toString(),
                })
                return actualFigure || actualAvailable ? (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      if (
                        move &&
                        ((move.horizontal === char && move.vertical === numIndex.toString()) ||
                          findAvailable({ horizontal: char, vertical: numIndex.toString() }))
                      ) {
                        setAvailable([])
                        const found = findFigure(char, numIndex.toString())
                        if (found && found.color === move.color) {
                          if (
                            move.figure === figure.King &&
                            found.figure === figure.Tower &&
                            !kingMoved[color[playing] as keyof typeof kingMoved] &&
                            (smallCastle[color[playing] as keyof typeof color] !== 0 ||
                              bigCastle[color[playing] as keyof typeof color] !== 0)
                          ) {
                            if (found.horizontal === 'H') {
                              moveFig([
                                { horizontal: 'G', vertical: move.vertical },
                                { horizontal: 'F', vertical: found.vertical, fig: found },
                              ])
                            } else {
                              moveFig([
                                { horizontal: 'B', vertical: move.vertical },
                                { horizontal: 'C', vertical: found.vertical, fig: found },
                              ])
                            }
                            return
                          }
                          setMove(undefined)
                          return
                        }
                        moveFig([{ horizontal: char, vertical: numIndex.toString() }])
                      } else {
                        const found = findFigure(char, numIndex.toString())
                        getFigure(getClass(found))
                        if (found && found.color === playing) {
                          applyRules(found)
                          setMove(found)
                        }
                      }
                    }}
                    style={
                      actualAvailable
                        ? index % 2 === 0
                          ? charsAvailable[0]
                          : charsAvailable[1]
                        : index % 2 === 0
                        ? chars[0]
                        : chars[1]
                    }
                  >
                    {actualFigure}
                  </TouchableOpacity>
                ) : (
                  <View key={index} style={index % 2 === 0 ? chars[0] : chars[1]} />
                )
              })}
              <View
                style={styles.sizedHeight}
              >
                <Text style={{ marginVertical: 'auto', marginHorizontal: 5 }}>{numIndex}</Text>
              </View>
            </View>
          )
        })}
        {getLetters()}
        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
          <View></View>
          <View style={{ width: '80%', flexDirection: 'row' }}>
          {figures
              .filter(figure => figure.color === opositeChcolor(chcolor) && figure.vertical === '0')
              .map((figure, index) => (
                <TouchableOpacity
                  onPress={() => {
                    setMove({ ...figure })
                  }}
                  style={styles.sizedSides}
                  key={index}
                >
                  {getFigure(getClass(figure))}
                </TouchableOpacity>
              ))}
          </View>
          <View></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignSelf: 'center', margin: 3 }}>
        <View style={{ flexDirection: 'row', alignSelf: 'center', margin: 3 }}>
          <Button
            onPress={() => {
              clearTable()
              getReady()
              getFigures()
            }}
            title='nová hra'
          />
        </View>
        <View style={{ flexDirection: 'row', alignSelf: 'center', margin: 3 }}>
          <Button
            onPress={() => {
              navigation.navigate('ChessLogin')
            }}
            title='Opustit'
          />
        </View>
        {Object.keys(color)
          .filter(clr => clr.length > 2)
          .map((clr, index) => (
            <View style={{ flexDirection: 'row', alignSelf: 'center', margin: 3 }} key={index}>
              <Button
                onPress={e => {
                  changeChcolor(color[clr as keyof typeof color])
                }}
                title={barvy[clr as keyof typeof barvy]}
                color={color[clr as keyof typeof color] === chcolor ? 'gray' : 'lightgray'}
              />
            </View>
          ))}
      </View>
    </>
  )
}

const {width, height} = Dimensions.get('screen')
const size = width >= 800 ? 80 : 40

const styles = StyleSheet.create({
  gray: { backgroundColor: 'gray', width: size, height: size },

  lightgray: { backgroundColor: 'lightgray', width: size, height: size },

  grayAvailable: {
    backgroundColor: 'gray',
    width: size,
    height: size,
    borderWidth: 3,
    borderColor: 'yellow',
  },

  lightgrayAvailable: {
    backgroundColor: 'lightgray',
    width: size,
    height: size,
    borderWidth: 3,
    borderColor: 'yellow',
  },

  sizedWidth: { width: size },

  sizedHeight: {
    height: size,
    alignSelf: 'center',
    flexDirection: 'column',
  },

  sizedSides: { width: size,
                height: size
              },

  figure: { height: size, resizeMode: 'contain' },
})

export default Board
