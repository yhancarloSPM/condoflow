import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import DebtsScreen from '../screens/DebtsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import CreatePaymentScreen from '../screens/CreatePaymentScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RequestsScreen from '../screens/RequestsScreen';
import QueriesScreen from '../screens/QueriesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Componente temporal para las pantallas que aún no están implementadas
function PlaceholderScreen({ route }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>
        {route.name}
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280' }}>
        Próximamente disponible
      </Text>
    </View>
  );
}

function CustomDrawerContent(props: any) {
  const { signOut, user } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.apartment && (
          <Text style={styles.apartmentText}>{user.apartment}</Text>
        )}
      </View>

      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
        
        <View style={styles.divider} />
        
        <DrawerItem
          label="Cerrar Sesión"
          onPress={signOut}
          labelStyle={styles.logoutLabel}
          style={styles.logoutItem}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Stack para el tab de Solicitudes
function RequestsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RequestsMain" component={RequestsScreen} />
      <Stack.Screen name="CreatePayment" component={CreatePaymentScreen} />
      <Stack.Screen name="Reservations" component={PlaceholderScreen} />
      <Stack.Screen name="Incidents" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

// Stack para el tab de Consultas
function QueriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QueriesMain" component={QueriesScreen} />
      <Stack.Screen name="DebtsMenu" component={DebtsScreen} />
      <Stack.Screen name="PaymentsMenu" component={PaymentsScreen} />
      <Stack.Screen name="Announcements" component={PlaceholderScreen} />
      <Stack.Screen name="Polls" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={() => ({
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.65)',
        tabBarStyle: {
          backgroundColor: '#1e40af',
          borderTopWidth: 0,
          paddingBottom: 6,
          paddingTop: 6,
          height: 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Options"
        component={DashboardScreen}
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              width: 24, 
              height: 24, 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: focused ? 1 : 0.65,
            }}>
              <View style={{ 
                width: 7, 
                height: 7, 
                backgroundColor: color, 
                borderRadius: 1.5,
                position: 'absolute',
                top: 0,
                left: 0,
              }} />
              <View style={{ 
                width: 7, 
                height: 7, 
                backgroundColor: color, 
                borderRadius: 1.5,
                position: 'absolute',
                top: 0,
                right: 0,
              }} />
              <View style={{ 
                width: 7, 
                height: 7, 
                backgroundColor: color, 
                borderRadius: 1.5,
                position: 'absolute',
                bottom: 0,
                left: 0,
              }} />
              <View style={{ 
                width: 7, 
                height: 7, 
                backgroundColor: color, 
                borderRadius: 1.5,
                position: 'absolute',
                bottom: 0,
                right: 0,
              }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsStack}
        options={{
          title: 'Solicitudes',
          tabBarLabel: 'Solicitudes',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              width: 24, 
              height: 24, 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: focused ? 1 : 0.65,
            }}>
              <View style={{ 
                width: 22, 
                height: 22, 
                borderWidth: 2.5, 
                borderColor: color, 
                borderRadius: 3,
              }}>
                <View style={{ 
                  width: 11, 
                  height: 2, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 4,
                  left: 3.5,
                }} />
                <View style={{ 
                  width: 11, 
                  height: 2, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 9,
                  left: 3.5,
                }} />
                <View style={{ 
                  width: 11, 
                  height: 2, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 14,
                  left: 3.5,
                }} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Queries"
        component={QueriesStack}
        options={{
          title: 'Consultas',
          tabBarLabel: 'Consultas',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              width: 24, 
              height: 24, 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: focused ? 1 : 0.65,
            }}>
              <View style={{ 
                width: 18, 
                height: 18, 
                borderWidth: 2.5, 
                borderColor: color, 
                borderRadius: 9,
              }} />
              <View style={{ 
                width: 7, 
                height: 2.5, 
                backgroundColor: color, 
                position: 'absolute',
                bottom: 0,
                right: 0,
                transform: [{ rotate: '45deg' }],
              }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TabDashboard"
        component={OwnerDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              width: 24, 
              height: 24, 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: focused ? 1 : 0.65,
            }}>
              <View style={{ 
                width: 22, 
                height: 22, 
                borderWidth: 2.5, 
                borderColor: color, 
                borderRadius: 3,
              }}>
                <View style={{ 
                  width: 7, 
                  height: 2, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 4,
                  left: 5.5,
                }} />
                <View style={{ 
                  width: 7, 
                  height: 2, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 9,
                  left: 5.5,
                }} />
                <View style={{ 
                  width: 2, 
                  height: 7, 
                  backgroundColor: color, 
                  position: 'absolute',
                  top: 4,
                  left: 2.5,
                }} />
              </View>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Drawer.Navigator
      id="mainDrawer"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1e40af',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: 0.3,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={{
              marginLeft: 15,
              padding: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>
              ☰
            </Text>
          </TouchableOpacity>
        ),
        headerRight: () => {
          const { user } = useAuth();
          const { unreadCount } = useNotifications();
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, gap: 12 }}>
              {user?.apartment && (
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' }}>
                  {user.apartment}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={{
                  padding: 4,
                  position: 'relative',
                }}
              >
                <Text style={{ fontSize: 22 }}>
                  🔔
                </Text>
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: '700',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        },
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
        },
        drawerActiveTintColor: '#1e40af',
        drawerInactiveTintColor: '#4b5563',
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 0,
        },
        drawerItemStyle: {
          borderRadius: 10,
          marginHorizontal: 12,
          marginVertical: 0,
          paddingVertical: 0,
          height: 44,
        },
        drawerActiveBackgroundColor: '#eff6ff',
        drawerContentStyle: {
          paddingTop: 0,
        },
      })}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          drawerLabel: 'Inicio',
          title: 'Inicio',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          drawerLabel: 'Mi Perfil',
          title: 'Mi Perfil',
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Notificaciones',
        }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerHeader: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 44,
    paddingBottom: 20,
    marginBottom: 8,
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.1,
  },
  apartmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutLabel: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
