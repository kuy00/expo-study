import { Button, StyleSheet, Text, View } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventEmitter } from 'fbemitter';

const BACKGROUND_TASK = 'background-fetch';
const STORAGE_KEY = 'background-minute';
const emitter = new EventEmitter();

const App = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState(null);
  const [minute, setMinute] = useState(0);

  // Mounted
  useEffect(() => {
    checkStatusAsync();
  }, []);

  // Check Task
  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  // Button Event
  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  // Event Listener
  emitter.addListener('changeMinute', (minute) => {
    setMinute(minute);
  });

  return (
    <View style={styles.container}>
      <Text>Minute: {minute}</Text>
      <Text>Background Task Status : {BackgroundFetch.BackgroundFetchStatus[status]}</Text>
      <Text>Background Task Is Registered? : {isRegistered.toString()}</Text>
      <Button
        title={isRegistered ? 'Unregister' : 'Register'}
        onPress={toggleFetchTask}
      />
    </View>
  );
}

// Get AsyncStorage data
const getMinute = async () => {
  try {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    return item ? item : 0;
  } catch (e) {
    return 0;
  }
};

// Background Task
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  console.log('Background Task');

  try {
    minute = await getMinute();
    minute = Number.parseInt(minute) + 1;

    // Change Minute
    await AsyncStorage.setItem(STORAGE_KEY, minute.toString());
    emitter.emit('changeMinute', minute);

    return minute ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.log('Error: ' + error);
    return BackgroundFetch.Result.Failed;
  }
});

// Register Background Task
const registerBackgroundFetchAsync = async () => {
  console.log('Background Task Register');

  await BackgroundFetch.setMinimumIntervalAsync(1);
  return BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
    minimumInterval: 1, // minutes
    // stopOnTerminate: false, // android only option
    // startOnBoot: false // android only option
  });
}

// UnRegister Background Task
const unregisterBackgroundFetchAsync = async () => {
  console.log('Background Task UnRegister');

  // Reset Storage
  await AsyncStorage.removeItem(STORAGE_KEY);
  emitter.emit('changeMinute', '0');

  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;