// components/BottomNav.jsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Colors from '../app/Constant_Design';

const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'Map', icon: require('../assets/images/map_icon.png'), route: '/' },
    { name: 'Routes', icon: require('../assets/images/bookmark_icon.png'), route: '/routes' },
    { name: 'Notifs', icon: require('../assets/images/notifs_icon.png'), route: '/notifs' },
    { name: 'Settings', icon: require('../assets/images/settings_icon.png'), route: '/settings' },
  ];

  const handleNav = (route) => {
    if (pathname !== route) {
      router.push(route);
    }
    // else do nothing
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleNav(item.route)}
              style={[styles.button, isActive && styles.activeButton]}
            >
              <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  button: {
    backgroundColor: Colors.secondary,
    borderRadius: 40,
    padding: 14,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

export default BottomNav;


