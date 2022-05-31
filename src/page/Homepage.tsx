import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView
} from 'react-native'
import { ConnectionContext } from '../contexts/ConnectionContext'
import { MessagesContext } from '../contexts/MessagesContext'
import { useContext, useRef, useState, useEffect } from 'react'
import { RootStackScreenProps } from '../types'
import { color } from '../utils'


const Homepage = ({ navigation }: RootStackScreenProps<'Board'>) => {
  const { chooseNickName, createOffer, peers, setRefNavigate } = useContext(ConnectionContext)
  const nameRef = useRef<TextInput>(null)
  const myRef = useRef<string>()
  const [name, setName] = useState('')

  useEffect(() => {
    setRefNavigate((chclr: color) => { navigation.navigate('Board', {chclr: chclr}) })
  },[])
  
  const { messages } = useContext(MessagesContext)

  return (
    <ScrollView style={{paddingTop: 15, backgroundColor: 'white'}}>
      <Text style={{ fontSize: 23, padding: 10, textAlign: 'center' }}>Šachy</Text>
      {!myRef.current && (
        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
          <Text style={styles.name}>Jméno: </Text>
          <TextInput
            ref={nameRef}
            onChangeText={newText => setName(newText)}
            style={styles.input}
          />
          <View style={styles.button}>
            <Button
              onPress={e => {
                e.preventDefault()
                if (name) myRef.current = chooseNickName(name)
                nameRef.current?.clear()
              }}
              title='použít'
            />
          </View>
        </View>
      )}
      {peers &&
        peers.map((peer, index) => (
          <View key={index}>
            {peer === name ? (
              <Text style={{ textAlign: 'center' }}>{name}</Text>
            ) : (
              <View style={styles.nameButton}>
              <Button
                onPress={() => {
                  if (myRef.current && myRef.current !== peer) {
                    createOffer(peer, myRef.current)
                  }
                  }}
                title={peer}
              />
              </View>
            )}
          </View>
        ))}
      <View>
        {messages.map((message, index) => (
          <Text key={index}>{message}</Text>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  name: { margin: 'auto', textAlignVertical: 'center' },
  input: { paddingLeft: 5, marginRight: 5, width: 150 },
  button: {},
  nameButton: { width: '100%', padding: 2, display: 'flex', alignItems: 'center' },
})

export default Homepage
