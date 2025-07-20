import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react'

const SafeScreen = ({children}) => {

  const insets = useSafeAreaInsets();
  return (
    <View style={{paddingTop:insets.top, flex:1}}>
      {children}
    </View>
  )
}

export default SafeScreen;