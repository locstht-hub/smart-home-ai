import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RoomsScreen from '../screens/RoomsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const APP_LOGO = require('../../assets/icon.png');

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ label, focused, iconName }: { label: string; focused: boolean; iconName: TabIconName }) {
    const color = focused ? '#0f766e' : '#80918a';

    return (
        <View style={{ alignItems: 'center', gap: 2 }} accessible={false} importantForAccessibility="no-hide-descendants">
            <View style={{ width: 28, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={iconName} size={21} color={color} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: focused ? '800' : '600', color }}>{label}</Text>
        </View>
    );
}

function MainTabs() {
    const { user } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 8,
                    backgroundColor: 'rgba(248,251,249,0.97)',
                    borderTopColor: '#dce7e1',
                    shadowColor: '#173a31',
                    shadowOpacity: 0.08,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: -8 },
                    elevation: 10,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ tabBarAccessibilityLabel: 'Tổng quan', tabBarIcon: ({ focused }) => <TabIcon label="Tổng quan" focused={focused} iconName={focused ? 'home' : 'home-outline'} /> }}
            />
            <Tab.Screen
                name="RoomList"
                component={RoomsScreen}
                options={{ tabBarAccessibilityLabel: 'Danh sách phòng', tabBarIcon: ({ focused }) => <TabIcon label="Phòng" focused={focused} iconName={focused ? 'bed' : 'bed-outline'} /> }}
            />
            <Tab.Screen
                name="Analysis"
                component={AnalysisScreen}
                options={{ tabBarAccessibilityLabel: 'Phân tích điện năng', tabBarIcon: ({ focused }) => <TabIcon label="Phân tích" focused={focused} iconName={focused ? 'analytics' : 'analytics-outline'} /> }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{ tabBarAccessibilityLabel: 'Trợ lý hội thoại', tabBarIcon: ({ focused }) => <TabIcon label="Chat" focused={focused} iconName={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} /> }}
            />
            {user?.role === 'admin' && (
                <Tab.Screen
                    name="Admin"
                    component={AdminScreen}
                    options={{ tabBarAccessibilityLabel: 'Quản lý hệ thống', tabBarIcon: ({ focused }) => <TabIcon label="Quản lý" focused={focused} iconName={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} /> }}
                />
            )}
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarAccessibilityLabel: 'Cài đặt', tabBarIcon: ({ focused }) => <TabIcon label="Cài đặt" focused={focused} iconName={focused ? 'settings' : 'settings-outline'} /> }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Đang tải ứng dụng Smart Home"
            >
                <Image source={APP_LOGO} style={{ width: 40, height: 40, borderRadius: 10 }} />
                <Text style={{ marginTop: 10, color: Colors.slate[500] }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}
