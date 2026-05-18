import '@expo/metro-runtime';
import 'react-native-gesture-handler';
// Side-effect import: registers the TaskManager background-location task
// before the app mounts. Must run at module load so the native side has the
// task registered when the OS calls back after a cold-launch.
import './src/services/locationTask';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
