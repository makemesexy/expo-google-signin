import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button } from "react-native";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";

// npx expo install @react-native-google-signin/google-signin
// npx expo install expo-dev-client

export default function App() {
  const [error, setError] = useState();
  const [userInfo, setUserInfo] = useState();
  const [serverResponse, setServerResponse] = useState(); // State to hold server response

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      // webClientId: "359873567972-6co6dok1tdb5q2gomf97ru4o2965ifcu.apps.googleusercontent.com",
      // androidClientId: "359873567972-6co6dok1tdb5q2gomf97ru4o2965ifcu.apps.googleusercontent.com",
      iosClientId: "359873567972-3imfh37cgspt6697uiep94546a4r31fc.apps.googleusercontent.com",
    });
  };

  useEffect(() => {
    configureGoogleSignIn();
  });

  const signIn = async () => {
    console.log("Pressed sign in");

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Extract idToken
      const { idToken, accessToken } = await GoogleSignin.getTokens();

      // Print tokens to console
      console.log("ID Token:", idToken);
      console.log("Access Token:", accessToken);

      // Send POST request to your backend
      // const response = await fetch(
      //   "https://auth-test.greenhill-b1c87b1f.westus2.azurecontainerapps.io/.auth/login/google/callback",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ id_token: idToken }),
      //   }
      // );

      // // Log and save the server response
      // const responseData = await response.json();
      // console.log("Server Response:", responseData);
      // setServerResponse(responseData);

      // Save user info and clear any previous errors
      setUserInfo(userInfo);
      setError();
    } catch (e) {
      // Handle errors
      setError(e);
      console.error("Sign-in error:", e);
    }
  };

  const logout = () => {
    setUserInfo(undefined);
    GoogleSignin.revokeAccess();
    GoogleSignin.signOut();
  };

  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(error)}</Text>
      {serverResponse && <Text>Server Response: {JSON.stringify(serverResponse)}</Text>}
      {userInfo && <Text>{JSON.stringify(userInfo.user)}</Text>}
      {userInfo ? (
        <Button title="Logout" onPress={logout} />
      ) : (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Dark}
          onPress={signIn}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
