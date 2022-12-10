import { StyleSheet, Button, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_TASK = 'background-fetch';
const CLIENT = {};

// Start Receiving Location
const startReceivingLocation = async () => {
  // Check Permission
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === 'granted') {
      //Receiving Location Updates
      console.log('Start Receiving Location');

      // Background
      await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
        accuracy: Location.Accuracy.Balanced, // Accurate to within one hundred meters.
        deferredUpdatesInterval: 10 * 1000, // 1 minute
      });

      // Foreground
      CLIENT.location = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Accurate to within one hundred meters.
        timeInterval: 300, // 300 milliseconds
        distanceInterval: 100, // 100 meters
      }, (loc) => {
        console.log('Change Location');
        console.log(loc);
      });
    }
  }
};

// Stop Receiving Location
const stopReceivingLocation = async () => {
  console.log('Stop Receiving Location');

  // Background
  await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);

  // Foreground
  await CLIENT.location.remove();
}

// Background Task
TaskManager.defineTask(BACKGROUND_TASK, ({ data: { locations }, error }) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log('locations: ', locations);
 });

const App = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  // Mounted
  useEffect(() => {
    checkStatusAsync();
  }, []);

  // Check Task
  const checkStatusAsync = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    setIsRegistered(isRegistered);
  };

  // Button Event
  const toggleFetchTask = async () => {
    if (isRegistered) {
      await stopReceivingLocation();
    } else {
      await startReceivingLocation();
    }

    checkStatusAsync();
  };

  return (
    <View style={styles.container}>
      <Text>Background Task Is Registered? : {isRegistered.toString()}</Text>
      <View style={styles.buttonContainer}>
        <Button          
          title={isRegistered ? 'Stop Receiving Location' : 'Start Receiving Location'}
          onPress={toggleFetchTask}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    margin: 10,
  },
});

export default App;