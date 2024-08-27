import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [token, setToken] = useState('');
  const [idToken, setIdToken] = useState(''); 
  const [userInfo, setUserInfo] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '',
    iosClientId: '359873567972-6co6dok1tdb5q2gomf97ru4o2965ifcu.apps.googleusercontent.com',
    webClientId: '',
  });

  useEffect(() => {
    handleEffect();
  }, [response, token]);

  async function handleEffect() {
    const user = await getLocalUser();
    if (!user) {
      if (response?.type === 'success') {
        const { accessToken, idToken, refreshToken, expiresIn } = response.authentication;
        await saveTokens(accessToken, idToken, refreshToken, expiresIn);
        await getUserInfo(accessToken);
      }
    } else {
      setUserInfo(user);
    }
  }

  const saveTokens = async (accessToken, idToken, refreshToken, expiresIn) => {
    const expirationDate = new Date().getTime() + expiresIn * 1000;
    await AsyncStorage.setItem('@accessToken', accessToken);
    await AsyncStorage.setItem('@idToken', idToken); 
    await AsyncStorage.setItem('@refreshToken', refreshToken);
    await AsyncStorage.setItem('@tokenExpirationDate', expirationDate.toString());
    setToken(accessToken);
    setIdToken(idToken); 
  };

  const getLocalUser = async () => {
    const data = await AsyncStorage.getItem('@user');
    if (!data) return null;
    return JSON.parse(data);
  };

  const refreshAccessToken = async () => {
    const refreshToken = await AsyncStorage.getItem('@refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded','Cross-Origin-Embedder-Policy': 'unsafe-none' },
        body: `client_id=359873567972-6co6dok1tdb5q2gomf97ru4o2965ifcu.apps.googleusercontent.com&refresh_token=${refreshToken}&grant_type=refresh_token`,
      });

      const data = await response.json();
      console.log(data)
      if (data.access_token) {
        const { access_token, expires_in,id_token } = data;
        await saveTokens(access_token, id_token, refreshToken, expires_in);
        return access_token;
      } else {
        console.error('Failed to refresh access token', data);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  };

  const getUserInfo = async (token) => {
    if (!token) return;
    try {
      const expirationDate = await AsyncStorage.getItem('@tokenExpirationDate');
      if (new Date().getTime() > parseInt(expirationDate)) {
        token = await refreshAccessToken();
      }

      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = await response.json();
      await AsyncStorage.setItem('@user', JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const accessProtectedRoute = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('@accessToken');
      if (!accessToken) throw new Error('No access token found');

      const response = await fetch('http://localhost:3100/protected', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Protected data:', data);
        alert(`Access granted: ${JSON.stringify(data.user)}`);
      } else {
        console.error('Access denied:', data);
        alert('Access denied');
      }
    } catch (error) {
      console.error('Error accessing protected route:', error);
      alert('Error accessing protected route');
    }
  };

  return (
    <View style={styles.container}>
      {!userInfo ? (
        <Button
          title="Sign in with Google"
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        />
      ) : (
        <View style={styles.card}>
          {userInfo?.picture && (
            <Image source={{ uri: userInfo?.picture }} style={styles.image} />
          )}
          <Text style={styles.text}>Email: {userInfo.email}</Text>
          <Text style={styles.text}>
            Verified: {userInfo.verified_email ? 'yes' : 'no'}
          </Text>
          <Text style={styles.text}>Name: {userInfo.name}</Text>
          <Text style={styles.text}>ID Token: {idToken}</Text> {/* Display the id_token */}
        </View>
      )}
      <Button
        title="Access Protected Route"
        onPress={accessProtectedRoute}
      />
      <Button
        title="Remove local store"
        onPress={async () => await AsyncStorage.removeItem('@user')}
      />
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
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
