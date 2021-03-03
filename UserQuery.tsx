import React, {FC, ReactElement, useState} from 'react';
import {Alert, Button, TextInput} from 'react-native';
import Parse from 'parse/react-native';

export const UserQuery: FC<{}> = ({}): ReactElement => {
  const [usernameSearch, setUsernameSearch] = useState('');

  const searchUsername = async function (): Promise<[Parse.User]> {
    const parseQuery: Parse.Query = new Parse.Query('User');
    const usernameSearchText: string = usernameSearch;
    // Several query functions can be called, this one will retrieve ParseUser whose username contain 'foo'
    parseQuery.contains('username', usernameSearchText);
    return await parseQuery
      .find()
      .then(async (queriedUsers: [Parse.User]) => {
        // Be aware that empty or invalid queries return as an empty array
        if (queriedUsers.length > 0) {
          Alert.alert(
            'Success!',
            `${queriedUsers.length} users were found containing "${usernameSearchText}" in their username`,
          );
        } else {
          Alert.alert(
            'Warning!',
            `No users were found containing "${usernameSearchText}" in their username`,
          );
        }
        return queriedUsers;
      })
      .catch((error: object) => {
        // Error can be caused by lack of Internet connection
        Alert.alert('Error!', error.message);
        return [];
      });
  };

  const getLatestUser = async function (): Promise<Parse.User> {
    const parseQuery: Parse.Query = new Parse.Query('User');
    // Several query functions can be called, this one will retrieve ParseUser whose username contain 'foo'
    parseQuery.addDescending('createdAt');
    return await parseQuery
      .first()
      .then(async (queriedUser: Parse.User) => {
        // Be aware that empty or invalid queries return as an empty array
        if (queriedUser !== null) {
          Alert.alert(
            'Success!',
            `${queriedUser.get(
              'username',
            )} is the latest user, created on ${queriedUser.get('createdAt')}`,
          );
        } else {
          Alert.alert('Warning!', 'No users where created yet!');
        }
        return queriedUser;
      })
      .catch((error: object) => {
        // Error can be caused by lack of Internet connection
        Alert.alert('Error!', error.message);
        return null;
      });
  };

  return (
    <>
      <TextInput
        value={usernameSearch}
        placeholder={'Username Search'}
        onChangeText={(text) => setUsernameSearch(text)}
        autoCapitalize={'none'}
      />
      <Button title={'Search Username'} onPress={() => searchUsername()} />
      <Button title={'Get Latest User'} onPress={() => getLatestUser()} />
    </>
  );
};
