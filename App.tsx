import ConnectionProvider from './src/contexts/ConnectionProvider'
import DbProvider from './src/contexts/DbProvider'
import MessagesProvider from './src/contexts/MessagesProvider'
import useCachedResources from './src/hooks/useCachedResources';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import Board from './src/page/Connect'
import Homepage from './src/page/Homepage'
import { Platform } from 'react-native';
import { NativeBaseProvider } from 'native-base'
import LinkingConfiguration from './src/LinkingConfiguration';
import { RootStackParamList } from './src/types'
import { StatusBar } from 'expo-status-bar';

const App = () => {
  const isLoadingComplete = useCachedResources()
  if (!isLoadingComplete) return null
  const Stack = createNativeStackNavigator<RootStackParamList>()
  return (
    <MessagesProvider>
    <DbProvider>
      <ConnectionProvider>
        <NativeBaseProvider>
      <NavigationContainer linking={LinkingConfiguration}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ChessLogin" component={Homepage} />
      <Stack.Screen name="Board" component={Board} />
    </Stack.Navigator>
    </NavigationContainer>
    </NativeBaseProvider>
    </ConnectionProvider>
        </DbProvider>
      </MessagesProvider>
  )
}

export default App
