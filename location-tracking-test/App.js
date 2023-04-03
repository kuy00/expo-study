import { StyleSheet, View, Button, Text, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import haversine from 'haversine';

const App = () => {
  const BACKGROUND_TASK = 'background-fetch';
  const [location, setLocation] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [coordinate, setCoordinate] = useState({
    latitude: 37.545834,
    longitude: 126.955876,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  });
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [kcal, setKcal] = useState(0);

  // Background Task
  TaskManager.defineTask(BACKGROUND_TASK, ({ data: { locations }, error }) => {
    if (error) {
      console.log(error);
      return;
    }
    
    locations.forEach(element => {
      handleCoordinate(element);
    });    
  });

  const tracking = () => {
    setIsTracking(!isTracking);

    if (isTracking) {
      stopTrackingLocation();      
    } else {
      startTrackingLocation();
    }
  }

  // Start Tracking
  const startTrackingLocation = async () => {
    setRoute([]);
    console.log('Start Tracking Location');

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    console.log('Foreground Tracking Location');
    if (foregroundStatus === 'granted') {
      // Get Current Locatoin
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      handleCoordinate(currentLocation);

      // Watch Location In Foreground
      let location = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Accurate to within one hundred meters.
          timeInterval: 300, // 300 milliseconds
          distanceInterval: 1, // 1 meters
        }, (loc) => handleCoordinate(loc)
      );

      setLocation(location);
    }

    if (Platform.OS === 'android') {
      console.log('Background Tracking Location');
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
          accuracy: Location.Accuracy.Balanced, // Accurate to within one hundred meters.
          deferredUpdatesDistance: 10, // 1 meters
          deferredUpdatesInterval: 300, // 300 milliseconds
        });
      }
    }

    checkStatusAsync();
  }

  // Check Task
  const checkStatusAsync = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    setIsRegistered(isRegistered);
  };

  // Stop Tracking
  const stopTrackingLocation = async () => {
    console.log('Stop Tracking Location');
    
    // Background
    await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
    // Foreground
    await location.remove();

    checkStatusAsync();
  }

  // Handle Coordinate
  const handleCoordinate = (coordinate) => {
    let temp = {
      latitude: coordinate.coords.latitude,
      longitude: coordinate.coords.longitude,
    };

    console.log('Change Location');
    console.log(temp);

    setRoute((route) => route.concat(temp));
    setCoordinate(Object.assign({}, coordinate, temp));
  }

  useEffect(() => {
    if (route.length > 1) {
      let distance = haversine(route[0], route[route.length - 1]);
      setDistance(distance);
      setKcal(distance / 0.1 * 7);
    } else {
      setDistance(0);
      setKcal(0);
    }
  }, [route])

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map}
          region={coordinate}
          showUserLocation={true}
          loadingEnabled={true}
          followUserLocation={true}
          >
          <Marker
            coordinate={coordinate}
          />
          <Polyline
            coordinates={route}
            strokeWidth={5}
          />
        </MapView>
      </View>
      <Button 
        title={ isTracking ? '종료' : '시작' }
        onPress={tracking}
      />
      <View>
        <Text>
          거리 : {distance.toFixed(3)} km
        </Text>
      </View>
      <View>
        <Text>
          칼로리 : {kcal.toFixed(3)} kcal
        </Text>
      </View>
      <View>
        <Text>
          { isRegistered ? 'Watch Background Location' : '' }
        </Text>
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
  mapContainer: {
    width: '90%',
    height: 400,
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default App;