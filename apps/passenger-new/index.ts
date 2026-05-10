// Side-effect imports — must be first.
//   @expo/metro-runtime: enables Fast Refresh for the web bundle.
//   react-native-gesture-handler: required by RN Gesture Handler.
import '@expo/metro-runtime';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
