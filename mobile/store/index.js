import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  userAddress: '',
  userLongitude: null,
  userLatitude: null,
  destinationLongitude: null,
  destinationLatitude: null,
  destinationAddress: '',

  setUserAddress: (address) =>
    set(() => ({
      userAddress: address,
    })),

  setDestinationAddress: (address) =>
    set(() => ({
      destinationAddress: address,
    })),

  setUserLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      userLatitude: latitude,
      userLongitude: longitude,
      userAddress: address,
    })),

  setDestinationLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      destinationLatitude: latitude,
      destinationLongitude: longitude,
      destinationAddress: address,
    })),
}));
