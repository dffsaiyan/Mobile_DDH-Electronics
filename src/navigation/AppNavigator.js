import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, StatusBar, 
  Dimensions, Image
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useCart } from '../context/CartContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import AccountScreen from '../screens/AccountScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import WishlistScreen from '../screens/WishlistScreen';
import BlogListScreen from '../screens/BlogListScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';

const { width } = Dimensions.get('window');
const Stack = createStackNavigator();

// 🔘 BOTTOM TAB BAR (RESTORED TO 4 TABS)
const BottomTabBar = ({ navigation, activeTab }) => {
  const { totalItems } = useCart();
  const tabs = [
    { key: 'Home', icon: 'home', label: 'Trang chủ' },
    { key: 'ProductList', icon: 'th-large', label: 'Sản phẩm' },
    { key: 'Cart', icon: 'shopping-cart', label: 'Giỏ hàng', badge: totalItems },
    { key: 'Account', icon: 'user-circle', label: 'Tài khoản' },
  ];

  return (
    <View style={tabStyles.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={tabStyles.tab} onPress={() => navigation.navigate(tab.key)} activeOpacity={0.7}>
            <View style={[tabStyles.iconWrapper, isActive && { backgroundColor: `${Colors.secondary}15` }]}>
              <Icon name={tab.icon} size={18} color={isActive ? Colors.secondary : Colors.muted} solid={isActive} />
              {tab.badge > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const HomeTabsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');

  const handleTabNavigation = (tabKey) => setActiveTab(tabKey);

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': return <HomeScreen navigation={navigation} />;
      case 'ProductList': return <ProductListScreen navigation={navigation} />;
      case 'Cart': return <CartScreen navigation={navigation} />;
      case 'Account': return <AccountScreen navigation={navigation} />;
      default: return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <BottomTabBar navigation={{ navigate: handleTabNavigation }} activeTab={activeTab} />
    </View>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeTabs" component={HomeTabsScreen} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const tabStyles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingBottom: 25, paddingTop: 10, ...Shadow.large },
  tab: { flex: 1, alignItems: 'center' },
  iconWrapper: { width: 44, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelActive: { color: Colors.secondary, fontWeight: '800' },
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: Colors.secondary, borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { fontSize: 8, fontWeight: '900', color: Colors.white },
});

export default AppNavigator;
