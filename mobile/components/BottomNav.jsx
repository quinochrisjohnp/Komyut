// components/BottomNav.jsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Colors from '../app/Constant_Design';

const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  // (--------> changes here "added activeIcon for each nav item")
  const navItems = [
    { 
      name: 'Map', 
      icon: require('../assets/images/main-icon.png'), 
      activeIcon: require('../assets/images/main-selected-icon.png'), 
      route: '/' 
    },
    { 
      name: 'Routes', 
      icon: require('../assets/images/saved-route-logo.png'), 
      activeIcon: require('../assets/images/saved-route-selected-logo.png'), 
      route: '/routes' 
    },
    { 
      name: 'Notifs', 
      icon: require('../assets/images/notif-icon.png'), 
      activeIcon: require('../assets/images/notif-selected-icon.png'), 
      route: '/notifs' 
    },
    { 
      name: 'Settings', 
      icon: require('../assets/images/settings_icon.png'), 
      activeIcon: require('../assets/images/settings_icon.png'), 
      route: '/settings' 
    },
  ];
  // (--------> end change)

  const handleNav = (route) => {
    if (pathname !== route) {
      router.push(route);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.route;
          // (--------> changes here "switch icon based on active state")
          const currentIcon = isActive ? item.activeIcon : item.icon;
          // (--------> end change)

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleNav(item.route)}
              style={[styles.button, isActive && styles.activeButton]}
            >
              <Image source={currentIcon} style={styles.icon} resizeMode="contain" />
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
    marginBottom: 0,
        bottom: 50, 
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    bottom: -50, 
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: Colors.secondary,
    borderRadius: 40,
    padding: 0,
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  icon: {
    width: 55,
    height: 55,
  },
});

export default BottomNav;
