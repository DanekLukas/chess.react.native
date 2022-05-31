/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

 import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { color } from './utils';
 
 declare global {
   namespace ReactNavigation {
     interface RootParamList extends RootStackParamList {}
   }
 }
 
 export type RootStackParamList = {
  ChessLogin: undefined;
  Board: {chclr: color};
 }
 
 export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
   RootStackParamList,
   Screen
 >