import { MessagesContext } from '../contexts/MessagesContext'
import { Text, View } from 'react-native'
import { useContext } from 'react'
import Board from '../components/Board'
import { ScrollView } from 'native-base'
import { color } from '../utils'

type Props = {
  route: {params: {chclr: color}}
}

const Connect = ({route}: Props) => {
  const { chclr } = route.params
  const { messages } = useContext(MessagesContext)

  return (
    <ScrollView style={{paddingTop: 25, backgroundColor: 'white'}}>
      <Board chclr={chclr} />
      <View>
        {messages.map((message, index) => (
          <Text key={index}>{message}</Text>
        ))}
      </View>
    </ScrollView>
  )
}

export default Connect
