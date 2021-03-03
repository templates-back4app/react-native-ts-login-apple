import React, {FC, ReactElement, useState} from 'react';
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Parse from 'parse/react-native';
import {useNavigation} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';
import Styles from './Styles';

export const UserRegistration: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doUserSignUp = async function (): Promise<boolean> {
    // Note that this values come from state variables that we've declared before
    const emailValue: string = email;
    const passwordValue: string = password;
    // Since the signUp method returns a Promise, we need to call it using await
    // Note that now you are setting the user email value as well
    return await Parse.User.signUp(emailValue, passwordValue, {
      email: emailValue,
    })
      .then(async (createdUser: Parse.User) => {
        // Parse.User.signUp returns the already created ParseUser object if successful
        Alert.alert(
          'Success!',
          `User ${createdUser.get(
            'username',
          )} was successfully created! Verify your email to login`,
        );
        // Since email verification is now required, make sure to log out
        // the new user, so any Session created is cleared and the user can
        // safely log in again after verifying
        await Parse.User.logOut();
        // Go back to the login page
        navigation.dispatch(StackActions.popToTop());
        return true;
      })
      .catch((error: object) => {
        // signUp can fail if any parameter is blank or failed an uniqueness check on the server
        Alert.alert('Error!', error.message);
        return false;
      });
  };

  return (
    <View style={Styles.login_wrapper}>
      <View style={Styles.form}>
        <TextInput
          style={Styles.form_input}
          value={email}
          placeholder={'Email'}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize={'none'}
          keyboardType={'email-address'}
        />
        <TextInput
          style={Styles.form_input}
          value={password}
          placeholder={'Password'}
          secureTextEntry
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity onPress={() => doUserSignUp()}>
          <View style={Styles.button}>
            <Text style={Styles.button_label}>{'Sign Up'}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={Styles.login_social}>
        <View style={Styles.login_social_separator}>
          <View style={Styles.login_social_separator_line} />
          <Text style={Styles.login_social_separator_text}>{'or'}</Text>
          <View style={Styles.login_social_separator_line} />
        </View>
        <View style={Styles.login_social_buttons}>
          <TouchableOpacity>
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
          <TouchableOpacity>
            <View style={Styles.login_social_button}>
              <Image
                style={Styles.login_social_icon}
                source={require('./assets/icon-google.png')}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={Styles.login_social_button}>
              <Image
                style={Styles.login_social_icon}
                source={require('./assets/icon-apple.png')}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={Styles.login_footer_text}>
            {'Already have an account? '}
            <Text style={Styles.login_footer_link}>{'Log In'}</Text>
          </Text>
        </TouchableOpacity>
      </>
    </View>
  );
};
