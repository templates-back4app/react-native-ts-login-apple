import React, {FC, ReactElement, useEffect, useState} from 'react';
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Parse from 'parse/react-native';
import {GoogleSignin} from '@react-native-community/google-signin';
import {
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginManager,
} from 'react-native-fbsdk';
import {
  appleAuth,
  appleAuthAndroid,
} from '@invertase/react-native-apple-authentication';
import jwt_decode from 'jwt-decode';
import Styles from './Styles';

export const HelloUser: FC<{}> = ({}): ReactElement => {
  // State variable that will hold username value
  const [username, setUsername] = useState('');

  // useEffect is called after the component is initially rendered and
  // after every other render
  useEffect(() => {
    // Since the async method Parse.User.currentAsync is needed to
    // retrieve the current user data, you need to declare an async
    // function here and call it afterwards
    async function getCurrentUser() {
      // This condition ensures that username is updated only if needed
      if (username === '') {
        const currentUser = await Parse.User.currentAsync();
        if (currentUser !== null) {
          setUsername(currentUser.getUsername());
        }
      }
    }
    getCurrentUser();
  }, [username]);

  const doUserLinkGoogle = async function (): Promise<boolean> {
    try {
      // Check if your user can sign in using Google on his phone
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      // Retrieve user data from Google
      const userInfo: object = await GoogleSignin.signIn();
      const googleIdToken: string = userInfo.idToken;
      const googleUserId: string = userInfo.user.id;
      const authData: object = {
        id: googleUserId,
        id_token: googleIdToken,
      };
      let currentUser: Parse.User = await Parse.User.currentAsync();
      // Link user with his Google Credentials
      return await currentUser
        .linkWith('google', {
          authData: authData,
        })
        .then(async (loggedInUser: Parse.User) => {
          // logIn returns the corresponding ParseUser object
          Alert.alert(
            'Success!',
            `User ${loggedInUser.get(
              'username',
            )} has successfully linked his Google account!`,
          );
          // To verify that this is in fact the current user, currentAsync can be used
          currentUser = await Parse.User.currentAsync();
          console.log(loggedInUser === currentUser);
          return true;
        })
        .catch(async (error: object) => {
          // Error can be caused by wrong parameters or lack of Internet connection
          Alert.alert('Error!', error.message);
          return false;
        });
    } catch (error) {
      Alert.alert('Error!', error.code);
      return false;
    }
  };

  const doUserLinkFacebook = async function (): Promise<boolean> {
    try {
      // Login using the Facebook login dialog asking form email permission
      return await LoginManager.logInWithPermissions(['email']).then(
        (loginResult: object) => {
          if (loginResult.isCancelled) {
            console.log('Login cancelled');
            return false;
          } else {
            // Retrieve access token from FBSDK to be able to linkWith Parse
            AccessToken.getCurrentAccessToken().then((data: object) => {
              const facebookAccessToken = data.accessToken;
              // Callback that will be called after FBSDK successfuly retrieves user email and id from FB
              const responseEmailCallback = async (
                error: string,
                emailResult: object,
              ) => {
                if (error) {
                  console.log('Error fetching data: ' + error.toString());
                } else {
                  // Format authData to provide correctly for Facebook linkWith on Parse
                  const facebookId: string = emailResult.id;
                  const authData: object = {
                    id: facebookId,
                    access_token: facebookAccessToken,
                  };
                  let currentUser: Parse.User = await Parse.User.currentAsync();
                  return await currentUser
                    .linkWith('facebook', {
                      authData: authData,
                    })
                    .then(async (loggedInUser: Parse.User) => {
                      // logIn returns the corresponding ParseUser object
                      Alert.alert(
                        'Success!',
                        `User ${loggedInUser.get(
                          'username',
                        )} has successfully linked his Facebook account!`,
                      );
                      // To verify that this is in fact the current user, currentAsync can be used
                      currentUser = await Parse.User.currentAsync();
                      console.log(loggedInUser === currentUser);
                      return true;
                    })
                    .catch(async (linkWithError: object) => {
                      // Error can be caused by wrong parameters or lack of Internet connection
                      Alert.alert('Error!', linkWithError.message);
                      return false;
                    });
                }
              };

              // Formats a FBSDK GraphRequest to retrieve user email and id
              const emailRequest = new GraphRequest(
                '/me',
                {
                  accessToken: facebookAccessToken,
                  parameters: {
                    fields: {
                      string: 'email',
                    },
                  },
                },
                responseEmailCallback,
              );

              // Start the graph request, which will call the callback after finished
              new GraphRequestManager().addRequest(emailRequest).start();

              return true;
            });
          }
        },
        (error: string) => {
          console.log('Login fail with error: ' + error);
          return false;
        },
      );
    } catch (error: object) {
      Alert.alert('Error!', error.code);
      return false;
    }
  };

  const doUserLinkApple = async function (): Promise<boolean> {
    try {
      let response: object = {};
      let appleId: string = '';
      let appleToken: string = '';
      if (Platform.OS === 'ios') {
        // Performs login request requesting user email
        response = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL],
        });
        // On iOS, user ID and email are easily retrieved from request
        appleId = response.user;
        appleToken = response.identityToken;
      } else if (Platform.OS === 'android') {
        // Configure the request
        appleAuthAndroid.configure({
          // The Service ID you registered with Apple
          clientId: 'YOUR_SERVICE_ID',
          // Return URL added to your Apple dev console
          redirectUri: 'YOUR_SERVICE_URL',
          responseType: appleAuthAndroid.ResponseType.ALL,
          scope: appleAuthAndroid.Scope.ALL,
        });
        response = await appleAuthAndroid.signIn();
        // Decode user ID and email from token returned from Apple,
        // this is a common workaround for Apple sign-in via web API
        const decodedIdToken: object = jwt_decode(response.id_token);
        appleId = decodedIdToken.sub;
        appleToken = response.id_token;
      }
      // Format authData to provide correctly for Apple linkWith on Parse
      const authData: object = {
        id: appleId,
        token: appleToken,
      };
      let currentUser: Parse.User = await Parse.User.currentAsync();
      // Link user with his Apple Credentials
      return await currentUser
        .linkWith('apple', {
          authData: authData,
        })
        .then(async (loggedInUser: Parse.User) => {
          // logIn returns the corresponding ParseUser object
          Alert.alert(
            'Success!',
            `User ${loggedInUser.get(
              'username',
            )} has successfully linked his Apple account!`,
          );
          // To verify that this is in fact the current user, currentAsync can be used
          currentUser = await Parse.User.currentAsync();
          console.log(loggedInUser === currentUser);
          return true;
        })
        .catch(async (error: object) => {
          // Error can be caused by wrong parameters or lack of Internet connection
          Alert.alert('Error!', error.message);
          return false;
        });
    } catch (error: any) {
      // Error can be caused by wrong parameters or lack of Internet connection
      Alert.alert('Error!', error);
      return false;
    }
  };

  // Note the conditional operator here, so the "Hello" text is only
  // rendered if there is an username value
  return (
    <View style={Styles.login_wrapper}>
      <View style={Styles.form}>
        {username !== '' && <Text>{`Hello ${username}!`}</Text>}
      </View>
      <View style={Styles.login_social}>
        <View style={Styles.login_social_separator}>
          <View style={Styles.login_social_separator_line} />
          <Text style={Styles.login_social_separator_text}>
            {'Link your account to another auth provider'}
          </Text>
          <View style={Styles.login_social_separator_line} />
        </View>
        <View style={Styles.login_social_buttons}>
          <TouchableOpacity onPress={() => doUserLinkFacebook()}>
            <View
              style={[
                Styles.login_social_button,
                Styles.login_social_facebook,
              ]}>
              <Image
                style={Styles.login_social_icon}
                source={require('./assets/icon-facebook.png')}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => doUserLinkGoogle()}>
            <View style={Styles.login_social_button}>
              <Image
                style={Styles.login_social_icon}
                source={require('./assets/icon-google.png')}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => doUserLinkApple()}>
            <View style={Styles.login_social_button}>
              <Image
                style={Styles.login_social_icon}
                source={require('./assets/icon-apple.png')}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
